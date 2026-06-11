# Ostentaculus Platform

Monorepo (Turborepo + pnpm) — Food & Tourism Marketing Agency Cinema.

## What's included in this scaffold
- **Módulo 2 — Cérebro de IA (concierge WhatsApp + Claude + n8n)**: secure webhook ingress,
  geofencing, Claude composition (`claude-opus-4-8`, adaptive thinking), Google Maps route,
  YouTube documentary link, n8n orchestration workflow.
- **FASE 0 — Fundação & Segurança**: multi-tenant Drizzle schema + **RLS deny-by-default**
  (proven by a 2-tenant isolation test), append-only audit log, **Auth/MFA TOTP (AAL2)**,
  **AES-256-GCM field encryption**, and a **blocking CI security pipeline** (gitleaks,
  Semgrep OWASP, pnpm audit + OSV, SBOM).

## Layout
    apps/web                 Next.js 15 (Canal + dashboards + webhook handler)
    packages/security        env (Zod), AES-256-GCM crypto
    packages/db              Drizzle schema, RLS migrations, audit, RLS test
    packages/core            whatsapp, concierge (geofencing/pii/recommend), maps
    packages/ai              Claude concierge composition
    packages/api             tRPC routers + auth/MFA middlewares
    infra/n8n                exported n8n workflow

## Quickstart
    cp .env.example .env   # fill secrets; generate FIELD_ENCRYPTION_KEY
    pnpm install
    pnpm --filter @ostentaculus/db db:migrate
    psql "$DATABASE_URL" -f packages/db/migrations/0001_rls_policies.sql
    pnpm test              # runs RLS isolation, signature, crypto, concierge tests

## Security DoD (FASE 0)
- RLS on every tenant table, deny-by-default; horizontal isolation test green.
- MFA TOTP (AAL2) enforced for staff/admin/establishment_owner.
- Field-level AES-256-GCM for PII + sensitive POS at rest; TLS 1.3 in transit.
- audit_log immutable (append-only trigger).
- CI scans block the merge (set them as required status checks on main).
