import { getFipsCodes, getDemographics, getPopulationGrowth } from '../../../lib/census.js';
import { calculateScore } from '../../../lib/scoring.js';
import { generateSummary } from '../../../lib/summary.js';
import { getWalkScore } from '../../../lib/walkscore.js';
import { enrichCompetitors } from '../../../lib/google-places.js';
import { industries } from '../../../lib/industry-config.js';
import { evaluateUpsideRisks } from '../../../lib/upside-risks.js';
import { deriveWinStrategy, deriveMarketCapacity, deriveNextSteps } from '../../../lib/report-derived.js';
import { getDentalProvidersByZip, getDentalProvidersByCity, computeNPIStats } from '../../../lib/npi-registry.js';
import { getInsuranceCoverage } from '../../../lib/payer-mix.js';
import { getStateMedicaidDental } from '../../../lib/state-dental-medicaid.js';
import { getCountyWorkforce } from '../../../lib/lehd-workforce.js';
import { checkRateLimit } from '../../../lib/rate-limit.js';

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// ─── Overpass with retry, multiple mirrors, and in-memory cache ───

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

// Simple in-memory cache — survives across requests within the same server process
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  // Prevent unbounded growth — evict oldest if > 500 entries
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryOverpassOnce(query, endpoints) {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429 || res.status === 504) {
        console.warn(`Overpass ${endpoint} returned ${res.status}, trying next...`);
        continue;
      }

      if (!res.ok) {
        console.warn(`Overpass ${endpoint} returned ${res.status}, trying next...`);
        continue;
      }

      const text = await res.text();
      if (text.startsWith('<?xml') || text.startsWith('<html') || text.startsWith('<!')) {
        console.warn(`Overpass ${endpoint} returned HTML/XML error, trying next...`);
        continue;
      }

      const data = JSON.parse(text);
      if (data.elements) return data;
    } catch (e) {
      console.warn(`Overpass ${endpoint} failed:`, e.message);
    }
  }
  return null;
}

async function queryOverpassWithRetry(query, cacheKey) {
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`Overpass cache hit: ${cacheKey}`);
    return cached;
  }

  // Attempt 1: try all endpoints
  let result = await queryOverpassOnce(query, OVERPASS_ENDPOINTS);
  if (result && result.elements?.length > 0) {
    setCache(cacheKey, result);
    return result;
  }

  // Attempt 2: wait 2s, shuffle endpoints, try again
  console.warn(`Overpass attempt 1 failed/empty for ${cacheKey}, retrying in 2s...`);
  await sleep(2000);
  const shuffled = [...OVERPASS_ENDPOINTS].sort(() => Math.random() - 0.5);
  result = await queryOverpassOnce(query, shuffled);
  if (result && result.elements?.length > 0) {
    setCache(cacheKey, result);
    return result;
  }

  // Attempt 3: wait 3s more, try primary endpoint only
  console.warn(`Overpass attempt 2 failed/empty for ${cacheKey}, final retry in 3s...`);
  await sleep(3000);
  result = await queryOverpassOnce(query, [OVERPASS_ENDPOINTS[0]]);
  if (result) {
    setCache(cacheKey, result);
    return result;
  }

  return { elements: [] };
}

// ─── Tag-type lookup for Overpass queries ───
// Maps known OSM tag values to their key (amenity, shop, highway, tourism).
const TAG_TYPE_MAP = {
  // amenity
  hospital: 'amenity', clinic: 'amenity', school: 'amenity', pharmacy: 'amenity',
  dentist: 'amenity', restaurant: 'amenity', fast_food: 'amenity', cafe: 'amenity',
  bar: 'amenity', pub: 'amenity', nightclub: 'amenity', biergarten: 'amenity',
  hotel: 'amenity', theatre: 'amenity', cinema: 'amenity', parking: 'amenity',
  veterinary: 'amenity', doctors: 'amenity', bank: 'amenity', fuel: 'amenity',
  childcare: 'amenity', kindergarten: 'amenity', library: 'amenity',
  community_centre: 'amenity', place_of_worship: 'amenity', ice_cream: 'amenity',
  // shop
  mall: 'shop', supermarket: 'shop', convenience: 'shop', clothes: 'shop',
  hairdresser: 'shop', beauty: 'shop', bakery: 'shop', butcher: 'shop',
  florist: 'shop', pet: 'shop', alcohol: 'shop', wine: 'shop',
  // highway
  bus_stop: 'highway',
  // tourism
  attraction: 'tourism', museum: 'tourism', gallery: 'tourism',
  hotel_tourism: 'tourism', guest_house: 'tourism', hostel: 'tourism',
  viewpoint: 'tourism', information: 'tourism',
};

