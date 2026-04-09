/**
 * Lightweight client-side analytics tracker.
 * Fire-and-forget — never blocks the UI.
 */
export function track(event, data = {}) {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...data }),
    }).catch(() => {});
  } catch (e) {}
}
