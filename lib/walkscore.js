/**
 * Fetch Walk Score, Transit Score, and Bike Score for a location.
 * Requires WALKSCORE_API_KEY environment variable.
 * Free tier: 5,000 calls/day. Sign up at walkscore.com/professional/api.php
 */
export async function getWalkScore(address, lat, lon) {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&transit=1&bike=1&wsapikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (data.status === 1) {
      return {
        walkScore: data.walkscore ?? null,
        walkDescription: data.description ?? null,
        transitScore: data.transit?.score ?? null,
        transitDescription: data.transit?.description ?? null,
        bikeScore: data.bike?.score ?? null,
        bikeDescription: data.bike?.description ?? null,
      };
    }
  } catch (e) {
    console.warn('Walk Score API failed:', e.message);
  }

  return null;
}
