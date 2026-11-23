/** App pages that need a signed-in user. Everything else is public. */
export const PROTECTED_PREFIXES = [
  "/home",
  "/onboarding",
  "/discover",
  "/matches",
  "/chat",
  "/house",
  "/settings",
] as const;

export const SIGN_IN_PATH = "/sign-in";
export const AFTER_SIGN_IN_PATH = "/home";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Where to send someone after sign-in. Only our own protected pages are allowed:
 * anything else (other sites, "//evil.com", "/\\evil.com", encoded tricks) falls
 * back to the default, so sign-in links can't be abused as open redirects.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return AFTER_SIGN_IN_PATH;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return AFTER_SIGN_IN_PATH;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
    return AFTER_SIGN_IN_PATH;
  }
  // Parse against a dummy origin: if the result leaves that origin, reject it.
  const url = new URL(decoded, "https://vibecheck.invalid");
  if (url.origin !== "https://vibecheck.invalid") return AFTER_SIGN_IN_PATH;
  if (!isProtectedPath(url.pathname)) return AFTER_SIGN_IN_PATH;
  return `${url.pathname}${url.search}`;
}
