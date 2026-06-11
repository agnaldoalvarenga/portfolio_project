import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { encryptField } from "@ostentaculus/security/crypto";
import { pseudonymize } from "../concierge/pii";

export interface RecordLeadInput {
  establishmentId: string;
  contact: string; // tourist WhatsApp id / phone (PII)
  salt: string; // LEAD_PSEUDONYM_SALT
  region?: string | null;
  recommendationText?: string | null;
}

/**
 * Attribute a concierge recommendation to an establishment as a lead.
 * Idempotent on (establishment_id, contact_hash); re-recommendation bumps the
 * counter instead of duplicating. Returns { id, isNew }.
 */
export async function recordConciergeLead(
  db: PostgresJsDatabase,
  input: RecordLeadInput,
): Promise<{ id: string; isNew: boolean }> {
  const contactEnc = encryptField(input.contact);
  const contactHash = pseudonymize(input.contact, input.salt);
  const rows = await db.execute<{ id: string; is_new: boolean }>(sql`
    INSERT INTO leads (establishment_id, source, contact_enc, contact_hash, region, recommendation_text)
    VALUES (${input.establishmentId}, 'whatsapp_concierge', ${contactEnc}, ${contactHash},
            ${input.region ?? null}, ${input.recommendationText ?? null})
    ON CONFLICT (establishment_id, contact_hash) DO UPDATE
      SET recommendations_count = leads.recommendations_count + 1,
          last_recommended_at = now(), updated_at = now()
    RETURNING id, (xmax = 0) AS is_new;
  `);
  return { id: rows[0]!.id, isNew: rows[0]!.is_new };
}
