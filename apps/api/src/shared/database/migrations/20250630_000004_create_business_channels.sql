-- Migration: 20250630_000004_create_business_channels
-- Up

CREATE TYPE channel_status AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE business_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7) NOT NULL DEFAULT '#6366F1',
  keywords    TEXT[] NOT NULL DEFAULT '{}',
  status      channel_status NOT NULL DEFAULT 'ACTIVE',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER business_channels_updated_at
  BEFORE UPDATE ON business_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20250630_000004_create_business_channels');

-- Down
-- DROP TABLE IF EXISTS business_channels;
-- DROP TYPE IF EXISTS channel_status;
-- DELETE FROM schema_migrations WHERE version = '20250630_000004_create_business_channels';
