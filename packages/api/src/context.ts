import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "tourist" | "resident" | "staff" | "establishment_owner" | "admin";

export interface AppUser {
  id: string;
  role: UserRole;
}

export interface Claims {
  sub?: string;
  aal?: "aal1" | "aal2";
  [k: string]: unknown;
}

export interface AppLogger {
  error: (obj: unknown, msg?: string) => void;
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
}

export interface Context {
  db: PostgresJsDatabase;
  supabase: SupabaseClient;
  user: AppUser | null;
  claims: Claims;
  serviceToken: string | null;
  logger: AppLogger;
}
