import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "./paths";

describe("isProtectedPath", () => {
  it("protects app pages and their sub-pages", () => {
    expect(isProtectedPath("/home")).toBe(true);
    expect(isProtectedPath("/onboarding/photos")).toBe(true);
  });

  it("leaves public pages and look-alikes public", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(isProtectedPath("/homesick")).toBe(false);
  });
});

describe("safeNextPath (open-redirect protection)", () => {
  it("keeps our own protected pages, with their query", () => {
    expect(safeNextPath("/onboarding")).toBe("/onboarding");
    expect(safeNextPath("/settings?tab=privacy")).toBe("/settings?tab=privacy");
    expect(safeNextPath(encodeURIComponent("/matches/42"))).toBe("/matches/42");
  });

  it("falls back to /home when there's nothing", () => {
    expect(safeNextPath(null)).toBe("/home");
    expect(safeNextPath("")).toBe("/home");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "%2F%2Fevil.example",
    "javascript:alert(1)",
    "/sign-in",
    "/",
    "%E0%A4%A",
  ])("rejects %s", (next) => {
    expect(safeNextPath(next)).toBe("/home");
  });
});
