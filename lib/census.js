/**
 * Get FIPS codes (state, county, tract) from coordinates.
 * Primary: Census Geocoder. Fallback: FCC Area API.
 */
export async function getFipsCodes(lat, lon) {
  // Try Census Geocoder first
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    const tracts = data?.result?.geographies?.['Census Tracts'];
    if (tracts && tracts.length > 0) {
      return {
        state: tracts[0].STATE,
        county: tracts[0].COUNTY,
        tract: tracts[0].TRACT,
      };
    }
  } catch (e) {
    console.warn('Census Geocoder failed, trying FCC fallback:', e.message);
  }

  // Fallback: FCC Area API
  try {
    const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    const fips = data?.Block?.FIPS;
    if (fips && fips.length >= 11) {
      return {
        state: fips.substring(0, 2),
        county: fips.substring(2, 5),
        tract: fips.substring(5, 11),
      };
    }
  } catch (e) {
    console.warn('FCC API also failed:', e.message);
  }

  return null;
}

// Helper to safely parse Census integers (handles -666666666 sentinel and missing data)
function safeInt(val) {
  const n = parseInt(val, 10);
  return (!isNaN(n) && n > 0) ? n : null;
}

/**
 * Fetch expanded demographics from Census ACS 5-year data.
 */
export async function getDemographics(state, county, tract) {
  const vars = [
    'B01003_001E', // total population
    'B19013_001E', // median household income
    'B01002_001E', // median age
    'B15003_001E', // total 25+ (education denominator)
    'B15003_022E', // bachelor's degree
    'B15003_023E', // master's degree
    'B15003_024E', // professional degree
    'B15003_025E', // doctorate
    'B23025_002E', // labor force
    'B23025_004E', // employed
    'B25077_001E', // median home value
    'B25002_001E', // total housing units
    'B25002_003E', // vacant housing units
    'B08301_001E', // total commuters
    'B08301_002E', // drove alone
  ].join(',');

  try {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=tract:${tract}&in=state:${state}+county:${county}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (data && data.length >= 2) {
      const headers = data[0];
      const values = data[1];
      const v = {};
      headers.forEach((h, i) => { v[h] = values[i]; });

      const population = safeInt(v.B01003_001E);
      const medianIncome = safeInt(v.B19013_001E);
      const medianAge = parseFloat(v.B01002_001E) || null;

      // Education: % with bachelor's or higher
      const eduTotal = safeInt(v.B15003_001E);
      const eduCollege = (safeInt(v.B15003_022E) || 0) + (safeInt(v.B15003_023E) || 0) +
                         (safeInt(v.B15003_024E) || 0) + (safeInt(v.B15003_025E) || 0);
      const collegePercent = eduTotal ? Math.round((eduCollege / eduTotal) * 100) : null;

      // Employment rate
      const laborForce = safeInt(v.B23025_002E);
      const employed = safeInt(v.B23025_004E);
      const employmentRate = laborForce ? Math.round((employed / laborForce) * 100) : null;

      // Housing
      const medianHomeValue = safeInt(v.B25077_001E);
      const totalHousing = safeInt(v.B25002_001E);
      const vacantHousing = safeInt(v.B25002_003E) || 0;
      const vacancyRate = totalHousing ? Math.round((vacantHousing / totalHousing) * 100) : null;

      // Commute
      const totalCommuters = safeInt(v.B08301_001E);
      const droveAlone = safeInt(v.B08301_002E) || 0;
      const drivePercent = totalCommuters ? Math.round((droveAlone / totalCommuters) * 100) : null;

      return {
        population,
        medianIncome,
        medianAge,
        collegePercent,
        employmentRate,
        medianHomeValue,
        vacancyRate,
        drivePercent,
      };
    }
  } catch (e) {
    console.warn('Census ACS fetch failed:', e.message);
  }

  return {
    population: null, medianIncome: null, medianAge: null,
    collegePercent: null, employmentRate: null, medianHomeValue: null,
    vacancyRate: null, drivePercent: null,
  };
}

/**
 * Fetch county-level population growth from Census Population Estimates.
 * Uses 2019 PEP API with DATE_CODE (most recent available multi-year dataset).
 * DATE_CODE 1 = base (2010), highest = most recent estimate.
 */
export async function getPopulationGrowth(state, county) {
  try {
    const url = `https://api.census.gov/data/2019/pep/population?get=POP,DATE_CODE&for=county:${county}&in=state:${state}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();

    if (data && data.length >= 3) {
      // Find the two most recent years (highest DATE_CODE values)
      const rows = data.slice(1).map((r) => ({ pop: parseInt(r[0], 10), date: parseInt(r[1], 10) }));
      rows.sort((a, b) => b.date - a.date);

      if (rows.length >= 2 && rows[1].pop > 0) {
        const recent = rows[0].pop;
        const previous = rows[1].pop;
        return Math.round(((recent - previous) / previous) * 1000) / 10;
      }
    }
  } catch (e) {
    console.warn('Census Population Estimates failed:', e.message);
  }

  return null;
}
