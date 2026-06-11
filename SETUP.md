# Ostentaculus — Setup & Verification Runbook

One document to stand up the platform from a clean machine and verify every phase.
Run the steps top-to-bottom. Paths are relative to the repo root.

---

## 0. Prerequisites

- Node 22+, pnpm 9+
- A Postgres 16 with the `pgvector` extension available (Supabase project, or local
  `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16`)
- Accounts/keys as needed per phase: Anthropic, Voyage (RAG), WhatsApp Business Cloud,
  Google Maps, GA4 service account, YouTube Data API, Stripe.

```bash
tar -xzf ostentaculus-platform.tar.gz && cd ostentaculus-platform
pnpm install
```

---

## 1. Environment

```bash
cp .env.example .env
# Generate the two local secrets:
node -e "console.log('FIELD_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('LEAD_PSEUDONYM_SALT=' + require('crypto').randomBytes(24).toString('base64'))"
# Paste both into .env, then fill the provider keys you need.
```

`getEnv()` validates everything at boot — a missing/short secret crashes immediately
(by design). Optional keys (Voyage, Maps, GA4, YouTube, Stripe) can stay empty until
you use that phase.

---

## 2. Migrations — RUN IN ORDER

**Fast path (local Docker):** one command brings up Postgres+pgvector, applies
`0000..0009` (with the local `auth.uid()` shim), and seeds:

```bash
make bootstrap   # docker compose up -> wait healthy -> migrate -> seed
make test        # run the suite
```

**Manual / Supabase path** (Supabase already provides `auth.uid()`, so omit the
shim — do NOT set `LOCAL_AUTH_SHIM`):

```bash
export DATABASE_URL="postgres://...:5432/ostentaculus"
bash scripts/migrate.sh           # applies 0000_base then 0001..0009 in order
# or by hand:
psql "$DATABASE_URL" -f packages/db/migrations/0000_base.sql
for f in 0001 0002 0003 0004 0005 0006 0007 0008 0009; do
  psql "$DATABASE_URL" -f packages/db/migrations/${f}_*.sql
done
```

> `schema.ts` (Drizzle) is the source of truth for table types and `drizzle-kit`
> in dev. `0000_base.sql` mirrors those base tables so you can stand up the DB
> with plain `psql` (no drizzle-kit needed). RLS, views, triggers, extensions
> and constraints live in `0001..0009`.

| File | Phase | Adds |
|---|---|---|
| 0000 | base | core tables (orgs, users, establishments, documentaries, pos_metrics, audit_log, consents) + enums |
| 0001 | FASE 0 | RLS policies, `is_org_staff()`, audit append-only trigger |
| 0002 | M2 | `whatsapp_events` (idempotency), discovery index |
| 0003 | M2 | `documentaries.youtube_video_id` |
| 0004 | FASE 1 | POS unique key, `weekly_reports` + RLS |
| 0005 | FASE 2 | `vector` ext, `tourism_data`/`tourism_documents` + RLS + ivfflat, `is_staff()` |
| 0006 | FASE 3 | `leads` + `conversions` + RLS |
| 0007 | FASE 6 | `content_briefs` + RLS |
| 0008 | FASE 4 | `routes`/`route_stops`, `public_establishments`/`public_routes` views |
| 0009 | FASE 5 | `subscriptions`/`connect_accounts`/`commissions`/`stripe_events` + RLS |

---

## 3. Minimal seed (for verification)

```sql
-- one org, one curated establishment with a published documentary
INSERT INTO organizations (id,name) VALUES ('00000000-0000-0000-0000-0000000000aa','Ostentaculus');
INSERT INTO establishments (id,org_id,name,category,city,country,latitude,longitude,curation_status,status,pos_connected)
VALUES ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000aa',
        'Café Niu','cafe','Barcelona','ES',41.39,2.16,'curated','active','true');
INSERT INTO documentaries (establishment_id,status,youtube_video_id)
VALUES ('00000000-0000-0000-0000-0000000000b1','published','dQw4w9WgXcQ');
```

---

## 4. Test suite

```bash
pnpm test          # all packages
```

Pure tests run anywhere (crypto, HMAC, SSRF, documentary state machine, guardrails,
SEO helpers, public whitelist, rate-limit, commission math). DB-dependent e2e
(`rls.test.ts`, ingest, lead attribution) need `DATABASE_URL` pointed at a test DB
with migrations applied.

---

## 5. Per-phase verification

| Phase | Check |
|---|---|
| **0** | `pnpm --filter @ostentaculus/db test` → RLS isolation green (Barcelona ⊥ Lisboa); `audit_log` immutable |
| **M2** | Point Meta webhook at `…/api/webhooks/whatsapp`; send a location → reply with name + YouTube + route; resend → deduped |
| **1** | `establishment.create` → `documentary.advanceStatus` (research→shoot→edit→published); ingest POS (MockPosAdapter) → `dashboard.kpis`; `runWeeklyReports(db)` |
| **2** | `runTourismIngestion(db, connectors, since)` → `tourism.series`; `tourism.insights({question})` cites source·region |
| **3** | concierge.recommend with `contact` → row in `leads` attributed to establishment; resend → `recommendations_count++` |
| **6** | `runWeeklyContentPlan(db)` → briefs; `marketing.script/distribution` produce HSO brief + SEO metadata |
| **4** | `GET /api/public/feed` (only curated, safe fields); `…/discover?lat&lng`; Expo app `expo start`; flood → 429 |
| **5** | Stripe webhook at `…/api/webhooks/stripe` (verify sig); `billing.createCheckout(tier)`; Connect onboarding; resend event → deduped |

---

## 6. Deploy notes

- **Web/API:** Vercel (`apps/web`). Set env in Vercel project.
- **Workers (ETL, weekly jobs, n8n):** Fly.io / Hetzner EU (RGPD residency).
- **DB/Auth/Realtime/Storage:** Supabase EU.
- **Edge:** Cloudflare (WAF, rate-limit, CDN) in front of the public API.
- **Mobile:** `eas build --profile preview` → TestFlight / Play internal.
- **CI:** `.github/workflows/security.yml` — set `secret-scan`, `sast`, `deps`, `sbom`
  as required status checks on `main`.
- **Secrets:** Doppler/Vault; never commit `.env`.
