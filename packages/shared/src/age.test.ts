import { describe, expect, it } from "vitest";
import { isAdult, latestAdultBirthDate, todayUtc } from "./age";

describe("18+ rule (matches the database CHECK)", () => {
  it("is 18 on the 18th birthday, not the day before", () => {
    expect(isAdult("2008-11-25", "2026-11-25")).toBe(true);
    expect(isAdult("2008-11-26", "2026-11-25")).toBe(false);
  });

  it("clamps to the month's last day like Postgres", () => {
    // 2026-02-28 minus 18 years = 2008-02-28 (2008 is a leap year, no clamp needed)
    expect(latestAdultBirthDate("2026-02-28")).toBe("2008-02-28");
    // 2022-02-28 minus 18 years: 2004-02-28, so a 29 Feb 2004 baby is not 18 yet...
    expect(isAdult("2004-02-29", "2022-02-28")).toBe(false);
    // ...but is on 1 March.
    expect(isAdult("2004-02-29", "2022-03-01")).toBe(true);
    // 2026-03-31 minus 18 years lands on a real day, no clamp.
    expect(latestAdultBirthDate("2026-03-31")).toBe("2008-03-31");
  });

  it("uses the UTC date, like the database", () => {
    // 11:00 pm UTC on 24 Nov is already 25 Nov in India, but still the 24th for the DB.
    expect(todayUtc(new Date("2026-11-24T23:00:00Z"))).toBe("2026-11-24");
  });
});
