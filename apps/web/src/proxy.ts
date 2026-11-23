import type { NextRequest } from "next/server";
import { AFTER_SIGN_IN_PATH, SIGN_IN_PATH, isProtectedPath } from "@/lib/auth/paths";
import { redirectKeepingSession, updateSession } from "@/lib/supabase/proxy";

/** Runs before every matching request (Next.js 16 "proxy", formerly middleware). */
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Private page, nobody signed in: go to sign-in and come back afterwards.
  if (!isSignedIn && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectKeepingSession(response, url);
  }

  // Already signed in: skip the sign-in page.
  if (isSignedIn && pathname === SIGN_IN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = AFTER_SIGN_IN_PATH;
    url.search = "";
    return redirectKeepingSession(response, url);
  }

  return response;
}

export const config = {
  // Skip static files and images: they never need a session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
