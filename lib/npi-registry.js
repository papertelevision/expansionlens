// CMS NPI Registry client.
//
// The NPI Registry is the authoritative federal database of every licensed
// healthcare provider in the United States. For dental reports it provides
// "ground truth" provider counts (better than Google Places, which only sees
// businesses with active listings) plus per-specialty breakdowns and a
// market-growth signal via enumeration date.
//
// Free public API, no key required, reasonable rate limit. Docs:
//   https://npiregistry.cms.hhs.gov/api-page
//
// Server-only — never imported by client components.

import 'server-only';

const NPI_API = 'https://npiregistry.cms.hhs.gov/api/?version=2.1';
const PAGE_SIZE = 200;
const MAX_PAGES = 5; // 1,000 providers max per ZIP — far more than any real density

// Map full state names (as returned by Nominatim) to 2-letter postal codes
// (as required by the NPI API). Lowercased keys for case-insensitive lookup.
const STATE_NAME_TO_CODE = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI',
  idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

// In-memory cache. NPI data changes very slowly (providers register/retire
// over weeks, not minutes). 24-hour TTL keeps repeated lookups fast.
const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL_MS) return entry.data;
  cache.delete(key);
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

/**
 * Fetch all dental providers in a single ZIP code.
 * Paginates internally; returns all providers with primary taxonomy.
 *
 * @param {string} zip — 5-digit US postal code
 * @returns {Promise<Array<object> | null>} provider list, or null on failure
 */
export async function getDentalProvidersByZip(zip) {
  if (!zip || !/^\d{5}/.test(zip)) return null;
  const cleanZip = zip.slice(0, 5);

  const cacheKey = `npi:dental:${cleanZip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const all = [];

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL(NPI_API);
      url.searchParams.set('taxonomy_description', 'Dentist');
      url.searchParams.set('postal_code', cleanZip);
      url.searchParams.set('enumeration_type', 'NPI-1');
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('skip', String(page * PAGE_SIZE));

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        // Don't fail the whole report — just return what we have so far.
        console.warn(`NPI API returned ${res.status} for ${cleanZip}`);
        break;
      }

      const json = await res.json();
      const results = json.results || [];
      all.push(...results);

      // No more pages.
      if (results.length < PAGE_SIZE) break;
    }

    setCached(cacheKey, all);
    return all;
  } catch (e) {
    console.warn(`NPI lookup failed for ${cleanZip}:`, e.message);
    return null;
  }
}

/**
 * Fetch all dental providers in a city + state. Used as a fallback when
 * a postcode lookup returns 0 results (e.g. when a vague query like
 * "Dayton, Ohio" geocodes to a downtown commercial ZIP that has few or
 * no dentists). City queries return the broader metro picture.
 *
 * @param {string} city — city name (e.g. "Dayton")
 * @param {string} state — 2-letter postal code (e.g. "OH") or full name
 * @returns {Promise<Array<object> | null>}
 */
export async function getDentalProvidersByCity(city, state) {
  if (!city || !state) return null;

  // NPI API expects 2-letter state code. Map common full names if needed.
  const stateCode = state.length === 2 ? state.toUpperCase() : STATE_NAME_TO_CODE[state.toLowerCase()] || state;
  if (!stateCode || stateCode.length !== 2) return null;

  const cleanCity = city.trim();
  const cacheKey = `npi:dental:city:${cleanCity.toLowerCase()}:${stateCode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const all = [];

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL(NPI_API);
      url.searchParams.set('taxonomy_description', 'Dentist');
      url.searchParams.set('city', cleanCity);
      url.searchParams.set('state', stateCode);
      url.searchParams.set('enumeration_type', 'NPI-1');
      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('skip', String(page * PAGE_SIZE));

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`NPI API returned ${res.status} for city ${cleanCity}, ${stateCode}`);
        break;
      }

      const json = await res.json();
      const results = json.results || [];
      all.push(...results);

      if (results.length < PAGE_SIZE) break;
    }

    setCached(cacheKey, all);
    return all;
  } catch (e) {
    console.warn(`NPI city lookup failed for ${cleanCity}, ${stateCode}:`, e.message);
    return null;
  }
}

