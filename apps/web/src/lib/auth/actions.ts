"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SIGN_IN_PATH, safeNextPath } from "./paths";

/** Starts "Continue with Google". Server Actions get Next.js's built-in CSRF (origin) check. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createSupabaseServerClient();

  const callback = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    redirect(`${SIGN_IN_PATH}?error=google`);
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(SIGN_IN_PATH);
}
