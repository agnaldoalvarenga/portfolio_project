import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";
import { formatChapters, sanitizeTags, buildPinnedComment } from "@ostentaculus/core/youtube/seo";

const client = new Anthropic();

const SYSTEM = `You are the Ostentaculus distribution/SEO agent. Given a video title and script, produce a YouTube-optimized description, chapter timestamps, tags, and a pinned-comment call-to-action. Front-load keywords naturally; never keyword-stuff. Reply in the requested locale.`;

const SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: { seconds: { type: "integer" }, label: { type: "string" } },
        required: ["seconds", "label"],
        additionalProperties: false,
      },
    },
    tags: { type: "array", items: { type: "string" } },
    cta: { type: "string" },
  },
  required: ["description", "chapters", "tags", "cta"],
  additionalProperties: false,
};

export interface Distribution {
  description: string;
  chaptersText: string;
  tags: string[];
  pinnedComment: string;
}

export async function generateDistribution(input: {
  title: string; script: string; conversionUrl: string; locale?: string;
}): Promise<Distribution> {
  const res = await client.messages.create({
    model: getEnv().CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Locale: ${input.locale ?? "es"}\nTitle: ${input.title}\n\nScript:\n${input.script}`,
    }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  const raw = JSON.parse(text) as {
    description: string; chapters: { seconds: number; label: string }[]; tags: string[]; cta: string;
  };
  // Apply deterministic, tested post-processing (never trust raw LLM formatting).
  return {
    description: raw.description,
    chaptersText: formatChapters(raw.chapters),
    tags: sanitizeTags(raw.tags),
    pinnedComment: buildPinnedComment(raw.cta, input.conversionUrl),
  };
}
