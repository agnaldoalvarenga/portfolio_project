-- Idempotency / replay protection for Meta webhook retries.
CREATE TABLE IF NOT EXISTS whatsapp_events (
  wamid        text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE whatsapp_events ENABLE ROW LEVEL SECURITY; -- no policies => service_role only

-- Discovery read path: filter then sort.
CREATE INDEX IF NOT EXISTS establishments_discovery_idx
  ON establishments (curation_status, status)
  WHERE curation_status = 'curated' AND status = 'active';
