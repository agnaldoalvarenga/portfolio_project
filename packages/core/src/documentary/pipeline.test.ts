import { describe, it, expect } from "vitest";
import { canAdvance, nextStage } from "./pipeline";

describe("documentary pipeline state machine", () => {
  it("allows strictly-next transitions", () => {
    expect(canAdvance("research", "shoot")).toBe(true);
    expect(canAdvance("shoot", "edit")).toBe(true);
    expect(canAdvance("edit", "published")).toBe(true);
  });
  it("rejects skips and regressions", () => {
    expect(canAdvance("research", "edit")).toBe(false);
    expect(canAdvance("published", "research")).toBe(false);
    expect(canAdvance("edit", "shoot")).toBe(false);
  });
  it("nextStage terminates at published", () => {
    expect(nextStage("edit")).toBe("published");
    expect(nextStage("published")).toBeNull();
  });
});
