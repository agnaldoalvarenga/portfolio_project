import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface KpiPoint { periodStart: string; avgTicket: number }

export interface EstablishmentKpis {
  periods: KpiPoint[];      // newest first
  avgTicket: number | null; // latest
  trendPct: number | null;  // latest vs previous, %
  heroProduct: string | null;
  peakHours: string[];
}

/** Aggregate the last N POS periods into dashboard KPIs. Scope is enforced by
 *  the caller via assertEstablishmentAccess (server connection bypasses RLS). */
export async function getEstablishmentKpis(
  db: PostgresJsDatabase,
  establishmentId: string,
  limit = 30,
): Promise<EstablishmentKpis> {
  const rows = await db.execute<{
    periodStart: string; avgTicket: number; peakHours: string[]; heroProduct: string | null;
  }>(sql`
    SELECT period_start AS "periodStart", avg_ticket::float8 AS "avgTicket",
           peak_hours AS "peakHours", hero_product AS "heroProduct"
    FROM pos_metrics
    WHERE establishment_id = ${establishmentId}
    ORDER BY period_start DESC
    LIMIT ${limit};
  `);

  const periods: KpiPoint[] = rows.map((r) => ({ periodStart: r.periodStart, avgTicket: r.avgTicket }));
  const latest = periods[0]?.avgTicket ?? null;
  const prev = periods[1]?.avgTicket ?? null;
  const trendPct = latest !== null && prev !== null && prev !== 0
    ? Number((((latest - prev) / prev) * 100).toFixed(1))
    : null;

  return {
    periods,
    avgTicket: latest,
    trendPct,
    heroProduct: rows[0]?.heroProduct ?? null,
    peakHours: rows[0]?.peakHours ?? [],
  };
}
