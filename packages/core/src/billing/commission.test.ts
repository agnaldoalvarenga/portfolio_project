import { describe, it, expect } from "vitest";
import { computeCommissionCents } from "./commission";

describe("computeCommissionCents", () => {
  it("computes a percentage in integer cents", () => {
    expect(computeCommissionCents(10_000, 15)).toBe(1500); // €100 @ 15% = €15
  });
  it("rounds to the nearest cent", () => {
    expect(computeCommissionCents(999, 15)).toBe(Math.round(999 * 0.15)); // 149.85 -> 150
  });
  it("handles 0% and 100%", () => {
    expect(computeCommissionCents(5000, 0)).toBe(0);
    expect(computeCommissionCents(5000, 100)).toBe(5000);
  });
  it("rejects bad input", () => {
    expect(() => computeCommissionCents(-1, 10)).toThrow();
    expect(() => computeCommissionCents(10.5, 10)).toThrow();
    expect(() => computeCommissionCents(100, 101)).toThrow();
    expect(() => computeCommissionCents(100, -1)).toThrow();
  });
});
