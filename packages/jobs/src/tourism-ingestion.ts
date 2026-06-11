import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { TourismConnector } from "@ostentaculus/core/tourism/types";
import { ingestTourism } from "@ostentaculus/core/tourism/ingest";
import { buildSeriesCards } from "@ostentaculus/core/tourism/series-cards";
import { indexTourismDocuments } from "@ostentaculus/ai/tourism-rag";

/**
 * Scheduled tourism pipeline: pull every connector -> normalize/upsert ->
 * rebuild series cards -> re-embed into pgvector. Run daily (n8n cron / Fly).
 */
export async function runTourismIngestion(
  db: PostgresJsDatabase, connectors: TourismConnector[], since: Date,
): Promise<{ ingested: number; indexed: number }> {
  let ingested = 0;
  for (const c of connectors) {
    try {
      const points = await c.fetch(since);
      ingested += await ingestTourism(db, points);
    } catch (err) {
      // One bad source must not abort the whole pipeline.
      console.error(`[tourism] connector ${c.source} failed:`, err);
    }
  }
  const cards = await buildSeriesCards(db);
  const indexed = await indexTourismDocuments(db, cards);
  return { ingested, indexed };
}
