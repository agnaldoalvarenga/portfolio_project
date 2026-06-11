import { getEnv } from "@ostentaculus/security/env";

/** Send a plain text WhatsApp message via the Graph API. */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const env = getEnv();
  const url = `https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: true, body },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`WhatsApp send failed: ${res.status} ${detail.slice(0, 200)}`);
  }
}
