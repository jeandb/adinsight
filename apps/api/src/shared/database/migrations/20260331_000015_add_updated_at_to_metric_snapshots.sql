-- Migration: 20260331_000015_add_updated_at_to_metric_snapshots
-- Up

ALTER TABLE metric_snapshots
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER metric_snapshots_updated_at
  BEFORE UPDATE ON metric_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260331_000015_add_updated_at_to_metric_snapshots');

-- Down
-- DROP TRIGGER IF EXISTS metric_snapshots_updated_at ON metric_snapshots;
-- ALTER TABLE metric_snapshots DROP COLUMN updated_at;
-- DELETE FROM schema_migrations WHERE version = '20260331_000015_add_updated_at_to_metric_snapshots';
