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

/** Reads the `role` claim of a JWT-style key without verifying it (format check only). */
function jwtRole(token: string): string | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as {
      role?: unknown;
    };
    return typeof json.role === "string" ? json.role : undefined;
  } catch {
    return undefined;
  }
}

const isLocalHttp = (url: string) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(url);

const supabaseUrl = z
  .url({ message: "must be a full URL, e.g. https://<project-ref>.supabase.co" })
  .refine((url) => url.startsWith("https://") || isLocalHttp(url), {
    message: "must use https:// (plain http only for the local database)",
  });

// The browser may only ever get the PUBLIC key. A secret / service_role key here would
// let anyone bypass row level security, so it stops the app from starting.
const supabasePublishableKey = z
  .string()
  .trim()
  .refine((key) => !key.startsWith("sb_secret_") && jwtRole(key) !== "service_role", {
    message:
      "this is a SECRET key. Use the publishable key (sb_publishable_...) or the anon key instead",
  })
  .refine((key) => key.startsWith("sb_publishable_") || key.startsWith("eyJ"), {
    message: "must be a Supabase publishable key (sb_publishable_...) or anon key (eyJ...)",
  });

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url({ message: "must be a full URL, e.g. http://localhost:3000" }),
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
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
