/**
 * Google Places API integration for competitor enrichment.
 * Uses Nearby Search to find all competitors in one call (1-3 API calls per report).
 * Requires GOOGLE_PLACES_API_KEY environment variable.
 */

const API_KEY = () => process.env.GOOGLE_PLACES_API_KEY;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetch all competitors near a location via Google Places Nearby Search.
 * Handles pagination (up to 60 results across 3 pages).
 */
async function fetchGoogleCompetitors(lat, lon, type = 'dentist') {
  const key = API_KEY();
  if (!key) return [];

  const results = [];
  let nextPageToken = null;

  for (let page = 0; page < 3; page++) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5633&type=${type}&key=${key}`;
      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${key}`;
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`Google Places API error: ${data.status}`, data.error_message);
        break;
      }

      if (data.results) {
        results.push(...data.results);
      }

      nextPageToken = data.next_page_token;
      if (!nextPageToken) break;

      // Google requires a short delay before using next_page_token
      await sleep(2000);
    } catch (e) {
      console.warn('Google Places fetch failed:', e.message);
      break;
    }
  }

  return results;
}

/**
 * Enrich Overpass competitors with Google Places data.
 * Matches by proximity (within ~200m / 0.12 miles).
 * Also adds Google-only results that Overpass missed.
 */
export async function enrichCompetitors(competitors, lat, lon, type = 'dentist', fallbackName = 'Unnamed Dental Practice') {
  const key = API_KEY();
  if (!key) return { competitors, avgRating: null, totalReviews: null };

  const googleResults = await fetchGoogleCompetitors(lat, lon, type);
  if (googleResults.length === 0) return { competitors, avgRating: null, totalReviews: null };

  // Build enriched competitor list
  const enriched = competitors.map((comp) => ({ ...comp }));
  const matchedGoogleIds = new Set();

  // Match Google results to Overpass competitors by proximity
  for (const comp of enriched) {
    let bestMatch = null;
    let bestDist = Infinity;

    for (const gResult of googleResults) {
      const gLat = gResult.geometry?.location?.lat;
      const gLon = gResult.geometry?.location?.lng;
      if (!gLat || !gLon) continue;

      const dist = haversineDistance(comp.lat, comp.lon, gLat, gLon);
      if (dist < 0.12 && dist < bestDist) { // within ~200m
        bestDist = dist;
        bestMatch = gResult;
      }
    }

    if (bestMatch) {
      comp.rating = bestMatch.rating ?? null;
      comp.reviewCount = bestMatch.user_ratings_total ?? null;
      comp.businessStatus = bestMatch.business_status ?? null;
      comp.googlePlaceId = bestMatch.place_id ?? null;
      // Prefer Google name if Overpass name is "Unnamed"
      if (comp.name === fallbackName && bestMatch.name) {
        comp.name = bestMatch.name;
      }
      matchedGoogleIds.add(bestMatch.place_id);
    }
  }

  // Add Google-only results that Overpass missed
  for (const gResult of googleResults) {
    if (matchedGoogleIds.has(gResult.place_id)) continue;

    const gLat = gResult.geometry?.location?.lat;
    const gLon = gResult.geometry?.location?.lng;
    if (!gLat || !gLon) continue;

    enriched.push({
      name: gResult.name || fallbackName.replace('Unnamed ', ''),
      address: gResult.vicinity || null,
      phone: null,
      website: null,
      lat: gLat,
      lon: gLon,
      rating: gResult.rating ?? null,
      reviewCount: gResult.user_ratings_total ?? null,
      businessStatus: gResult.business_status ?? null,
      googlePlaceId: gResult.place_id ?? null,
      source: 'google',
    });
  }

  // Calculate aggregates
  const rated = enriched.filter((c) => c.rating != null);
  const avgRating = rated.length > 0
    ? Math.round((rated.reduce((sum, c) => sum + c.rating, 0) / rated.length) * 10) / 10
    : null;
  const totalReviews = rated.reduce((sum, c) => sum + (c.reviewCount || 0), 0);

  return { competitors: enriched, avgRating, totalReviews };
}
