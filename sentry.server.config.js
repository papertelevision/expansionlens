// Sentry server-side initialization. Captures unhandled errors in API routes
// and React server components. No-op when SENTRY_DSN is unset.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
