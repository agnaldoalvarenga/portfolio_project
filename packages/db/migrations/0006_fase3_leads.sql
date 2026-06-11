-- Lead attribution (turista -> recomendação -> lead) with PII at rest.
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  source text NOT NULL,
  contact_enc text,                 -- AES-256-GCM encrypted tourist contact (PII)
  contact_hash text NOT NULL,       -- pseudonym for dedupe/analytics
  region text,
  recommendation_text text,
  status text NOT NULL DEFAULT 'new',
  recommendations_count integer NOT NULL DEFAULT 1,
  last_recommended_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_est_contact_uniq UNIQUE (establishment_id, contact_hash)
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_read ON leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = leads.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(leads.establishment_id)
);
CREATE INDEX IF NOT EXISTS leads_est_idx ON leads (establishment_id);

CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  value numeric(12,2),
  converted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversions_read ON conversions FOR SELECT USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = conversions.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(conversions.establishment_id)
);
CREATE INDEX IF NOT EXISTS conversions_est_idx ON conversions (establishment_id);