/**
 * Fetch dental providers across multiple ZIP codes (for radius lookups
 * spanning more than one zip). Dedupes by NPI number.
 */
export async function getDentalProvidersByZips(zips) {
  if (!Array.isArray(zips) || zips.length === 0) return null;

  const results = await Promise.all(zips.map((z) => getDentalProvidersByZip(z)));
  const seen = new Set();
  const merged = [];
  for (const list of results) {
    if (!list) continue;
    for (const provider of list) {
      const npi = provider.number;
      if (!npi || seen.has(npi)) continue;
      seen.add(npi);
      merged.push(provider);
    }
  }
  return merged;
}

// ─── Stats / aggregation ────────────────────────────────────────────────

// Map NPI taxonomy descriptions to human-readable specialty buckets.
// We use description matching (not codes) because the API normalizes the
// description text and codes change over time.
const SPECIALTY_BUCKETS = {
  general: ['general practice'],
  pediatric: ['pediatric dentistry'],
  orthodontics: ['orthodontics', 'dentofacial'],
  endodontics: ['endodontics'],
  periodontics: ['periodontics'],
  prosthodontics: ['prosthodontics'],
  oralSurgery: ['oral & maxillofacial surgery', 'oral and maxillofacial surgery'],
  publicHealth: ['dental public health'],
};

function bucketSpecialty(description) {
  if (!description) return 'unspecified';
  const lower = description.toLowerCase();
  for (const [bucket, keywords] of Object.entries(SPECIALTY_BUCKETS)) {
    if (keywords.some((k) => lower.includes(k))) return bucket;
  }
  // Generic "Dentist" with no specialty modifier defaults to general.
  if (lower === 'dentist') return 'general';
  return 'other';
}

function primaryTaxonomy(provider) {
  const tax = provider.taxonomies || [];
  return tax.find((t) => t.primary) || tax[0] || null;
}

function locationAddress(provider) {
  const addrs = provider.addresses || [];
  return addrs.find((a) => a.address_purpose === 'LOCATION') || addrs[0] || null;
}

/**
 * Aggregate raw NPI provider list into a stats object suitable for the
 * report response. Pure function — safe to call multiple times.
 *
 * @param {Array<object>} providers — raw NPI provider objects
 * @returns {object} stats summary
 */
export function computeNPIStats(providers) {
  if (!providers || providers.length === 0) {
    return {
      totalProviders: 0,
      bySpecialty: {},
      newProviders24mo: 0,
      soloProprietorRate: 0,
      generalists: 0,
      specialists: 0,
    };
  }

  const bySpecialty = {
    general: 0,
    pediatric: 0,
    orthodontics: 0,
    endodontics: 0,
    periodontics: 0,
    prosthodontics: 0,
    oralSurgery: 0,
    publicHealth: 0,
    other: 0,
    unspecified: 0,
  };

  let newProviders24mo = 0;
  let soloCount = 0;

  // Cutoff for "new": 24 months ago in YYYY-MM-DD form.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const provider of providers) {
    const tax = primaryTaxonomy(provider);
    const bucket = bucketSpecialty(tax?.desc);
    bySpecialty[bucket] = (bySpecialty[bucket] || 0) + 1;

    const enumDate = provider.basic?.enumeration_date || '';
    if (enumDate >= cutoffStr) newProviders24mo++;

    if (provider.basic?.sole_proprietor === 'YES') soloCount++;
  }

  const totalProviders = providers.length;
  const generalists = bySpecialty.general + bySpecialty.unspecified;
  const specialists = totalProviders - generalists;
  const soloProprietorRate = totalProviders > 0 ? Math.round((soloCount / totalProviders) * 100) : 0;

  return {
    totalProviders,
    bySpecialty,
    newProviders24mo,
    soloProprietorRate,
    generalists,
    specialists,
  };
}

// Export for unit testing — not used by production code.
export const _internal = { bucketSpecialty, primaryTaxonomy, locationAddress };
