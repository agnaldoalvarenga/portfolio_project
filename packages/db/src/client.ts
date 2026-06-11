import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@ostentaculus/security/env";

const url = getEnv().DATABASE_URL;

// Supabase transaction pooler (port 6543, pgbouncer) does not support prepared
// statements — postgres-js must disable them there. Detect by port.
const usingPooler = url.includes(":6543");

const queryClient = postgres(url, {
  max: usingPooler ? 1 : 10,
  prepare: !usingPooler,
});

export const db = drizzle(queryClient);
