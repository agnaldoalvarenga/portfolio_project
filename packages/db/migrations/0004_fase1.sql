-- Idempotent POS ingestion key.
ALTER TABLE pos_metrics
  ADD CONSTRAINT pos_metrics_est_period_uniq UNIQUE (establishment_id, period_start);

-- AI weekly reports (storytelling com dados).
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end   timestamptz NOT NULL,
  narrative    text NOT NULL,
  kpis_snapshot jsonb NOT NULL,
  model        text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY weekly_reports_read ON weekly_reports FOR SELECT
USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = weekly_reports.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(weekly_reports.establishment_id)
);
CREATE INDEX IF NOT EXISTS weekly_reports_est_idx ON weekly_reports (establishment_id);
