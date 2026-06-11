import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

/**
 * Proves horizontal isolation: a Barcelona owner can NEVER read a Lisbon
 * owner's POS data. Requires a Postgres with schema + RLS applied and an
 * `auth.uid()` shim that reads request.jwt.claims->>'sub'.
 */
const admin = postgres(process.env.DATABASE_URL!, { max: 1 });

const BCN_OWNER = "11111111-1111-1111-1111-111111111111";
const LIS_OWNER = "22222222-2222-2222-2222-222222222222";
let bcnEst: string, lisEst: string;

beforeAll(async () => {
  const org = (await admin`INSERT INTO organizations (name) VALUES ('Ostentaculus') RETURNING id`)[0].id;
  await admin`INSERT INTO users (id, role) VALUES (${BCN_OWNER}, 'establishment_owner'), (${LIS_OWNER}, 'establishment_owner')`;
  bcnEst = (await admin`INSERT INTO establishments (org_id,name,category,city,country,latitude,longitude,curation_status,status)
    VALUES (${org},'Café Niu','cafe','Barcelona','ES',41.39,2.16,'curated','active') RETURNING id`)[0].id;
  lisEst = (await admin`INSERT INTO establishments (org_id,name,category,city,country,latitude,longitude,curation_status,status)
    VALUES (${org},'Pastéis Belém','bakery','Lisboa','PT',38.69,-9.20,'curated','active') RETURNING id`)[0].id;
  await admin`INSERT INTO establishment_members (establishment_id,user_id) VALUES (${bcnEst},${BCN_OWNER}),(${lisEst},${LIS_OWNER})`;
  await admin`INSERT INTO pos_metrics (establishment_id,period_start,avg_ticket,peak_hours) VALUES
    (${bcnEst}, now(), 12.50, '["09:00"]'), (${lisEst}, now(), 8.00, '["17:00"]')`;
});

afterAll(async () => { await admin.end(); });

async function asUser<T>(userId: string, run: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await sql`SELECT set_config('role','authenticated',true)`;
    await sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
    return await run(sql);
  } finally { await sql.end(); }
}

describe("RLS — horizontal tenant isolation", () => {
  it("Barcelona owner sees ONLY Barcelona POS data", async () => {
    const rows = await asUser(BCN_OWNER, (sql) => sql`SELECT establishment_id FROM pos_metrics`);
    expect(rows).toHaveLength(1);
    expect(rows[0].establishment_id).toBe(bcnEst);
  });
  it("Barcelona owner CANNOT read Lisbon POS data even by explicit id", async () => {
    const rows = await asUser(BCN_OWNER, (sql) =>
      sql`SELECT * FROM pos_metrics WHERE establishment_id = ${lisEst}`);
    expect(rows).toHaveLength(0);
  });
  it("audit_log is immutable", async () => {
    const id = (await admin`INSERT INTO audit_log (action) VALUES ('test') RETURNING id`)[0].id;
    await expect(admin`UPDATE audit_log SET action='x' WHERE id=${id}`).rejects.toThrow(/append-only/);
    await expect(admin`DELETE FROM audit_log WHERE id=${id}`).rejects.toThrow(/append-only/);
  });
});
