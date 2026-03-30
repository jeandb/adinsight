-- Migration: 20250629_000002_create_ad_platforms
-- Up

CREATE TYPE platform_type AS ENUM ('META', 'GOOGLE', 'TIKTOK', 'PINTEREST');
CREATE TYPE platform_status AS ENUM ('ACTIVE', 'ERROR', 'NOT_CONFIGURED');

CREATE TABLE ad_platforms (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  platform_type NOT NULL UNIQUE,
  status                platform_status NOT NULL DEFAULT 'NOT_CONFIGURED',
  credentials_encrypted TEXT,
  last_sync_at          TIMESTAMPTZ,
  last_error            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ad_platforms_updated_at
  BEFORE UPDATE ON ad_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Inserir as 4 plataformas como linhas fixas (sempre existem, só mudam as credenciais)
INSERT INTO ad_platforms (type, status) VALUES
  ('META',      'NOT_CONFIGURED'),
  ('GOOGLE',    'NOT_CONFIGURED'),
  ('TIKTOK',    'NOT_CONFIGURED'),
  ('PINTEREST', 'NOT_CONFIGURED');

INSERT INTO schema_migrations (version) VALUES ('20250629_000002_create_ad_platforms');

-- Down
-- DROP TABLE IF EXISTS ad_platforms;
-- DROP TYPE IF EXISTS platform_status;
-- DROP TYPE IF EXISTS platform_type;
-- DELETE FROM schema_migrations WHERE version = '20250629_000002_create_ad_platforms';
