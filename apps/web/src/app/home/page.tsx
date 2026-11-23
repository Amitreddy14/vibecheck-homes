import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

/** Temporary signed-in page until onboarding (T1.5) replaces it. */
export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  // getUser() asks Supabase to confirm the session (the proxy already guarded this page).
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(SIGN_IN_PATH);

  const name = data.user.user_metadata?.full_name ?? data.user.email ?? "there";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="font-display text-4xl font-bold leading-tight">Hi, {String(name)}</h1>
      <p className="text-lg">You&apos;re signed in. Setting up your profile comes next.</p>
      <form action={signOut}>
        <button
          type="submit"
          className="h-14 rounded-full border-2 border-line bg-surface px-6 font-bold"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
