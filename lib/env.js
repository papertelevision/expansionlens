// Centralized environment variable validation.
// Imported once at boot via lib/db.js so the app fails fast with a clear
// error if a required variable is missing or obviously a placeholder.

const PLACEHOLDER_PATTERNS = [/^change[-_ ]me/i, /^placeholder/i, /^your[-_ ]/i];

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

export function requireEnv(name, { minLength = 1 } = {}) {
  const value = process.env[name];
  if (value === undefined || value === null || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (isPlaceholder(value)) {
    throw new Error(
      `Environment variable ${name} is set to a placeholder value. Generate a real value before starting the app.`
    );
  }
  if (value.length < minLength) {
    throw new Error(
      `Environment variable ${name} must be at least ${minLength} characters long.`
    );
  }
  return value;
}

export function requireProductionEnv(name, opts) {
  if (process.env.NODE_ENV === 'production') {
    return requireEnv(name, opts);
  }
  return process.env[name] || '';
}

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  // Skip validation during `next build`. Next.js evaluates route files for
  // page data collection at build time, which triggers module-load side
  // effects like this validator. Build environments don't have production
  // secrets, and shouldn't need them — the build just compiles JS.
  // Validation still runs at server startup (which is what we care about).
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  // Always required, in every environment.
  requireEnv('DATABASE_URL');
  requireEnv('SESSION_SECRET', { minLength: 32 });
  requireEnv('STRIPE_SECRET_KEY');
  requireEnv('RESEND_API_KEY');

  // Required only in production. Dev can run without it (with the caveat
  // that the Stripe webhook handler will reject every event until it's set).
  requireProductionEnv('STRIPE_WEBHOOK_SECRET');
}

// Optional vars — documented here for clarity, never throw if missing:
//   SENTRY_DSN              — server-side error reporting
//   NEXT_PUBLIC_SENTRY_DSN  — client-side error reporting
//   SENTRY_AUTH_TOKEN       — enables source map upload during build
//   SENTRY_ORG / SENTRY_PROJECT — required if SENTRY_AUTH_TOKEN is set
//   WALKSCORE_API_KEY       — walkability data
//   GOOGLE_PLACES_API_KEY   — competitor ratings
//   STRIPE_PRODUCT_ID       — Stripe product (falls back to inline product_data)
//   NEXT_PUBLIC_BASE_URL    — used for email links (falls back to https://expansionlens.com)
//   DO_SPACES_*             — used by scripts/backup-postgres.sh, not by the Next app
