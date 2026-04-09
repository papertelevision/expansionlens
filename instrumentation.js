// Next.js instrumentation hook — runs once when the server starts.
// Loads the appropriate Sentry config based on runtime (node vs edge).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(err, request, context) {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(err, request, context);
}
