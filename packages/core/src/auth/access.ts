import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * Defense-in-depth tenant check for the server-role (RLS-bypassing) connection.
 * Throws "FORBIDDEN" if the user is neither a member of the establishment nor
 * org staff/admin.
 */
export async function assertEstablishmentAccess(
  db: PostgresJsDatabase,
  userId: string,
  role: string,
  establishmentId: string,
): Promise<void> {
  if (role === "admin") return;
  const rows = await db.execute(sql`
    SELECT 1 FROM establishment_members em
      WHERE em.establishment_id = ${establishmentId} AND em.user_id = ${userId}
    UNION
    SELECT 1 FROM establishments e JOIN org_members om ON om.org_id = e.org_id
      WHERE e.id = ${establishmentId} AND om.user_id = ${userId} AND om.role IN ('staff','admin')
    LIMIT 1;
  `);
  if (rows.length === 0) throw new Error("FORBIDDEN");
}
