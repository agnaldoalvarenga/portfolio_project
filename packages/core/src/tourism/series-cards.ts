import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface SeriesCard { source: string; region: string; content: string }

/**
 * Compress raw series into short textual "cards" per (source, region, metric)
 * — peak/low periods + recent value — suitable for embedding & retrieval.
 */
export async function buildSeriesCards(db: PostgresJsDatabase): Promise<SeriesCard[]> {
  const rows = await db.execute<{
    source: string; region: string; metric: string; unit: string;
    maxPeriod: string; maxValue: number; minPeriod: string; minValue: number;
    lastPeriod: string; lastValue: number;
  }>(sql`
    WITH ranked AS (
      SELECT source, region, metric, unit, period, value,
             row_number() OVER (PARTITION BY source,region,metric ORDER BY value DESC) AS hi,
             row_number() OVER (PARTITION BY source,region,metric ORDER BY value ASC)  AS lo,
             row_number() OVER (PARTITION BY source,region,metric ORDER BY period DESC) AS rec
      FROM tourism_data
    )
    SELECT source, region, metric, unit,
      max(period) FILTER (WHERE hi=1)  AS "maxPeriod", max(value) FILTER (WHERE hi=1)  AS "maxValue",
      max(period) FILTER (WHERE lo=1)  AS "minPeriod", max(value) FILTER (WHERE lo=1)  AS "minValue",
      max(period) FILTER (WHERE rec=1) AS "lastPeriod", max(value) FILTER (WHERE rec=1) AS "lastValue"
    FROM ranked GROUP BY source, region, metric, unit;
  `);

  return rows.map((r) => ({
    source: r.source,
    region: r.region,
    content:
      `${r.metric} (${r.unit}) for ${r.region} [${r.source}]: ` +
      `peak ${r.maxValue} in ${r.maxPeriod}, low ${r.minValue} in ${r.minPeriod}, ` +
      `latest ${r.lastValue} in ${r.lastPeriod}.`,
  }));
}
