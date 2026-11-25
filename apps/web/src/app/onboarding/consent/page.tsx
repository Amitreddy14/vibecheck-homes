import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PRIVACY_NOTICE, todayUtc } from "@vch/shared";
import { PrivacyNotice } from "@/components/privacy-notice";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { hasCurrentConsent } from "@/lib/onboarding/gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Before we start" };

/** The gate: privacy notice + first name + date of birth, before any other data. */
export default async function ConsentPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(SIGN_IN_PATH);
  if (await hasCurrentConsent(supabase)) redirect("/home");

  // Prefill the first word of the Google name; the person can change it.
  const googleName = data.user.user_metadata?.full_name;
  const firstName = typeof googleName === "string" ? (googleName.trim().split(/\s+/)[0] ?? "") : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-bold leading-tight">Before we start</h1>
        <p className="rounded-md bg-callout p-4 text-lg text-on-color">{PRIVACY_NOTICE.summary}</p>
      </div>

      <details className="rounded-md border-2 border-line bg-surface p-4">
        <summary className="cursor-pointer font-bold">Read the full privacy notice</summary>
        <div className="mt-4">
          <PrivacyNotice headingLevel={3} />
        </div>
      </details>

      <ConsentForm defaultFirstName={firstName.slice(0, 40)} today={todayUtc()} />
    </main>
  );
}
