-- Migration: 20260401_000018_create_scheduled_reports
-- Up

CREATE TABLE scheduled_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  frequency    TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  format       TEXT NOT NULL CHECK (format IN ('pdf', 'csv', 'excel')),
  scope        TEXT NOT NULL CHECK (scope IN ('campaigns', 'revenue', 'all')),
  recipients   JSONB NOT NULL DEFAULT '[]',
  period_days  INTEGER NOT NULL DEFAULT 30,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260401_000018_create_scheduled_reports');

-- Down
-- DROP TABLE IF EXISTS scheduled_reports;
-- DELETE FROM schema_migrations WHERE version = '20260401_000018_create_scheduled_reports';
