import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";
import { searchVideos, fetchTopComments } from "@ostentaculus/core/youtube/client";

const client = new Anthropic();

const SYSTEM = `You are the Ostentaculus audience-intelligence agent. From competitor YouTube titles and viewer comments in the food & tourism niche, extract what the audience already wants. Output trending search terms, the angles competitors use, and recurring themes/desires/objections from comments. Be concrete; do not invent data not present in the input.`;

const SCHEMA = {
  type: "object",
  properties: {
    trendingTerms: { type: "array", items: { type: "string" } },
    competitorAngles: { type: "array", items: { type: "string" } },
    commentThemes: { type: "array", items: { type: "string" } },
  },
  required: ["trendingTerms", "competitorAngles", "commentThemes"],
  additionalProperties: false,
};

export interface AudienceSignals {
  trendingTerms: string[];
  competitorAngles: string[];
  commentThemes: string[];
}

/** Pull competitor titles + top comments for a niche, then synthesize signals. */
export async function analyzeAudience(niche: string): Promise<AudienceSignals> {
  const hits = await searchVideos(niche, 10);
  const comments: string[] = [];
  for (const h of hits.slice(0, 3)) {
    if (h.videoId) comments.push(...(await fetchTopComments(h.videoId, 10)));
  }
  const corpus =
    `Competitor titles:\n${hits.map((h) => `- ${h.title} (${h.channelTitle})`).join("\n")}\n\n` +
    `Viewer comments:\n${comments.map((c) => `- ${c}`).join("\n")}`;

  const res = await client.messages.create({
    model: getEnv().CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 1200,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: `Niche: ${niche}\n\n${corpus}` }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text) as AudienceSignals;
}
