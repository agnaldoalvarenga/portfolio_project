import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@ostentaculus/security/env";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM = `You are the Ostentaculus concierge — a warm, discerning luxury host for travelers in Spain, Portugal, Brazil and LATAM. You recommend ONE curated establishment that Ostentaculus has filmed and validated.

Rules:
- Reply in the user's language; default to the language of their message, else Spanish.
- 2-4 sentences. Evocative but never salesy or exaggerated. At most one emoji.
- Mention the establishment by name and ONE concrete, sensory reason to visit.
- Do NOT invent facts, prices, ratings, opening hours, or distances. Use only what is provided.
- Never include links yourself — the caller appends the documentary and route links.
- If asked for anything outside hospitality recommendations, gently decline.`;

export interface ConciergeEstablishment {
  name: string;
  category: string;
  city: string;
  distanceMeters: number;
}

export interface ConciergeInput {
  userText: string | null; // already PII-redacted
  establishment: ConciergeEstablishment;
  locale?: string;
}

export interface ConciergeResult {
  message: string;
  refused: boolean;
}

/** Compose the concierge message around verified, code-chosen establishment data. */
export async function composeConciergeMessage(input: ConciergeInput): Promise<ConciergeResult> {
  const env = getEnv();
  const distance = Math.round(input.establishment.distanceMeters);

  const response = await client.messages.create({
    model: env.CLAUDE_MODEL, // claude-opus-4-8
    max_tokens: 512,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `Traveler message: ${input.userText ?? "(shared their location)"}\n` +
          `Preferred locale: ${input.locale ?? "auto"}\n` +
          `Curated establishment (verified facts only):\n` +
          `- Name: ${input.establishment.name}\n` +
          `- Type: ${input.establishment.category}\n` +
          `- City: ${input.establishment.city}\n` +
          `- Walking distance: ~${distance} m\n\n` +
          `Write the concierge recommendation now.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return { message: "", refused: true };

  const message = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return { message, refused: message.length === 0 };
}
