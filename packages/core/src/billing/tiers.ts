export type Tier = "starter" | "growth" | "scale";
export const TIERS: readonly Tier[] = ["starter", "growth", "scale"] as const;

/** Resolve the Stripe Price ID for a retainer tier. Prices live in env, not code. */
export function priceIdForTier(tier: Tier, prices: Partial<Record<Tier, string>>): string {
  const id = prices[tier];
  if (!id) throw new Error(`No Stripe price configured for tier '${tier}'`);
  return id;
}
