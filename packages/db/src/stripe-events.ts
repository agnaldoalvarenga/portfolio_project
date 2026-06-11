import { sql } from "drizzle-orm";
import { db } from "./client";

/** Has this Stripe event already been fully processed? */
export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const rows = await db.execute<{ event_id: string }>(sql`
    SELECT event_id FROM stripe_events WHERE event_id = ${eventId} LIMIT 1;`);
  return rows.length > 0;
}

/** Mark an event processed AFTER its side effects succeeded (idempotent insert). */
export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO stripe_events (event_id) VALUES (${eventId})
    ON CONFLICT (event_id) DO NOTHING;`);
}
