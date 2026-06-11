import Stripe from "stripe";
import { getEnv } from "@ostentaculus/security/env";

let cached: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws if billing is not configured. */
export function stripeClient(): Stripe {
  if (cached) return cached;
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(env.STRIPE_SECRET_KEY);
  return cached;
}
