import { describe, it, expect } from "vitest";
import { prepareUserText } from "./guardrails";
import { pseudonymize } from "./pii";

const hasControl = (s: string) =>
  [...s].some((c) => {
    const n = c.codePointAt(0)!;
    return n < 0x20 || n === 0x7f;
  });

describe("concierge guardrails", () => {
  it("strips control chars and redacts PII", () => {
    const out = prepareUserText("reach me at +34 600 123 456\tok")!; // \t is a control char
    expect(out).toContain("[phone]");
    expect(hasControl(out)).toBe(false);
  });
  it("caps length at 500", () => {
    expect(prepareUserText("a".repeat(1000))!.length).toBe(500);
  });
  it("returns null for empty/whitespace", () => {
    expect(prepareUserText("   ")).toBeNull();
    expect(prepareUserText(null)).toBeNull();
  });
});

describe("pseudonymize", () => {
  it("is stable per salt and salt-sensitive", () => {
    expect(pseudonymize("+34600123456", "s1")).toBe(pseudonymize("+34600123456", "s1"));
    expect(pseudonymize("+34600123456", "s1")).not.toBe(pseudonymize("+34600123456", "s2"));
  });
});
