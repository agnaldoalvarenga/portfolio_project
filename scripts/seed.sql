-- Deterministic seed for local verification. Idempotent (fixed ids/timestamps).
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-0000000000aa', 'Ostentaculus')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, locale) VALUES
  ('11111111-1111-1111-1111-111111111111', 'establishment_owner', 'es'),
  ('22222222-2222-2222-2222-222222222222', 'establishment_owner', 'pt'),
  ('99999999-9999-9999-9999-999999999999', 'admin', 'es')
ON CONFLICT (id) DO NOTHING;
INSERT INTO org_members (org_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000aa', '99999999-9999-9999-9999-999999999999', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO establishments (id, org_id, name, category, city, country, latitude, longitude, curation_status, status, pos_connected) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000aa', 'Cafe Niu', 'cafe', 'Barcelona', 'ES', 41.390, 2.160, 'curated', 'active', 'true'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000aa', 'Pasteis Belem', 'bakery', 'Lisboa', 'PT', 38.690, -9.200, 'curated', 'active', 'true')
ON CONFLICT (id) DO NOTHING;

INSERT INTO establishment_members (establishment_id, user_id) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-0000000000b2', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO documentaries (id, establishment_id, status, youtube_video_id) VALUES
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'published', 'dQw4w9WgXcQ'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'published', 'oHg5SJYRHA0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pos_metrics (establishment_id, period_start, avg_ticket, peak_hours, hero_product) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '2026-06-08 00:00:00+00', 12.50, '["09:00","13:00"]', 'Croissant'),
  ('00000000-0000-0000-0000-0000000000b1', '2026-06-09 00:00:00+00', 13.10, '["09:00","18:00"]', 'Cortado'),
  ('00000000-0000-0000-0000-0000000000b2', '2026-06-09 00:00:00+00', 8.00, '["17:00"]', 'Pastel de nata')
ON CONFLICT (establishment_id, period_start) DO NOTHING;

INSERT INTO routes (id, name, description, region, status)
VALUES ('00000000-0000-0000-0000-00000000c1c1', 'Ruta del cafe de Barcelona', 'Cafes curados del Eixample', 'ES-CT', 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO route_stops (route_id, establishment_id, position) VALUES
  ('00000000-0000-0000-0000-00000000c1c1', '00000000-0000-0000-0000-0000000000b1', 1)
ON CONFLICT DO NOTHING;

INSERT INTO tourism_data (source, region, period, metric, value, unit) VALUES
  ('FRONTUR', 'ES-CT', '2026-05', 'arrivals', 1850000, 'count'),
  ('FRONTUR', 'ES-CT', '2026-04', 'arrivals', 1620000, 'count'),
  ('GA4', 'GA4', '2026-05-10', 'sessions', 1240, 'count')
ON CONFLICT (source, region, period, metric) DO NOTHING;
