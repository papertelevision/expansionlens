// Adaptive search radius based on competitor density.
//
// We always query Overpass at the maximum radius (5 mi) first to capture all
// nearby competitors, then choose the actual analysis radius based on how many
// competitors fall within each tier. This works better than residential
// population because dense commercial cores like Midtown Manhattan have very
// few residents but extremely high competitor density.

const MAX_RADIUS_MILES = 5.0;
const MAX_RADIUS_METERS = 8047;

// Tiers ordered tightest -> widest. We pick the tightest tier that has enough
// competitors to support a meaningful analysis.
const TIERS = [
  { tier: 'dense_urban', miles: 1.5, meters: 2414, minCompetitors: 25 },
  { tier: 'urban',       miles: 2.5, meters: 4023, minCompetitors: 12 },
  { tier: 'suburban',    miles: 3.5, meters: 5633, minCompetitors: 4  },
  { tier: 'rural',       miles: 5.0, meters: 8047, minCompetitors: 0  },
];

function makeTier(tier, radiusMiles, radiusMeters) {
  // Use (2*radius)^2 for the square grid area (matches map visualization),
  // divided by average Census tract area (~1.5 sq mi).
  const searchAreaSqMi = Math.round((2 * radiusMiles) ** 2 * 10) / 10;
  const areaMultiplier = searchAreaSqMi / 1.5;
  return { radiusMiles, radiusMeters, searchAreaSqMi, densityTier: tier, areaMultiplier };
}

// Returns the maximum radius we should always use for the initial Overpass
// query, regardless of expected density. We filter results down afterward.
export function getMaxSearchRadius() {
  return { radiusMiles: MAX_RADIUS_MILES, radiusMeters: MAX_RADIUS_METERS };
}

// Given a list of competitors with `lat`/`lon` (or precomputed `distance` in
// miles), pick the tightest radius tier that contains enough competitors for
// a meaningful analysis. Returns the same shape as the old function.
export function pickRadiusFromCompetitors(competitors, centerLat, centerLon) {
  // Count competitors within each tier's radius
  const distances = competitors.map((c) => {
    if (typeof c.distance === 'number') return c.distance;
    return haversineMiles(centerLat, centerLon, c.lat, c.lon);
  });

  for (const { tier, miles, meters, minCompetitors } of TIERS) {
    const count = distances.filter((d) => d <= miles).length;
    if (count >= minCompetitors) {
      return makeTier(tier, miles, meters);
    }
  }

  // Fallback to widest if even rural threshold not met (very sparse area)
  const last = TIERS[TIERS.length - 1];
  return makeTier(last.tier, last.miles, last.meters);
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
