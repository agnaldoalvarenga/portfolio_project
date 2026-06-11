import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { stripeClient } from "./stripe";
import { computeCommissionCents } from "./commission";

/** Create or reuse a Connect Express account for an establishment + onboarding link. */
export async function createConnectOnboarding(
  db: PostgresJsDatabase,
  input: { establishmentId: string; refreshUrl: string; returnUrl: string },
): Promise<string> {
  const stripe = stripeClient();
  const existing = await db.execute<{ stripe_account_id: string }>(sql`
    SELECT stripe_account_id FROM connect_accounts WHERE establishment_id = ${input.establishmentId} LIMIT 1;`);
  let accountId = existing[0]?.stripe_account_id;
  if (!accountId) {
    const acct = await stripe.accounts.create({ type: "express", metadata: { establishmentId: input.establishmentId } });
    accountId = acct.id;
    await db.execute(sql`
      INSERT INTO connect_accounts (establishment_id, stripe_account_id)
      VALUES (${input.establishmentId}, ${accountId}) ON CONFLICT (establishment_id) DO NOTHING;`);
  }
  const link = await stripe.accountLinks.create({
    account: accountId, refresh_url: input.refreshUrl, return_url: input.returnUrl, type: "account_onboarding",
  });
  return link.url;
}

/** Split a B2B route booking: transfer commission to the establishment's connected account. */
export async function payRouteCommission(
  db: PostgresJsDatabase,
  input: { establishmentId: string; routeId?: string; grossCents: number; pct: number },
): Promise<{ transferId: string; commissionCents: number }> {
  const commissionCents = computeCommissionCents(input.grossCents, input.pct);
  const acct = await db.execute<{ stripe_account_id: string }>(sql`
    SELECT stripe_account_id FROM connect_accounts WHERE establishment_id = ${input.establishmentId} LIMIT 1;`);
  const destination = acct[0]?.stripe_account_id;
  if (!destination) throw new Error("Establishment has no connected Stripe account");
  const transfer = await stripeClient().transfers.create({
    amount: commissionCents, currency: "eur", destination,
    metadata: { establishmentId: input.establishmentId, routeId: input.routeId ?? "" },
  });
  await db.execute(sql`
    INSERT INTO commissions (establishment_id, route_id, gross_cents, commission_pct, commission_cents, stripe_transfer_id)
    VALUES (${input.establishmentId}, ${input.routeId ?? null}, ${input.grossCents}, ${input.pct}, ${commissionCents}, ${transfer.id});`);
  return { transferId: transfer.id, commissionCents };
}
