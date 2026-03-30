-- Migration: 20260330_000005_create_campaigns
-- Up

CREATE TYPE campaign_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED');
CREATE TYPE campaign_objective AS ENUM (
  'AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'APP_PROMOTION', 'SALES'
);

CREATE TABLE campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id         UUID NOT NULL REFERENCES ad_platforms(id) ON DELETE RESTRICT,
  external_id         TEXT NOT NULL,
  name                TEXT NOT NULL,
  channel_id          UUID REFERENCES business_channels(id) ON DELETE SET NULL,
  objective           campaign_objective NOT NULL DEFAULT 'TRAFFIC',
  status              campaign_status NOT NULL DEFAULT 'ACTIVE',
  daily_budget_cents  INTEGER,
  total_budget_cents  INTEGER,
  started_at          DATE,
  ended_at            DATE,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaigns_platform_external_unique UNIQUE (platform_id, external_id)
);

CREATE INDEX idx_campaigns_platform_id ON campaigns (platform_id);
CREATE INDEX idx_campaigns_channel_id  ON campaigns (channel_id);
CREATE INDEX idx_campaigns_status      ON campaigns (status);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260330_000005_create_campaigns');

-- Down
-- DROP TABLE IF EXISTS campaigns;
-- DROP TYPE IF EXISTS campaign_objective;
-- DROP TYPE IF EXISTS campaign_status;
-- DELETE FROM schema_migrations WHERE version = '20260330_000005_create_campaigns';
