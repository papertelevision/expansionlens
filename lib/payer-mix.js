// Census ACS insurance coverage client.
//
// Pulls insurance coverage rates from the Census Bureau's American
// Community Survey subject tables (S2701, S2703, S2704). These tables
// give us tract-level data on:
//   - Total insured / uninsured rates
//   - Private health insurance coverage
//   - Public health insurance coverage (Medicaid, Medicare, VA)
//
// Important: Census tracks general health insurance, not dental
// specifically. But the two correlate strongly — households with
// employer-sponsored health insurance almost always have employer-sponsored
// dental too. This is the closest free, queryable proxy for dental
// coverage at the zip-code level.
//
// Server-only — never imported by client components.

import 'server-only';

const CENSUS_API = 'https://api.census.gov/data/2022/acs/acs5/subject';

// In-memory cache. Census ACS data updates yearly, so 24h TTL is generous.
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

function safePercent(val) {
  const n = parseFloat(val);
  // Census uses negative sentinel values for missing data.
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 10) / 10;
}

/**
 * Fetch insurance coverage rates for a single census tract.
 *
 * @param {string} state — 2-digit FIPS state code
 * @param {string} county — 3-digit FIPS county code
 * @param {string} tract — 6-digit FIPS tract code
 * @returns {Promise<object | null>} { insuredRate, uninsuredRate, privateRate, publicRate }
 */
export async function getInsuranceCoverage(state, county, tract) {
  if (!state || !county || !tract) return null;

  const cacheKey = `payer:${state}:${county}:${tract}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // S2701_C03_001E — Percent Insured (civilian noninstitutionalized population)
    // S2701_C05_001E — Percent Uninsured
    // S2703_C03_001E — Percent with Private Health Insurance Coverage
    // S2704_C03_001E — Percent with Public Health Insurance Coverage
    const vars = [
      'S2701_C03_001E',
      'S2701_C05_001E',
      'S2703_C03_001E',
      'S2704_C03_001E',
    ].join(',');

    const url = `${CENSUS_API}?get=${vars}&for=tract:${tract}&in=state:${state}+county:${county}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      console.warn(`Census S2701 API returned ${res.status} for ${state}:${county}:${tract}`);
      return null;
    }

    const data = await res.json();
    if (!data || data.length < 2) return null;

    const headers = data[0];
    const values = data[1];
    const v = {};
    headers.forEach((h, i) => { v[h] = values[i]; });

    const result = {
      insuredRate: safePercent(v.S2701_C03_001E),
      uninsuredRate: safePercent(v.S2701_C05_001E),
      privateRate: safePercent(v.S2703_C03_001E),
      publicRate: safePercent(v.S2704_C03_001E),
    };

    // Sanity check — at least one rate should be present.
    if (result.insuredRate == null && result.privateRate == null) return null;

    setCached(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('Census insurance lookup failed:', e.message);
    return null;
  }
}
