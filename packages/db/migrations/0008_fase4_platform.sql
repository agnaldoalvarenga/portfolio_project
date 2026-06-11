-- B2B curated tourist routes.
DO $$ BEGIN
  CREATE TYPE route_status AS ENUM ('draft', 'curated', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  region text,
  status route_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS route_stops (
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (route_id, position)
);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY routes_staff_read ON routes FOR SELECT USING (is_staff());
CREATE POLICY route_stops_staff_read ON route_stops FOR SELECT USING (is_staff());

-- PUBLIC READ PROJECTIONS: the security boundary for the unauthenticated app.
-- Only safe columns, only curated/active rows. PII/POS are NOT in these views.
CREATE OR REPLACE VIEW public_establishments AS
SELECT e.id, e.name, e.category, e.city, e.country, e.latitude, e.longitude,
       d.youtube_video_id
FROM establishments e
LEFT JOIN documentaries d ON d.establishment_id = e.id AND d.status = 'published'
WHERE e.curation_status = 'curated' AND e.status = 'active';

CREATE OR REPLACE VIEW public_routes AS
SELECT r.id, r.name, r.description, r.region,
       json_agg(json_build_object('establishmentId', s.establishment_id, 'position', s.position)
                ORDER BY s.position) AS stops
FROM routes r
JOIN route_stops s ON s.route_id = r.id
WHERE r.status = 'published'
GROUP BY r.id;
