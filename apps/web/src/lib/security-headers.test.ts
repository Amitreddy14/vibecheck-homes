import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

const header = (key: string) => securityHeaders.find((h) => h.key === key)?.value;

describe("securityHeaders", () => {
  it("includes every header required by rules.md §4", () => {
    const keys = securityHeaders.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
  });

  it("blocks framing, plugins and foreign form targets", () => {
    const csp = header("Content-Security-Policy") ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(header("X-Frame-Options")).toBe("DENY");
  });

  it("turns off camera and microphone access", () => {
    expect(header("Permissions-Policy")).toMatch(/camera=\(\)/);
    expect(header("Permissions-Policy")).toMatch(/microphone=\(\)/);
  });
});
