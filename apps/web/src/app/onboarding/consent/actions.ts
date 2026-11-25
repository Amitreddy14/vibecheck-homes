"use server";

import { redirect } from "next/navigation";
import { UNDER_18, consentGateSchema } from "@vch/shared";
import { SIGN_IN_PATH } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConsentFormState = { error: string | null };

const AFTER_CONSENT_PATH = "/home"; // becomes the onboarding steps in T1.5

/**
 * Saves consent + first name + date of birth in one database call (all or nothing).
 * Under-18: nothing is saved, the brand-new account is deleted, and the person is
 * signed out with a kind message.
 */
export async function acceptPrivacyNotice(
  _prev: ConsentFormState,
  formData: FormData,
): Promise<ConsentFormState> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(SIGN_IN_PATH);

  const parsed = consentGateSchema.safeParse({
    noticeVersion: formData.get("noticeVersion"),
    firstName: formData.get("firstName"),
    dateOfBirth: formData.get("dateOfBirth"),
    agree: formData.get("agree") ?? undefined,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => issue.message);
    if (messages.includes(UNDER_18)) return handleUnder18(supabase);
    return { error: messages[0] ?? "Please check the form and try again." };
  }

  const { error } = await supabase.rpc("accept_privacy_notice", {
    p_notice_version: parsed.data.noticeVersion,
    p_first_name: parsed.data.firstName,
    p_date_of_birth: parsed.data.dateOfBirth,
  });

  if (error) {
    // 23514 = a database CHECK said no (for example the 18+ rule around midnight UTC).
    if (error.code === "23514") return { error: "Please check your name and date of birth." };
    return { error: "We couldn't save that. Please try again." };
  }

  redirect(AFTER_CONSENT_PATH);
}

async function handleUnder18(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ConsentFormState> {
  // Someone who already has a profile (e.g. re-agreeing to a newer notice) is never
  // auto-deleted by a date typo here; they just get an error.
  const { data: profile } = await supabase.from("profiles").select("id").maybeSingle();
  if (profile) return { error: "Please check your date of birth." };

  await supabase.rpc("delete_own_account");
  await supabase.auth.signOut();
  redirect(`${SIGN_IN_PATH}?error=under_18`);
}
