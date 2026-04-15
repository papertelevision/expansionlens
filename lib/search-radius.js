// Adaptive search radius based on Census tract population density.
//
// Census tracts are designed to hold ~4,000 people. Higher tract population
// means the tract covers a smaller geographic area (denser). We use this as
// a proxy to pick the right search radius — tighter in Manhattan (1.5 mi),
// wider in rural areas (5 mi), and the current 3.5 mi default for suburbs.

const TIERS = [
  { threshold: 8000, tier: 'dense_urban', miles: 1.5, meters: 2414 },
  { threshold: 4000, tier: 'urban',       miles: 2.5, meters: 4023 },
  { threshold: 2000, tier: 'suburban',     miles: 3.5, meters: 5633 },
  { threshold: 0,    tier: 'rural',        miles: 5.0, meters: 8047 },
];

const DEFAULT_TIER = TIERS[2]; // suburban

function makeTier(tier, radiusMiles, radiusMeters) {
  // Use (2*radius)^2 for the square grid area (matches map visualization),
  // divided by average Census tract area (~1.5 sq mi). Consistent with the
  // original hardcoded 25/1.5 formula for the 3.5-mile tier.
  const searchAreaSqMi = Math.round((2 * radiusMiles) ** 2 * 10) / 10;
  const areaMultiplier = searchAreaSqMi / 1.5;
  return { radiusMiles, radiusMeters, searchAreaSqMi, densityTier: tier, areaMultiplier };
}

export function determineSearchRadius(tractPopulation) {
  if (tractPopulation == null) {
    return makeTier(DEFAULT_TIER.tier, DEFAULT_TIER.miles, DEFAULT_TIER.meters);
  }

  for (const { threshold, tier, miles, meters } of TIERS) {
    if (tractPopulation > threshold) {
      return makeTier(tier, miles, meters);
    }
  }

  return makeTier(DEFAULT_TIER.tier, DEFAULT_TIER.miles, DEFAULT_TIER.meters);
}
