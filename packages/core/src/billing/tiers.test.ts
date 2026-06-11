import { describe, it, expect } from "vitest";
import { priceIdForTier } from "./tiers";

describe("priceIdForTier", () => {
  const prices = { starter: "price_s", growth: "price_g", scale: "price_x" };
  it("maps each tier to its configured price id", () => {
    expect(priceIdForTier("starter", prices)).toBe("price_s");
    expect(priceIdForTier("scale", prices)).toBe("price_x");
  });
  it("throws when a tier has no configured price", () => {
    expect(() => priceIdForTier("growth", { starter: "price_s" })).toThrow();
  });
});
