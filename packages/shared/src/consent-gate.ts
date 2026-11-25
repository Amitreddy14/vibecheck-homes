import { z } from "zod";
import { isAdult, todayUtc } from "./age";
import { PRIVACY_NOTICE } from "./privacy-notice";

/** Message used to tell "under 18" apart from ordinary form mistakes. */
export const UNDER_18 = "under_18";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The consent + 18+ form. Limits mirror the database (profiles.first_name,
 * profiles.date_of_birth, consents.notice_version).
 */
export const consentGateSchema = z.object({
  noticeVersion: z.literal(PRIVACY_NOTICE.version, {
    error: "The privacy notice changed. Please reload the page.",
  }),
  firstName: z
    .string()
    .trim()
    .min(1, { error: "Please enter your first name." })
    .max(40, { error: "First name can be at most 40 characters." }),
  dateOfBirth: z.iso
    .date({ error: "Please enter your date of birth." })
    .refine(isPlausibleBirthDate, { error: "Please check your date of birth." })
    // Only judge age for a real, plausible date, so a typo is never mistaken for "under 18".
    .refine((d) => !isPlausibleBirthDate(d) || isAdult(d), { error: UNDER_18 }),
  agree: z.literal("on", {
    error: "Please tick the box to agree to the privacy notice.",
  }),
});

function isPlausibleBirthDate(d: string): boolean {
  return ISO_DATE.test(d) && d >= "1900-01-01" && d <= todayUtc();
}

export type ConsentGateInput = z.infer<typeof consentGateSchema>;
