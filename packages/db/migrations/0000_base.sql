-- Base schema (FASE 0 / Módulo 2 / FASE 1 core tables). Source of truth for
-- table shapes is packages/db/src/schema.ts; this file lets you stand up the DB
-- with plain psql (0000..0009 in order) without drizzle-kit.

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('tourist','resident','staff','establishment_owner','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE curation_status AS ENUM ('pending','in_review','curated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE establishment_status AS ENUM ('active','paused','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE documentary_status AS ENUM ('research','shoot','edit','published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text,
  role user_role NOT NULL DEFAULT 'tourist',
  locale text NOT NULL DEFAULT 'es',
  mfa_enabled text NOT NULL DEFAULT 'false',
  phone_enc text,
  phone_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  category text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  curation_status curation_status NOT NULL DEFAULT 'pending',
  status establishment_status NOT NULL DEFAULT 'active',
  pos_connected text NOT NULL DEFAULT 'false',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS establishments_org_idx ON establishments (org_id);

CREATE TABLE IF NOT EXISTS establishment_members (
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (establishment_id, user_id)
);

CREATE TABLE IF NOT EXISTS documentaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  status documentary_status NOT NULL DEFAULT 'research',
  mux_asset_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documentaries_est_idx ON documentaries (establishment_id);

CREATE TABLE IF NOT EXISTS pos_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  avg_ticket numeric(12,2) NOT NULL,
  peak_hours jsonb NOT NULL,
  hero_product text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pos_metrics_est_idx ON pos_metrics (establishment_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  subject text,
  metadata jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  legal_basis text NOT NULL,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
