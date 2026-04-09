import { withSentryConfig } from '@sentry/nextjs';

const securityHeaders = [
  // Force HTTPS for two years, include subdomains, and allow preload list submission.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disallow framing — defends against clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Disable MIME sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the origin (not the full URL) on cross-origin navigations.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful browser features we don't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output produces a self-contained .next/standalone directory
  // that the production Dockerfile copies into a tiny runtime image.
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Clean URLs for the home page and vertical-specific landing pages.
  // The site root and /dental are both backed by static HTML files in
  // public/ — the rewrites make them look like clean URLs without .html.
  async rewrites() {
    return [
      { source: '/', destination: '/landing.html' },
      { source: '/dental', destination: '/dental.html' },
    ];
  },
};

// Sentry's webpack plugin uploads source maps and injects release info during
// build. It only does work when SENTRY_AUTH_TOKEN is set; otherwise it's inert,
// so dev builds remain fast and offline-friendly.
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Skip Sentry plugin work entirely if no auth token (dev / local builds).
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryOptions);
