import { NextResponse } from "next/server";
import { getEnv } from "@ostentaculus/security/env";
import { verifyMetaSignature, signPayload } from "@ostentaculus/core/whatsapp/signature";
import { metaWebhookBody } from "@ostentaculus/core/whatsapp/schema";
import { markWhatsAppEventProcessed } from "@ostentaculus/db/whatsapp-events";
import { writeAuditLog } from "@ostentaculus/db/audit";

export const runtime = "nodejs"; // need raw body + node:crypto

/** GET: Meta's webhook verification challenge. */
export async function GET(req: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** POST: verify -> validate -> dedupe -> audit -> forward to n8n. */
export async function POST(req: Request): Promise<Response> {
  const env = getEnv();
  const raw = await req.text(); // RAW body required for HMAC

  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.WHATSAPP_APP_SECRET)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const parsed = metaWebhookBody.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      for (const message of change.value.messages ?? []) {
        const fresh = await markWhatsAppEventProcessed(message.id);
        if (!fresh) continue; // idempotency / replay protection

        await writeAuditLog({
          action: "whatsapp.inbound",
          subject: message.id,
          metadata: { type: message.type, phoneNumberId: change.value.metadata.phone_number_id },
          ip: req.headers.get("cf-connecting-ip"),
        });

        const body = JSON.stringify({ message });
        await fetch(env.N8N_INBOUND_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ostentaculus-signature": signPayload(body, env.N8N_SHARED_SECRET),
          },
          body,
        }).catch(() => { /* never block the 200 to Meta on n8n hiccups */ });
      }
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
