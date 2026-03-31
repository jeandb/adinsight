-- Migration: 20260330_000010_create_woo_stores
-- Up

CREATE TYPE woo_store_type AS ENUM ('LOJA_DAS_PROFS', 'CLUBE_DAS_PROFS', 'TUDO_DE_PROF');
CREATE TYPE woo_store_status AS ENUM ('NOT_CONFIGURED', 'ACTIVE', 'ERROR');

CREATE TABLE woo_stores (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  url                       TEXT NOT NULL,
  type                      woo_store_type NOT NULL UNIQUE,
  channel_id                UUID REFERENCES business_channels(id) ON DELETE SET NULL,
  consumer_key_encrypted    TEXT,
  consumer_secret_encrypted TEXT,
  status                    woo_store_status NOT NULL DEFAULT 'NOT_CONFIGURED',
  last_error                TEXT,
  last_sync_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER woo_stores_updated_at
  BEFORE UPDATE ON woo_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: the 3 known stores for Prof Jaque Mendes
INSERT INTO woo_stores (name, url, type) VALUES
  ('Loja das Profs',  'https://lojadasprofs.com.br',  'LOJA_DAS_PROFS'),
  ('Clube das Profs', 'https://clubedasprofs.com.br', 'CLUBE_DAS_PROFS'),
  ('Tudo de Prof',    'https://tudodeprof.com.br',    'TUDO_DE_PROF');

INSERT INTO schema_migrations (version) VALUES ('20260330_000010_create_woo_stores');

-- Down
-- DROP TABLE IF EXISTS woo_stores;
-- DROP TYPE IF EXISTS woo_store_status;
-- DROP TYPE IF EXISTS woo_store_type;
-- DELETE FROM schema_migrations WHERE version = '20260330_000010_create_woo_stores';
