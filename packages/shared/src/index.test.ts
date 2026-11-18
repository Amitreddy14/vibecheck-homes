import { describe, expect, it } from "vitest";
import { APP_NAME, LAUNCH_CITY } from "./index";

describe("shared constants", () => {
  it("names the app and launch city", () => {
    expect(APP_NAME).toBe("Vibecheck Homes");
    expect(LAUNCH_CITY).toBe("Chennai");
  });
});
