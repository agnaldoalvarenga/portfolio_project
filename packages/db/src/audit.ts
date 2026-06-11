import { sql } from "drizzle-orm";
import { db } from "./client";

export interface AuditEvent {
  action: string;
  actorId?: string | null;
  subject?: string | null;
  metadata?: unknown;
  ip?: string | null;
}

/** Append-only audit write. UPDATE/DELETE are blocked by a DB trigger. */
export async function writeAuditLog(e: AuditEvent): Promise<void> {
  await db.execute(sql`
    INSERT INTO audit_log (actor_id, action, subject, metadata, ip)
    VALUES (${e.actorId ?? null}, ${e.action}, ${e.subject ?? null},
            ${JSON.stringify(e.metadata ?? null)}::jsonb, ${e.ip ?? null});
  `);
}
