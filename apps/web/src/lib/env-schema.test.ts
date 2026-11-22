import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

/** Builds a fake JWT-style key with the given role (signature is irrelevant here). */
const fakeJwt = (role: string) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.sig`;

const valid = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_exampleexampleexample",
};

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    const env = parseEnv({ ...valid, NODE_ENV: "test" });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("test");
  });

  it("defaults NODE_ENV to development", () => {
    expect(parseEnv(valid).NODE_ENV).toBe("development");
  });

  it("fails with a readable message when a variable is missing", () => {
    expect(() => parseEnv({})).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it("rejects an app URL that is not a URL", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_APP_URL: "localhost" })).toThrowError(
      /must be a full URL/,
    );
  });
});

describe("Supabase settings", () => {
  it("accepts the older anon (JWT) key", () => {
    const env = parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fakeJwt("anon") });
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")).toBe(true);
  });

  it("refuses a new-style secret key", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abcdefghijklmnop" }),
    ).toThrowError(/SECRET key/);
  });

  it("refuses an old-style service_role key", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fakeJwt("service_role") }),
    ).toThrowError(/SECRET key/);
  });

  it("refuses a value that is not a Supabase key", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "my-password-123" }),
    ).toThrowError(/publishable key/);
  });

  it("allows plain http only for the local database", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }),
    ).not.toThrow();
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://evil.example.com" }),
    ).toThrowError(/https/);
  });
});
