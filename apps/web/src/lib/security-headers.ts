/**
 * Security headers sent on every response (rules.md §4).
 *
 * CSP note: Next.js needs inline scripts to boot. A nonce-based CSP removes
 * 'unsafe-inline' but makes every page dynamic, so it is scheduled for the
 * Phase 6 hardening task. Until then this CSP still blocks plugins, framing,
 * foreign form targets and scripts from other sites.
 * Supabase URLs get added to connect-src/img-src in T0.6.
 * HTTPS is enforced by HSTS (below) and the host, not by upgrade-insecure-requests,
 * so `pnpm start` still works over http://localhost.
 */

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
