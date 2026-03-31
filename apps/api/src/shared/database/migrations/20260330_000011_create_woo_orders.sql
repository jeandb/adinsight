-- Migration: 20260330_000011_create_woo_orders
-- Up

CREATE TYPE woo_order_status AS ENUM (
  'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'
);

CREATE TABLE woo_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID NOT NULL REFERENCES woo_stores(id) ON DELETE CASCADE,
  external_id    TEXT NOT NULL,
  status         woo_order_status NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  total_cents    INTEGER NOT NULL DEFAULT 0,
  paid_at        TIMESTAMPTZ,
  order_date     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT woo_orders_store_external_unique UNIQUE (store_id, external_id)
);

CREATE INDEX idx_woo_orders_store_id  ON woo_orders (store_id);
CREATE INDEX idx_woo_orders_paid_at   ON woo_orders (paid_at DESC NULLS LAST);
CREATE INDEX idx_woo_orders_order_date ON woo_orders (order_date DESC);
CREATE INDEX idx_woo_orders_status    ON woo_orders (status);

CREATE TRIGGER woo_orders_updated_at
  BEFORE UPDATE ON woo_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260330_000011_create_woo_orders');

-- Down
-- DROP TABLE IF EXISTS woo_orders;
-- DROP TYPE IF EXISTS woo_order_status;
-- DELETE FROM schema_migrations WHERE version = '20260330_000011_create_woo_orders';
