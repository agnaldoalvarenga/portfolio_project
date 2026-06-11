import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";

const client = new Anthropic();

const SYSTEM = `You are the Ostentaculus AI Chief of Staff — the operator that removes the founder's decision fatigue. Plan a weekly YouTube editorial calendar for a Food & Tourism cinema brand (Spain/Portugal/Brazil/LATAM). Decide WHAT to film and WHEN, grounded in the provided tourism demand signals. Each brief must have a clear documentary angle (real protagonists, not institutional video) and avoid repeating recent topics. Reply in the requested locale.`;

const SCHEMA = {
  type: "object",
  properties: {
    briefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          region: { type: "string" },
          angle: { type: "string" },
          targetPublishWeek: { type: "string" },
          rationale: { type: "string" },
        },
        required: ["topic", "region", "angle", "targetPublishWeek", "rationale"],
        additionalProperties: false,
      },
    },
  },
  required: ["briefs"],
  additionalProperties: false,
};

export interface EditorialBrief {
  topic: string;
  region: string;
  angle: string;
  targetPublishWeek: string;
  rationale: string;
}

export async function planEditorialCalendar(input: {
  brand: string;
  tourismInsights?: string;
  recentTopics?: string[];
  count?: number;
  locale?: string;
}): Promise<EditorialBrief[]> {
  const res = await client.messages.create({
    model: getEnv().CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 1800,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: "user",
      content:
        `Brand: ${input.brand}\nLocale: ${input.locale ?? "es"}\n` +
        `Plan ${input.count ?? 4} briefs for the coming weeks.\n` +
        `Tourism demand signals: ${input.tourismInsights ?? "(none provided)"}\n` +
        `Recent topics to avoid repeating: ${(input.recentTopics ?? []).join("; ") || "(none)"}`,
    }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  return (JSON.parse(text) as { briefs: EditorialBrief[] }).briefs;
}
