import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getEstablishmentKpis } from "@ostentaculus/core/dashboard/kpis";
import { generateWeeklyReport } from "@ostentaculus/ai/report";

/**
 * Generate + store an AI weekly report for every active, POS-connected
 * establishment. Run on a schedule (n8n cron or a Fly machine cron).
 */
export async function runWeeklyReports(db: PostgresJsDatabase): Promise<number> {
  const ests = await db.execute<{ id: string; name: string }>(sql`
    SELECT id, name FROM establishments WHERE status='active' AND pos_connected='true';`);

  let generated = 0;
  for (const e of ests) {
    const kpis = await getEstablishmentKpis(db, e.id);
    if (kpis.periods.length === 0) continue;
    const narrative = await generateWeeklyReport({ establishmentName: e.name, kpis });
    const periodEnd = kpis.periods[0]!.periodStart;
    const periodStart = kpis.periods[kpis.periods.length - 1]!.periodStart;
    await db.execute(sql`
      INSERT INTO weekly_reports (establishment_id, period_start, period_end, narrative, kpis_snapshot, model)
      VALUES (${e.id}, ${periodStart}, ${periodEnd}, ${narrative}, ${JSON.stringify(kpis)}::jsonb, 'claude-opus-4-8');`);
    generated++;
  }
  return generated;
}
