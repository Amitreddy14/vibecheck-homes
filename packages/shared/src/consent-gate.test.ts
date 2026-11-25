import { describe, expect, it } from "vitest";
import { UNDER_18, consentGateSchema } from "./consent-gate";
import { todayUtc } from "./age";

const valid = { noticeVersion: "v1", firstName: "  Asha ", dateOfBirth: "2003-05-10", agree: "on" };

function messages(input: Record<string, unknown>): string[] {
  const result = consentGateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("consent gate form", () => {
  it("accepts an adult who agrees, and trims the name", () => {
    const result = consentGateSchema.parse(valid);
    expect(result.firstName).toBe("Asha");
  });

  it("flags under-18 with its own marker", () => {
    const year = Number(todayUtc().slice(0, 4)) - 17;
    expect(messages({ ...valid, dateOfBirth: `${year}-01-01` })).toEqual([UNDER_18]);
  });

  it("never treats a typo or impossible date as under-18", () => {
    for (const dateOfBirth of ["abc", "", "2003-13-45", "1850-01-01", "2999-01-01"]) {
      expect(messages({ ...valid, dateOfBirth })).not.toContain(UNDER_18);
      expect(messages({ ...valid, dateOfBirth }).length).toBeGreaterThan(0);
    }
  });

  it("requires agreement, a name and the current notice version", () => {
    expect(messages({ ...valid, agree: undefined }).length).toBe(1);
    expect(messages({ ...valid, firstName: "   " }).length).toBe(1);
    expect(messages({ ...valid, firstName: "x".repeat(41) }).length).toBe(1);
    expect(messages({ ...valid, noticeVersion: "v0" }).length).toBe(1);
  });
});
