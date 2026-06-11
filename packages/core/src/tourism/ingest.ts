import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { tourismPoint } from "./types";

/** Idempotent upsert keyed by (source, region, period, metric). */
export async function ingestTourism(db: PostgresJsDatabase, points: unknown[]): Promise<number> {
  let n = 0;
  for (const raw of points) {
    const p = tourismPoint.parse(raw);
    await db.execute(sql`
      INSERT INTO tourism_data (source, region, period, metric, value, unit)
      VALUES (${p.source}, ${p.region}, ${p.period}, ${p.metric}, ${p.value}, ${p.unit})
      ON CONFLICT (source, region, period, metric)
      DO UPDATE SET value = EXCLUDED.value, unit = EXCLUDED.unit, updated_at = now();
    `);
    n++;
  }
  return n;
}
