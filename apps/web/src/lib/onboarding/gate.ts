import "server-only";
import { PRIVACY_NOTICE } from "@vch/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const CONSENT_PATH = "/onboarding/consent";

/**
 * Has the signed-in user agreed to the CURRENT privacy notice (and not withdrawn)?
 * RLS limits the query to their own rows. A new notice version sends everyone
 * back through the gate.
 */
export async function hasCurrentConsent(supabase: ServerClient): Promise<boolean> {
  const { data, error } = await supabase
    .from("consents")
    .select("id")
    .eq("purpose", "core_service")
    .eq("notice_version", PRIVACY_NOTICE.version)
    .is("withdrawn_at", null)
    .limit(1);
  // Fail closed: if we can't tell, show the gate again rather than skip it.
  if (error) return false;
  return data.length > 0;
}
