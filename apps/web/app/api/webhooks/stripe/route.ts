import { NextResponse } from "next/server";
import { getEnv } from "@ostentaculus/security/env";
import { stripeClient } from "@ostentaculus/core/billing/stripe";
import { constructStripeEvent } from "@ostentaculus/core/billing/webhook";
import { handleStripeEvent } from "@ostentaculus/core/billing/handlers";
import { isStripeEventProcessed, markStripeEventProcessed } from "@ostentaculus/db/stripe-events";
import { writeAuditLog } from "@ostentaculus/db/audit";
import { db } from "@ostentaculus/db/client";

export const runtime = "nodejs"; // need raw body for signature verification

export async function POST(req: Request): Promise<Response> {
  const env = getEnv();
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("billing disabled", { status: 503 });

  const raw = await req.text();
  let event;
  try {
    event = constructStripeEvent(stripeClient(), raw, req.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: skip if already processed. Handlers are idempotent upserts, so
  // a rare concurrent duplicate is harmless; we mark AFTER success so a failed
  // handler is retried by Stripe rather than silently dropped.
  if (await isStripeEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeEvent(db, event);
  } catch {
    return new Response("handler error", { status: 500 }); // not marked -> Stripe retries
  }

  await markStripeEventProcessed(event.id);
  await writeAuditLog({ action: `stripe.${event.type}`, subject: event.id });
  return NextResponse.json({ received: true });
}
