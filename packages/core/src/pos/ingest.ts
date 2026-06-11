import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { posRecord } from "./types";

/** Idempotent upsert keyed by (establishment_id, period_start). */
export async function ingestPosMetrics(
  db: PostgresJsDatabase,
  establishmentId: string,
  records: unknown[],
): Promise<number> {
  let n = 0;
  for (const raw of records) {
    const r = posRecord.parse(raw); // Zod validates every record at the edge
    await db.execute(sql`
      INSERT INTO pos_metrics (establishment_id, period_start, avg_ticket, peak_hours, hero_product)
      VALUES (${establishmentId}, ${r.periodStart.toISOString()}, ${r.avgTicket},
              ${JSON.stringify(r.peakHours)}::jsonb, ${r.heroProduct ?? null})
      ON CONFLICT (establishment_id, period_start) DO UPDATE
        SET avg_ticket = EXCLUDED.avg_ticket, peak_hours = EXCLUDED.peak_hours,
            hero_product = EXCLUDED.hero_product, updated_at = now();
    `);
    n++;
  }
  return n;
}
