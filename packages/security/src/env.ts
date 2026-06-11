import { z } from "zod";

/**
 * Single source of truth for runtime configuration. Fail fast at boot:
 * a missing secret must crash the process, never reach a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  WHATSAPP_VERIFY_TOKEN: z.string().min(16),
  WHATSAPP_APP_SECRET: z.string().min(16),
  WHATSAPP_ACCESS_TOKEN: z.string().min(20),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(5),
  WHATSAPP_GRAPH_VERSION: z.string().default("v21.0"),

  N8N_INBOUND_WEBHOOK_URL: z.string().url(),
  N8N_SHARED_SECRET: z.string().min(32),

  CONCIERGE_SERVICE_TOKEN: z.string().min(32),

  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  CLAUDE_MODEL: z.string().default("claude-opus-4-8"),

  GOOGLE_MAPS_API_KEY: z.string().min(20).optional(),

  // FASE 2 — Data Science Turismo
  VOYAGE_API_KEY: z.string().min(10).optional(),       // embeddings (RAG)
  VOYAGE_MODEL: z.string().default("voyage-3"),
  GA4_PROPERTY_ID: z.string().optional(),               // GA4 connector

  // FASE 6 — YouTube Data API v3 (audience intelligence + metadata)
  YOUTUBE_API_KEY: z.string().min(20).optional(),

  // FASE 5 — Stripe (Billing + Connect). Optional so boot works without billing.
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_GROWTH: z.string().optional(),
  STRIPE_PRICE_SCALE: z.string().optional(),
  ROUTE_COMMISSION_PCT: z.coerce.number().min(0).max(100).default(15),

  // FASE 3 — lead pseudonymization salt (keep stable; rotating re-keys analytics)
  LEAD_PSEUDONYM_SALT: z.string().min(16),

  FIELD_ENCRYPTION_KEY: z.string().min(44),

  DATABASE_URL: z.string().url(),

  // Supabase Auth (MFA flows + server-side admin). Optional so non-auth
  // surfaces boot without them; the auth router requires them at runtime.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }
  cached = parsed.data;
  return cached;
}
