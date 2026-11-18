import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    const env = parseEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000", NODE_ENV: "test" });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("test");
  });

  it("defaults NODE_ENV to development", () => {
    const env = parseEnv({ NEXT_PUBLIC_APP_URL: "https://vibecheck.example" });
    expect(env.NODE_ENV).toBe("development");
  });

  it("fails with a readable message when a variable is missing", () => {
    expect(() => parseEnv({})).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_APP_URL: "localhost" })).toThrowError(/must be a full URL/);
  });
});
