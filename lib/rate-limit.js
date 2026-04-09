// Simple in-memory rate limiter.
//
// Mirrors the cache pattern in app/api/analyze/route.js — single-instance only.
// If we move to a multi-instance deployment, swap the storage layer for Redis
// (the public API of checkRateLimit() does not need to change).

const buckets = new Map();
const MAX_KEYS = 5000;

function prune(timestamps, windowStart) {
  // Drop timestamps that have aged out of the window.
  let i = 0;
  while (i < timestamps.length && timestamps[i] < windowStart) i++;
  if (i > 0) timestamps.splice(0, i);
}

function evictIfFull() {
  if (buckets.size <= MAX_KEYS) return;
  const oldestKey = buckets.keys().next().value;
  buckets.delete(oldestKey);
}

/**
 * @param {string} key — unique identifier for the rate-limited subject (e.g. "analyze:1.2.3.4")
 * @param {{ max: number, windowMs: number }} opts
 * @returns {{ allowed: boolean, retryAfter: number, remaining: number }}
 *   retryAfter is in seconds; 0 when allowed.
 */
export function checkRateLimit(key, { max, windowMs }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = buckets.get(key);
  if (!timestamps) {
    timestamps = [];
    buckets.set(key, timestamps);
    evictIfFull();
  } else {
    prune(timestamps, windowStart);
  }

  if (timestamps.length >= max) {
    const oldest = timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, retryAfter, remaining: 0 };
  }

  timestamps.push(now);
  return { allowed: true, retryAfter: 0, remaining: max - timestamps.length };
}

// Test/cleanup hook — used by tests if we add them.
export function _resetRateLimits() {
  buckets.clear();
}
