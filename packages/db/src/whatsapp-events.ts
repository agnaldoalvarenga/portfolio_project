import { sql } from "drizzle-orm";
import { db } from "./client";

/**
 * Idempotency / replay protection for Meta webhook retries.
 * Returns true only the first time we see a given wamid.
 */
export async function markWhatsAppEventProcessed(wamid: string): Promise<boolean> {
  const rows = await db.execute<{ wamid: string }>(sql`
    INSERT INTO whatsapp_events (wamid) VALUES (${wamid})
    ON CONFLICT (wamid) DO NOTHING
    RETURNING wamid;
  `);
  return rows.length > 0;
}
