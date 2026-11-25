/**
 * Shared code used by web (and later mobile and server code):
 * constants, types and Zod schemas. No framework or browser-only imports here.
 */

export const APP_NAME = "Vibecheck Homes";

/** Launch city for the first beta. Kept here so web and mobile agree. */
export const LAUNCH_CITY = "Chennai";

export { MINIMUM_AGE, isAdult, latestAdultBirthDate, todayUtc } from "./age";
export { PRIVACY_NOTICE, type NoticeSection, type NoticeVersion } from "./privacy-notice";
export { UNDER_18, consentGateSchema, type ConsentGateInput } from "./consent-gate";
