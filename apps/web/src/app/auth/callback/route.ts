import { NextResponse, type NextRequest } from "next/server";
import { SIGN_IN_PATH, safeNextPath } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google sends people back here with a one-time `code`. We swap it for a session
 * (stored in secure cookies) and continue to a checked, same-site page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(`${SIGN_IN_PATH}?error=callback`, request.nextUrl.origin));
}
