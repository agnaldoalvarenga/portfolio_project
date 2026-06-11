import { getEnv } from "@ostentaculus/security/env";

interface VoyageResponse { data: { embedding: number[] }[] }

/**
 * Embeddings via Voyage AI (Anthropic's recommended embeddings partner —
 * there is no first-party Anthropic embeddings endpoint). Default voyage-3 (1024-d).
 */
export async function embed(texts: string[]): Promise<number[][]> {
  const env = getEnv();
  if (!env.VOYAGE_API_KEY) throw new Error("VOYAGE_API_KEY not set");
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.VOYAGE_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`Voyage embeddings failed: ${res.status}`);
  const body = (await res.json()) as VoyageResponse;
  return body.data.map((d) => d.embedding);
}
