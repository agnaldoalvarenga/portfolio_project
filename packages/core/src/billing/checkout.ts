import { stripeClient } from "./stripe";
import { priceIdForTier, type Tier } from "./tiers";
import { getEnv } from "@ostentaculus/security/env";

/** Create a hosted Checkout session for a retainer subscription (no card on our server). */
export async function createRetainerCheckout(input: {
  establishmentId: string;
  tier: Tier;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const env = getEnv();
  const price = priceIdForTier(input.tier, {
    starter: env.STRIPE_PRICE_STARTER,
    growth: env.STRIPE_PRICE_GROWTH,
    scale: env.STRIPE_PRICE_SCALE,
  });
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    automatic_tax: { enabled: true }, // ES/PT/BR tax via Stripe Tax
    client_reference_id: input.establishmentId,
    metadata: { establishmentId: input.establishmentId, tier: input.tier },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
