import { z } from "zod";

/**
 * All environment variables the web app reads, checked once at startup.
 * A missing or malformed value stops the build/server with a clear message
 * instead of failing later in some random request.
 *
 * Rules (rules.md §3):
 * - NEXT_PUBLIC_* values are sent to the browser: never put secrets in them.
 * - Server-only secrets go in `serverSchema` and are read only in server code.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url({ message: "must be a full URL, e.g. http://localhost:3000" }),
});

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const schema = publicSchema.extend(serverSchema.shape);

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${problems}\n` +
        "Copy .env.example to apps/web/.env.local and fill in the values.",
    );
  }
  return result.data;
}

/**
 * Next.js inlines NEXT_PUBLIC_* only when they are read by their full name,
 * so list each one explicitly here.
 */
export const env = parseEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});
