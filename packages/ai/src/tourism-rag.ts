import Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getEnv } from "@ostentaculus/security/env";
import { embed } from "./embeddings";

const client = new Anthropic();
const SYSTEM = `You are an Ostentaculus tourism data analyst. Answer the question about WHEN and WHERE to capture tourists, using ONLY the provided data excerpts. Cite the source + region for every claim (e.g. "INE · ES-CT"). If the excerpts don't support an answer, say so plainly. Be concrete and actionable for a café/hotel owner. Reply in the user's language.`;

export interface SeriesCardInput { source: string; region: string; content: string }

/** Embed series cards and upsert into pgvector store. */
export async function indexTourismDocuments(
  db: PostgresJsDatabase, cards: SeriesCardInput[],
): Promise<number> {
  if (cards.length === 0) return 0;
  const vectors = await embed(cards.map((c) => c.content));
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]!;
    const lit = `[${vectors[i]!.join(",")}]`;
    await db.execute(sql`
      INSERT INTO tourism_documents (source, region, content, embedding)
      VALUES (${c.source}, ${c.region}, ${c.content}, ${lit}::vector)
      ON CONFLICT (source, region, content)
      DO UPDATE SET embedding = EXCLUDED.embedding, created_at = now();
    `);
  }
  return cards.length;
}

/** Embed the question, retrieve top-k cards via pgvector, synthesize with Claude. */
export async function answerTourismQuestion(
  db: PostgresJsDatabase, question: string, k = 6,
): Promise<{ answer: string; sources: { source: string; region: string }[] }> {
  const [qVec] = await embed([question]);
  const lit = `[${qVec!.join(",")}]`;
  const hits = await db.execute<{ source: string; region: string; content: string }>(sql`
    SELECT source, region, content
    FROM tourism_documents
    ORDER BY embedding <=> ${lit}::vector
    LIMIT ${k};
  `);
  const context = hits.map((h, i) => `[${i + 1}] (${h.source} · ${h.region}) ${h.content}`).join("\n");

  const res = await client.messages.create({
    model: getEnv().CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 900,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: SYSTEM,
    messages: [{ role: "user", content: `Data excerpts:\n${context}\n\nQuestion: ${question}` }],
  });
  const answer = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
  return { answer, sources: hits.map((h) => ({ source: h.source, region: h.region })) };
}
