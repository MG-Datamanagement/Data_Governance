/**
 * next.config.js — Next.js Configuration (Phase 8 Security Hardening)
 *
 * Changes from Phase 8:
 *  - poweredByHeader: false  — remove "X-Powered-By: Next.js" fingerprint
 *  - HTTP Security Headers   — CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
 *                              Referrer-Policy, Permissions-Policy
 *  - reactStrictMode: true   — already enabled (kept)
 */

/** @type {import('next').NextConfig} */

// ─── Security Headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Block clickjacking / iframe embedding from other origins
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Modern CSP: restrict sources; adjust 'unsafe-inline' once you add nonces
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",       // tighten with nonce in production
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' http://localhost:8000 https:",        // adjust to your actual API origin
      "worker-src blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },

  // Leaks referer only to same origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // HSTS — only activates when served over HTTPS in production
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Disable unnecessary browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // XSS protection (legacy browsers); modern browsers use CSP
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig = {
  // Remove "X-Powered-By: Next.js" from all responses
  poweredByHeader: false,

  // React Strict Mode — double-invokes effects in dev to surface bugs
  reactStrictMode: true,

  images: {
    // Add production image domains here when needed
    domains: [],
    // Prefer remotePatterns over domains (Next.js 13+)
    remotePatterns: [],
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Webpack config — no changes needed, kept for extension
  // webpack: (config) => { return config; },
};

module.exports = nextConfig;
