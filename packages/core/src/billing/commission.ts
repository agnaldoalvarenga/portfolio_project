/** Commission in integer cents. Guards against float drift and bad input. */
export function computeCommissionCents(grossCents: number, pct: number): number {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new Error("grossCents must be a non-negative integer");
  }
  if (pct < 0 || pct > 100) throw new Error("pct must be between 0 and 100");
  return Math.round(grossCents * (pct / 100));
}
