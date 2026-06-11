import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { planEditorialCalendar } from "@ostentaculus/ai/marketing/chief-of-staff";
import { answerTourismQuestion } from "@ostentaculus/ai/tourism-rag";

/**
 * AI Chief of Staff weekly run: derive tourism demand context (FASE 2 RAG),
 * plan the editorial calendar, and persist briefs as 'planned' content.
 * The 3 specialist agents (audience / storytelling / distribution) then run
 * per-brief via the marketing router or a follow-up job.
 */
export async function runWeeklyContentPlan(
  db: PostgresJsDatabase,
  opts: { brand?: string; locale?: string; count?: number } = {},
): Promise<number> {
  const insight = await answerTourismQuestion(
    db,
    "Which regions and months show the strongest tourism demand right now, and why?",
  ).catch(() => ({ answer: "", sources: [] }));

  const recent = await db.execute<{ topic: string }>(sql`
    SELECT topic FROM content_briefs ORDER BY created_at DESC LIMIT 20;`);

  const briefs = await planEditorialCalendar({
    brand: opts.brand ?? "Ostentaculus",
    tourismInsights: insight.answer,
    recentTopics: recent.map((r) => r.topic),
    count: opts.count ?? 4,
    locale: opts.locale,
  });

  for (const b of briefs) {
    await db.execute(sql`
      INSERT INTO content_briefs (topic, region, angle, status)
      VALUES (${b.topic}, ${b.region}, ${b.angle}, 'planned');`);
  }
  return briefs.length;
}
