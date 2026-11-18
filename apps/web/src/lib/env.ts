import { parseEnv } from "./env-schema";

export type { Env } from "./env-schema";

/**
 * The checked environment for the app. Importing this module validates
 * process.env and throws a readable error if anything is missing or wrong.
 *
 * Next.js inlines NEXT_PUBLIC_* only when they are read by their full name,
 * so list each one explicitly here.
 */
export const env = parseEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});
