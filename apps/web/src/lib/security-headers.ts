/**
 * Security headers sent on every response (rules.md §4).
 *
 * CSP note: Next.js needs inline scripts to boot. A nonce-based CSP removes
 * 'unsafe-inline' but makes every page dynamic, so it is scheduled for the
 * Phase 6 hardening task (review finding F6). Until then this CSP still blocks
 * plugins, framing, foreign form targets and scripts from other sites.
 * HTTPS is enforced by HSTS (below) and the host, not by upgrade-insecure-requests,
 * so `pnpm start` still works over http://localhost.
 */

export type SecurityHeader = { key: string; value: string };

/**
 * @param supabaseUrl The project URL. The browser talks to it over HTTPS (API, auth,
 *   storage images) and WebSockets (realtime), so CSP must allow exactly that origin.
 */
export function buildSecurityHeaders(
  supabaseUrl: string,
  isDev = process.env.NODE_ENV !== "production",
): SecurityHeader[] {
  const supabase = new URL(supabaseUrl);
  const supabaseHttp = supabase.origin;
  const supabaseWs = `${supabase.protocol === "https:" ? "wss:" : "ws:"}//${supabase.host}`;

  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseHttp}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseHttp} ${supabaseWs}${isDev ? " ws: http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return [
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
}
