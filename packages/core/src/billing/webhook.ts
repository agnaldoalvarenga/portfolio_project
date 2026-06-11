import type Stripe from "stripe";

/**
 * Verify and parse a Stripe webhook. constructEvent checks the HMAC signature
 * and rejects payloads outside the timestamp tolerance (replay protection).
 */
export function constructStripeEvent(
  stripe: Stripe,
  payload: string,
  signature: string | null,
  secret: string,
): Stripe.Event {
  if (!signature) throw new Error("Missing Stripe signature");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
