import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";

const client = new Anthropic();

const SYSTEM = `You are the Ostentaculus YouTube storytelling agent. Apply the Hook-Story-Offer framework for retention-optimized YouTube videos about REAL food & hospitality protagonists (founders, bakers, hoteliers).
- HOOK: a gripping first-30-seconds opening that creates an open loop.
- STORY: the human, documentary arc — struggle, craft, sense of place.
- OFFER: a soft, value-first call (guide / route / coupon), never a hard sell.
Be specific and cinematic. NEVER use generic AI-slop phrasing, clichés, or templated structure. Reply in the requested locale.`;

const SCHEMA = {
  type: "object",
  properties: {
    titles: { type: "array", items: { type: "string" } },
    thumbnailConcepts: { type: "array", items: { type: "string" } },
    hook: { type: "string" },
    script: { type: "string" },
  },
  required: ["titles", "thumbnailConcepts", "hook", "script"],
  additionalProperties: false,
};

export interface VideoBrief {
  titles: string[];
  thumbnailConcepts: string[];
  hook: string;
  script: string;
}

export async function generateVideoBrief(input: {
  topic: string;
  audienceSignals?: string;
  establishmentName?: string;
  locale?: string;
}): Promise<VideoBrief> {
  const res = await client.messages.create({
    model: getEnv().CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 2200,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: "user",
      content:
        `Topic: ${input.topic}\nEstablishment: ${input.establishmentName ?? "(brand-level)"}\n` +
        `Locale: ${input.locale ?? "es"}\nAudience signals: ${input.audienceSignals ?? "(none)"}\n\n` +
        `Produce 5 magnetic titles, 3 thumbnail concepts, a 30s hook, and a full retention-optimized script.`,
    }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text) as VideoBrief;
}
