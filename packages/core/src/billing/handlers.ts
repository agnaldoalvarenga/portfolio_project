import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type Stripe from "stripe";

/**
 * Apply the side effects of a verified Stripe event. Only the events we model
 * are handled; everything else is acknowledged and ignored.
 */
export async function handleStripeEvent(db: PostgresJsDatabase, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const establishmentId = s.client_reference_id ?? s.metadata?.establishmentId;
      const tier = s.metadata?.tier;
      if (!establishmentId || !tier) return;
      await db.execute(sql`
        INSERT INTO subscriptions (establishment_id, stripe_customer_id, stripe_subscription_id, tier, status)
        VALUES (${establishmentId}, ${String(s.customer ?? "")}, ${String(s.subscription ?? "")}, ${tier}, 'active')
        ON CONFLICT (establishment_id) DO UPDATE
          SET stripe_customer_id = EXCLUDED.stripe_customer_id,
              stripe_subscription_id = EXCLUDED.stripe_subscription_id,
              tier = EXCLUDED.tier, status = 'active', updated_at = now();`);
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      await db.execute(sql`
        UPDATE subscriptions SET status = ${status}, updated_at = now()
        WHERE stripe_subscription_id = ${sub.id};`);
      return;
    }
    case "account.updated": {
      const acct = event.data.object as Stripe.Account;
      await db.execute(sql`
        UPDATE connect_accounts
        SET charges_enabled = ${acct.charges_enabled ? "true" : "false"},
            payouts_enabled = ${acct.payouts_enabled ? "true" : "false"}, updated_at = now()
        WHERE stripe_account_id = ${acct.id};`);
      return;
    }
    default:
      return; // acknowledged, no-op
  }
}
