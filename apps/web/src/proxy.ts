import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Runs before every matching request (Next.js 16 "proxy", formerly middleware). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files and images: they never need a session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
