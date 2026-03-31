-- Migration: 20260330_000012_create_woo_subscriptions
-- Up
-- Subscriptions from Clube das Profs (YITH WooCommerce Subscriptions plugin)

CREATE TYPE woo_subscription_status AS ENUM (
  'active', 'cancelled', 'expired', 'on-hold', 'pending', 'pending-cancel'
);

CREATE TABLE woo_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES woo_stores(id) ON DELETE CASCADE,
  external_id         TEXT NOT NULL,
  customer_email      TEXT,
  status              woo_subscription_status NOT NULL DEFAULT 'pending',
  plan_name           TEXT,
  total_cents         INTEGER NOT NULL DEFAULT 0,
  billing_period      TEXT,             -- 'year', 'month'
  start_date          DATE,
  end_date            DATE,
  next_payment_date   DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT woo_subscriptions_store_external_unique UNIQUE (store_id, external_id)
);

CREATE INDEX idx_woo_subscriptions_store_id ON woo_subscriptions (store_id);
CREATE INDEX idx_woo_subscriptions_status   ON woo_subscriptions (status);

CREATE TRIGGER woo_subscriptions_updated_at
  BEFORE UPDATE ON woo_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260330_000012_create_woo_subscriptions');

-- Down
-- DROP TABLE IF EXISTS woo_subscriptions;
-- DROP TYPE IF EXISTS woo_subscription_status;
-- DELETE FROM schema_migrations WHERE version = '20260330_000012_create_woo_subscriptions';