function getTagType(value) {
  return TAG_TYPE_MAP[value] || 'amenity';
}

// ─── Parse helpers ───

function parseCompetitors(data, config) {
  return (data.elements || []).map((el) => {
    const tags = el.tags || {};
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    const cityState = [tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ');
    const addr = [street, cityState, tags['addr:postcode']].filter(Boolean).join(', ');

    return {
      name: tags.name || config.fallbackName,
      address: addr || null,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
    };
  }).filter((c) => c.lat && c.lon);
}

function parseAnchors(data, config) {
  const anchors = {};
  for (const [label, category] of Object.entries(config.poiCategories)) {
    const tags = category.tags;
    const items = (data.elements || []).filter((el) => {
      const amenity = el.tags?.amenity || '';
      const shop = el.tags?.shop || '';
      const highway = el.tags?.highway || '';
      const tourism = el.tags?.tourism || '';
      return tags.includes(amenity) || tags.includes(shop) || tags.includes(highway) || tags.includes(tourism);
    });
    anchors[label] = {
      count: items.length,
      items: items.slice(0, 5).map((el) => ({
        name: el.tags?.name || label.replace(/s$/, ''),
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
      })),
    };
  }
  return anchors;
}

// ─── Main handler ───

export async function GET(request) {
  // Per-IP rate limit. We cannot require auth here because the free-preview
  // funnel calls /api/analyze before the user is authenticated. 10 requests
  // per hour per IP is generous for a real customer evaluating several
  // addresses but shuts down a scraper quickly.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`analyze:${ip}`, {
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return Response.json(
      { error: 'Too many analysis requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return Response.json({ error: 'Address is required' }, { status: 400 });
  }

  const industry = searchParams.get('industry') || 'dental';
  const config = industries[industry] || industries.dental;

  try {
    // Step 1: Geocode address via Nominatim
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1&countrycodes=us`,
      {
        headers: { 'User-Agent': config.userAgent },
        signal: AbortSignal.timeout(10000),
      }
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return Response.json({ error: 'Could not find that address. Please try a more specific U.S. address.' }, { status: 404 });
    }

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    const displayAddress = geoData[0].display_name;
    // Address details for downstream lookups (NPI Registry, etc.)
    const geoDetails = geoData[0].address || {};
    const postalCode = geoDetails.postcode || null;
    const cityName = geoDetails.city || geoDetails.town || geoDetails.village || null;
    const stateName = geoDetails.state || null;

    // If the forward geocode returned a postcode, the user gave a specific
    // address — use the ZIP for tight-scoped lookups. If not (vague queries
    // like "Dayton, Ohio"), use the city/state for broader lookups instead.
    // We deliberately don't reverse-geocode the centroid to a ZIP, because
    // that ZIP is essentially random (whichever ZIP the city centroid happens
    // to fall in) and produces misleading "Provider Landscape" counts.
    const isSpecificAddress = postalCode != null;

    // Round coords for cache key consistency (3 decimal places = ~100m precision)
    const cLat = lat.toFixed(3);
    const cLon = lon.toFixed(3);

    // Step 2: Build Overpass queries dynamically from industry config
    const competitorClauses = config.overpassAmenities
      .map((a) => {
        const key = getTagType(a);
        return `node["${key}"="${a}"](around:5633,${lat},${lon});way["${key}"="${a}"](around:5633,${lat},${lon});relation["${key}"="${a}"](around:5633,${lat},${lon});`;
      })
      .join('');
    const competitorQuery = `[out:json][timeout:25];(${competitorClauses});out center;`;

    const poiClauses = Object.values(config.poiCategories)
      .flatMap((category) =>
        category.tags.map((tag) => {
          const key = getTagType(tag);
          // bus_stop only needs node queries
          if (key === 'highway') {
            return `node["${key}"="${tag}"](around:5633,${lat},${lon});`;
          }
          return `node["${key}"="${tag}"](around:5633,${lat},${lon});way["${key}"="${tag}"](around:5633,${lat},${lon});`;
        })
      )
      .join('\n      ');
    const poiQuery = `[out:json][timeout:25];(\n      ${poiClauses}\n    );out center;`;

    // Step 3: Run Census + Walk Score in parallel with Overpass (staggered)
    const fipsPromise = getFipsCodes(lat, lon);
    const walkScorePromise = getWalkScore(displayAddress, lat, lon);

    // Run competitor query first, then POI query (staggered to avoid rate limits)
    const competitorData = await queryOverpassWithRetry(competitorQuery, `comp:${industry}:${cLat},${cLon}`);
    await sleep(500); // brief pause between Overpass calls
    const poiData = await queryOverpassWithRetry(poiQuery, `poi:${industry}:${cLat},${cLon}`);

    // Await Census + Walk Score (likely already done by now)
    const [fips, walkScoreData] = await Promise.all([fipsPromise, walkScorePromise]);

    // Parse results
    const rawCompetitors = parseCompetitors(competitorData, config);
    const anchors = parseAnchors(poiData, config);

    // Step 4: Enrich competitors with Google Places data (ratings, reviews)
    const { competitors, avgRating: avgCompetitorRating, totalReviews: totalCompetitorReviews } =
      await enrichCompetitors(rawCompetitors, lat, lon, config.googlePlacesType, config.fallbackName);

    // Step 5: Fetch demographics + population growth
    const defaults = {
      population: 3000, medianIncome: 55000, medianAge: null,
      collegePercent: null, employmentRate: null, medianHomeValue: null,
      vacancyRate: null, drivePercent: null,
    };
    let demographics = { ...defaults };
    let popGrowth = null;

    if (fips) {
      const [demo, growth] = await Promise.all([
        getDemographics(fips.state, fips.county, fips.tract),
        getPopulationGrowth(fips.state, fips.county),
      ]);
      for (const key of Object.keys(defaults)) {
        if (demo[key] !== null && demo[key] !== undefined) demographics[key] = demo[key];
      }
      popGrowth = growth;
    }

    // Step 6: Calculate score
    const competitorCount = competitors.length;
    const { score, breakdown: scoreBreakdown } = calculateScore({
      population: demographics.population,
      medianIncome: demographics.medianIncome,
      competitorCount,
      walkScore: walkScoreData?.walkScore ?? null,
      collegePercent: demographics.collegePercent,
      employmentRate: demographics.employmentRate,
      popGrowth,
      avgCompetitorRating,
      config,
    });

    // Step 7: Generate summary and recommendation
    const { summary, recommendation } = generateSummary({
      score,
      competitorCount,
      population: demographics.population,
      medianIncome: demographics.medianIncome,
      walkScore: walkScoreData?.walkScore ?? null,
      collegePercent: demographics.collegePercent,
      employmentRate: demographics.employmentRate,
      popGrowth,
      avgCompetitorRating,
      totalCompetitorReviews,
      config,
    });

    // Step 7.5: NPI Registry lookup for dental industry. Authoritative
    // licensed-dentist counts + specialty breakdown.
    //
    // Two-tier lookup:
    //   1. ZIP-scoped query when the user gave a specific address (forward
    //      geocode produced a postcode) — tightest geographic match.
    //   2. City-scoped query when the user gave a vague city query OR when
    //      the ZIP query returned 0 providers (handles commercial-only ZIPs
    //      and rural areas with sparse coverage).
    //
    // Best-effort — wrapped in try/catch so NPI outages never break a report.
    let npiData = null;
    if (industry === 'dental') {
      try {
        let providers = null;
        let scope = null;
        let scopeLabel = null;

        if (isSpecificAddress) {
          providers = await getDentalProvidersByZip(postalCode);
          if (providers && providers.length > 0) {
            scope = 'zip';
            scopeLabel = postalCode.slice(0, 5);
          }
        }

        // City fallback: triggered for vague queries (no postcode at all)
        // or when the ZIP-tight query returned no providers.
        if ((!providers || providers.length === 0) && cityName && stateName) {
          const cityProviders = await getDentalProvidersByCity(cityName, stateName);
          if (cityProviders && cityProviders.length > 0) {
            providers = cityProviders;
            scope = 'city';
            scopeLabel = `${cityName}, ${stateName}`;
          }
        }

        if (providers && providers.length > 0) {
          npiData = {
            ...computeNPIStats(providers),
            scope,
            scopeLabel,
            // Keep `zip` for back-compat with the existing UI; it now mirrors
            // scopeLabel for ZIP scope and is empty for city scope.
            zip: scope === 'zip' ? scopeLabel : null,
          };
        }
      } catch (e) {
        console.warn('NPI lookup failed:', e.message);
      }
    }

    // Step 7.6: Payer mix lookup for dental industry. Combines Census ACS
    // insurance coverage data (private vs public vs uninsured) with
    // hardcoded state-level Medicaid adult dental benefit tier. Same
    // graceful failure pattern as NPI.
    let payerMix = null;
    if (industry === 'dental' && fips) {
      try {
        const coverage = await getInsuranceCoverage(fips.state, fips.county, fips.tract);
        const medicaid = getStateMedicaidDental(fips.state);
        if (coverage || medicaid) {
          payerMix = {
            ...(coverage || {}),
            medicaid: medicaid || null,
          };
        }
      } catch (e) {
        console.warn('Payer mix lookup failed:', e.message);
      }
    }

    // Step 7.7: Daytime workforce lookup for dental industry. Federal LEHD
    // QWI county-level employment + ACS county population. Tells us how
    // many people work in this county (potential daytime patient pool),
    // top employer industries, and the worker-to-resident ratio.
    let daytimeWorkforce = null;
    if (industry === 'dental' && fips) {
      try {
        daytimeWorkforce = await getCountyWorkforce(fips.state, fips.county);
      } catch (e) {
        console.warn('Daytime workforce lookup failed:', e.message);
      }
    }

    // Pre-evaluate everything that depends on industry-config server-side
    // so the methodology (thresholds, weights, revenue model, win strategy
    // rules, next-step templates) never reaches the client bundle.
    const resultData = {
      score,
      competitorCount,
      population: demographics.population,
      medianIncome: demographics.medianIncome,
      employmentRate: demographics.employmentRate,
      collegePercent: demographics.collegePercent,
      popGrowth,
      avgCompetitorRating,
      walkScore: walkScoreData,
      anchors,
      npiData,
    };
    const { upside, risks } = evaluateUpsideRisks(resultData, config);
    const winStrategy = deriveWinStrategy(resultData, config);
    const marketCapacity = deriveMarketCapacity(resultData, config);
    const nextSteps = deriveNextSteps(resultData, config);

    return Response.json({
      industry,
      address: displayAddress,
      lat,
      lon,
      competitors,
      competitorCount,
      avgCompetitorRating,
      totalCompetitorReviews,
      ...demographics,
      popGrowth,
      walkScore: walkScoreData,
      anchors,
      score,
      scoreBreakdown,
      upside,
      risks,
      winStrategy,
      marketCapacity,
      nextSteps,
      npiData,
      payerMix,
      daytimeWorkforce,
      summary,
      recommendation,
    });
  } catch (e) {
    console.error('Analysis failed:', e);
    return Response.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
