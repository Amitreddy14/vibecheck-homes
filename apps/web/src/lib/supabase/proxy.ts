import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Refreshes the signed-in user's session on every request and passes updated
 * auth cookies to both the page (request) and the browser (response).
 * Returns whether someone is signed in, so the proxy can guard private pages.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // "Don't cache" headers from Supabase: a cached response holding auth
          // cookies could hand one user's session to another user.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Keep this call directly after creating the client: it validates the session
  // token and triggers the refresh. Nothing should run in between.
  const { data } = await supabase.auth.getClaims();

  return { response, isSignedIn: Boolean(data?.claims?.sub) };
}

/**
 * A redirect that keeps any refreshed auth cookies and no-cache headers.
 * Dropping them would sign the user out or make the redirect cacheable.
 */
export function redirectKeepingSession(from: NextResponse, to: URL): NextResponse {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((name) => {
    const value = from.headers.get(name);
    if (value) redirect.headers.set(name, value);
  });
  return redirect;
}
