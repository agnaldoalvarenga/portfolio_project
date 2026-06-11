-- Deny-by-default on every tenant-scoped table.
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishment_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_metrics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents               ENABLE ROW LEVEL SECURITY;

-- General staff/admin helper (used by tourism/marketing RLS). Lives here, in the
-- base RLS migration, so it does not depend on the pgvector phase (0005).
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff','admin'));
$$;

CREATE OR REPLACE FUNCTION is_org_staff(p_establishment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM establishments e
    JOIN org_members om ON om.org_id = e.org_id
    WHERE e.id = p_establishment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('staff', 'admin')
  );
$$;

CREATE POLICY pos_metrics_read ON pos_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM establishment_members em
    WHERE em.establishment_id = pos_metrics.establishment_id
      AND em.user_id = auth.uid()
  )
  OR is_org_staff(pos_metrics.establishment_id)
);

CREATE POLICY establishments_read ON establishments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = establishments.id AND em.user_id = auth.uid())
  OR is_org_staff(establishments.id)
);

CREATE POLICY establishment_members_self ON establishment_members FOR SELECT
USING (user_id = auth.uid());
CREATE POLICY org_members_self ON org_members FOR SELECT
USING (user_id = auth.uid());
CREATE POLICY users_self ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY consents_self ON consents FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- audit_log: append-only & immutable.
CREATE OR REPLACE FUNCTION block_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_log is append-only'; END; $$;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();
