-- Billing: Stripe subscriptions, Connect accounts, route commissions, webhook idempotency.
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('starter', 'growth', 'scale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier subscription_tier NOT NULL,
  status text NOT NULL DEFAULT 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_est_uniq UNIQUE (establishment_id)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_read ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = subscriptions.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(subscriptions.establishment_id)
);

CREATE TABLE IF NOT EXISTS connect_accounts (
  establishment_id uuid PRIMARY KEY REFERENCES establishments(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  charges_enabled text NOT NULL DEFAULT 'false',
  payouts_enabled text NOT NULL DEFAULT 'false',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY connect_accounts_read ON connect_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = connect_accounts.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(connect_accounts.establishment_id)
);

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  gross_cents integer NOT NULL,
  commission_pct numeric(5,2) NOT NULL,
  commission_cents integer NOT NULL,
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY commissions_read ON commissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM establishment_members em
          WHERE em.establishment_id = commissions.establishment_id AND em.user_id = auth.uid())
  OR is_org_staff(commissions.establishment_id)
);
CREATE INDEX IF NOT EXISTS commissions_est_idx ON commissions (establishment_id);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY; -- no policies => service_role only
