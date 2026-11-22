import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "./security-headers";

const SUPABASE = "https://abcdefghijklmnopqrst.supabase.co";
const headers = buildSecurityHeaders(SUPABASE, false);
const header = (key: string) => headers.find((h) => h.key === key)?.value;

describe("buildSecurityHeaders", () => {
  it("includes every header required by rules.md §4", () => {
    expect(headers.map((h) => h.key)).toEqual(
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

  it("lets the browser reach exactly our Supabase project (API, realtime, images)", () => {
    const csp = header("Content-Security-Policy") ?? "";
    expect(csp).toContain(`connect-src 'self' ${SUPABASE} wss://abcdefghijklmnopqrst.supabase.co`);
    expect(csp).toContain(`img-src 'self' data: blob: ${SUPABASE}`);
    expect(csp).not.toMatch(/\*\.supabase\.co/);
  });

  it("uses ws:// for a local (http) database", () => {
    const csp =
      buildSecurityHeaders("http://127.0.0.1:54321", false).find(
        (h) => h.key === "Content-Security-Policy",
      )?.value ?? "";
    expect(csp).toContain("ws://127.0.0.1:54321");
  });

  it("allows eval only in development", () => {
    const devCsp =
      buildSecurityHeaders(SUPABASE, true).find((h) => h.key === "Content-Security-Policy")
        ?.value ?? "";
    expect(header("Content-Security-Policy")).not.toContain("unsafe-eval");
    expect(devCsp).toContain("unsafe-eval");
  });

  it("turns off camera and microphone access", () => {
    expect(header("Permissions-Policy")).toMatch(/camera=\(\)/);
    expect(header("Permissions-Policy")).toMatch(/microphone=\(\)/);
  });
});
