-- Migration: 20260330_000009_create_alert_events
-- Up

CREATE TABLE alert_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  rule_name     TEXT NOT NULL,    -- snapshot at time of trigger
  metric        alert_metric NOT NULL,
  operator      alert_operator NOT NULL,
  threshold     NUMERIC(18, 4) NOT NULL,
  metric_value  NUMERIC(18, 4) NOT NULL,
  message       TEXT NOT NULL,
  notified      BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_events_rule_id      ON alert_events (rule_id);
CREATE INDEX idx_alert_events_triggered_at ON alert_events (triggered_at DESC);

INSERT INTO schema_migrations (version) VALUES ('20260330_000009_create_alert_events');

-- Down
-- DROP TABLE IF EXISTS alert_events;
-- DELETE FROM schema_migrations WHERE version = '20260330_000009_create_alert_events';
