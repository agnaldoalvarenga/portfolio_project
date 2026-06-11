import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";
import type { EstablishmentKpis } from "@ostentaculus/core/dashboard/kpis";

const client = new Anthropic();

const SYSTEM = `You are an Ostentaculus data-storyteller writing a weekly performance note for an establishment owner. Use ONLY the metrics provided — never invent numbers, comparisons, or causes you cannot derive from the data. Warm, expert, concise (120-200 words). Structure: (1) a one-line headline, (2) what moved this week and why it might matter, (3) one concrete, low-effort suggestion. Reply in the owner's locale.`;

export async function generateWeeklyReport(input: {
  establishmentName: string;
  kpis: EstablishmentKpis;
  locale?: string;
}): Promise<string> {
  const env = getEnv();
  const res = await client.messages.create({
    model: env.CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 700,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [{
      role: "user",
      content:
        `Establishment: ${input.establishmentName}\nLocale: ${input.locale ?? "es"}\n` +
        `Metrics (JSON): ${JSON.stringify(input.kpis)}\n\nWrite the weekly note now.`,
    }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
