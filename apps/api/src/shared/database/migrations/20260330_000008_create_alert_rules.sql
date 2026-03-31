-- Migration: 20260330_000008_create_alert_rules
-- Up

CREATE TYPE alert_metric AS ENUM (
  'roas', 'cpl', 'cpc', 'ctr', 'spend', 'impressions', 'clicks', 'leads'
);

CREATE TYPE alert_operator AS ENUM ('lt', 'lte', 'gt', 'gte');

CREATE TABLE alert_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  metric       alert_metric NOT NULL,
  operator     alert_operator NOT NULL,
  threshold    NUMERIC(18, 4) NOT NULL,
  period_days  INTEGER NOT NULL DEFAULT 7,
  platform     platform_type,          -- NULL = all platforms
  channel_id   UUID REFERENCES business_channels(id) ON DELETE SET NULL,
  recipients   TEXT[] NOT NULL DEFAULT '{}',
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260330_000008_create_alert_rules');

-- Down
-- DROP TABLE IF EXISTS alert_rules;
-- DROP TYPE IF EXISTS alert_operator;
-- DROP TYPE IF EXISTS alert_metric;
-- DELETE FROM schema_migrations WHERE version = '20260330_000008_create_alert_rules';
