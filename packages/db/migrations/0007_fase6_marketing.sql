-- AI marketing department: editorial briefs (Chief of Staff + 3 YouTube agents).
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('planned', 'scripted', 'recorded', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id) ON DELETE SET NULL,
  topic text NOT NULL,
  region text,
  angle text,
  audience_signals jsonb,
  brief jsonb,
  distribution jsonb,
  status content_status NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_briefs_staff_read ON content_briefs FOR SELECT USING (is_staff());
CREATE INDEX IF NOT EXISTS content_briefs_est_idx ON content_briefs (establishment_id);
