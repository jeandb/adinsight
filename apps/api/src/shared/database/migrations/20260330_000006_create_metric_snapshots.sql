-- Migration: 20260330_000006_create_metric_snapshots
-- Up

CREATE TABLE metric_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  snapshot_date  DATE NOT NULL,
  impressions    INTEGER NOT NULL DEFAULT 0,
  clicks         INTEGER NOT NULL DEFAULT 0,
  spend_cents    INTEGER NOT NULL DEFAULT 0,
  leads          INTEGER NOT NULL DEFAULT 0,
  purchases      INTEGER NOT NULL DEFAULT 0,
  revenue_cents  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT metric_snapshots_campaign_date_unique UNIQUE (campaign_id, snapshot_date)
);

CREATE INDEX idx_metric_snapshots_campaign_id   ON metric_snapshots (campaign_id);
CREATE INDEX idx_metric_snapshots_snapshot_date ON metric_snapshots (snapshot_date);
CREATE INDEX idx_metric_snapshots_date_campaign ON metric_snapshots (snapshot_date, campaign_id);

INSERT INTO schema_migrations (version) VALUES ('20260330_000006_create_metric_snapshots');

-- Down
-- DROP TABLE IF EXISTS metric_snapshots;
-- DELETE FROM schema_migrations WHERE version = '20260330_000006_create_metric_snapshots';
