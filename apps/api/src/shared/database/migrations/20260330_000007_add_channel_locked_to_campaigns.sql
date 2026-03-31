-- Migration: 20260330_000007_add_channel_locked_to_campaigns
-- Up

ALTER TABLE campaigns
  ADD COLUMN channel_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN campaigns.channel_locked IS
  'When TRUE, auto-sync will not overwrite channel_id (set after manual assignment)';

INSERT INTO schema_migrations (version) VALUES ('20260330_000007_add_channel_locked_to_campaigns');

-- Down
-- ALTER TABLE campaigns DROP COLUMN channel_locked;
-- DELETE FROM schema_migrations WHERE version = '20260330_000007_add_channel_locked_to_campaigns';
