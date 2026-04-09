// Census Bureau LEHD QWI (Quarterly Workforce Indicators) client.
//
// Provides county-level workforce data: total jobs, top industries by
// employment, average earnings, plus a worker-to-resident ratio computed
// from Census ACS county population. This is the federal "daytime workforce"
// signal for dental site selection — distinguishes job-importing markets
// (commuter destinations like downtown Austin) from bedroom communities
// (suburban residential).
//
// API: https://api.census.gov/data/timeseries/qwi/sa
// Free, no key required, well-documented, federal source.
//
// Server-only — never imported by client components.

import 'server-only';

const QWI_API = 'https://api.census.gov/data/timeseries/qwi/sa';
const ACS_API = 'https://api.census.gov/data/2022/acs/acs5';

// 2-digit NAICS sector codes we query. We pick sectors that matter for
// dental site selection: high-income white-collar (51, 52, 54), healthcare
// cluster proximity (62), and the major employment sectors that shape a
// market (61 education, 72 hospitality, 23 construction, 44-45 retail,
// 31-33 manufacturing).
const INDUSTRY_LABELS = {
  '00': 'All Industries',
  '11': 'Agriculture',
  '21': 'Mining & Extraction',
  '22': 'Utilities',
  '23': 'Construction',
  '31-33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44-45': 'Retail Trade',
  '48-49': 'Transportation',
  '51': 'Information & Tech',
  '52': 'Finance & Insurance',
  '53': 'Real Estate',
  '54': 'Professional Services',
  '55': 'Management',
  '56': 'Administrative Services',
  '61': 'Education',
  '62': 'Healthcare & Social Assistance',
  '71': 'Arts & Entertainment',
  '72': 'Accommodation & Food Service',
  '81': 'Other Services',
};

// Sectors we actually query. Total + the most-relevant for dental.
const QUERIED_SECTORS = ['00', '23', '31-33', '44-45', '51', '52', '54', '61', '62', '71', '72'];

// Recent quarters to try in order. QWI data lags real time by ~9 months,
// so on any given run the latest quarter that returns data is variable.
// We try recent ones until we find one that works.
const RECENT_QUARTERS = [
  '2025-Q4', '2025-Q3', '2025-Q2', '2025-Q1',
  '2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1',
];

// In-memory cache. QWI is updated quarterly, so 24h TTL is fine.
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

function safeInt(val) {
  if (val == null || val === '') return null;
  const n = parseInt(val, 10);
  return isNaN(n) || n < 0 ? null : n;
}

/**
 * Fetch county-level workforce data for a given FIPS state+county.
 *
 * @param {string} state — 2-digit FIPS state code
 * @param {string} county — 3-digit FIPS county code
 * @returns {Promise<object | null>}
 */
export async function getCountyWorkforce(state, county) {
  if (!state || !county) return null;

  const cacheKey = `lehd:${state}:${county}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Build the QWI query. The API supports repeating &industry= params.
    const industryParams = QUERIED_SECTORS.map((s) => `industry=${encodeURIComponent(s)}`).join('&');

    // Try recent quarters until we find one with data. QWI data updates
    // quarterly with about a 9-month lag, so newer quarters often return
    // 204 No Content (empty body). The per-quarter try/catch is essential
    // because res.json() throws on empty bodies and we need to keep trying
    // older quarters.
    let qwiRows = null;
    let usedQuarter = null;
    for (const quarter of RECENT_QUARTERS) {
      try {
        const url = `${QWI_API}?get=Emp,EarnBeg&for=county:${county}&in=state:${state}&time=${quarter}&${industryParams}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const text = await res.text();
        if (!text || text.trim() === '') continue;
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 1) {
          qwiRows = data;
          usedQuarter = quarter;
          break;
        }
      } catch (e) {
        // Empty body or parse error — try the next quarter.
        continue;
      }
    }

    if (!qwiRows) return null;

    // Parse the QWI response.
    const headers = qwiRows[0];
    const empIdx = headers.indexOf('Emp');
    const earnIdx = headers.indexOf('EarnBeg');
    const indIdx = headers.indexOf('industry');

    const byIndustry = {};
    let totalJobs = null;
    let totalEarn = null;
    for (let i = 1; i < qwiRows.length; i++) {
      const row = qwiRows[i];
      const ind = row[indIdx];
      const emp = safeInt(row[empIdx]);
      const earn = safeInt(row[earnIdx]);
      if (ind === '00') {
        totalJobs = emp;
        totalEarn = earn;
      } else if (emp != null) {
        byIndustry[ind] = { jobs: emp, monthlyEarnings: earn, label: INDUSTRY_LABELS[ind] || ind };
      }
    }

    if (!totalJobs) return null;

    // Compute top industries by jobs (excluding total).
    const topIndustries = Object.entries(byIndustry)
      .map(([code, data]) => ({
        code,
        label: data.label,
        jobs: data.jobs,
        monthlyEarnings: data.monthlyEarnings,
        percent: Math.round((data.jobs / totalJobs) * 1000) / 10,
      }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 5);

    // Fetch county population from ACS for the worker-to-resident ratio.
    let countyPopulation = null;
    let countyMedianIncome = null;
    try {
      const acsUrl = `${ACS_API}?get=B01003_001E,B19013_001E&for=county:${county}&in=state:${state}`;
      const acsRes = await fetch(acsUrl, { signal: AbortSignal.timeout(8000) });
      if (acsRes.ok) {
        const acsData = await acsRes.json();
        if (Array.isArray(acsData) && acsData.length > 1) {
          countyPopulation = safeInt(acsData[1][0]);
          countyMedianIncome = safeInt(acsData[1][1]);
        }
      }
    } catch (e) {
      // Non-fatal — we can still return workforce data without population
      console.warn('ACS county population lookup failed:', e.message);
    }

    const workerToResidentRatio = countyPopulation
      ? Math.round((totalJobs / countyPopulation) * 100) / 100
      : null;

    const result = {
      totalJobs,
      avgMonthlyEarnings: totalEarn,
      topIndustries,
      countyPopulation,
      countyMedianIncome,
      workerToResidentRatio,
      quarter: usedQuarter,
    };

    setCached(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('Census QWI workforce lookup failed:', e.message);
    return null;
  }
}
