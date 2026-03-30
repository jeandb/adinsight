-- Migration: 20250629_000001_create_users
-- Up

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('ADMIN', 'TRAFFIC_MANAGER', 'DIRECTOR', 'VIEWER');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'VIEWER',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  invite_token  TEXT,
  invite_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_invite_token ON users (invite_token) WHERE invite_token IS NOT NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabela de controle de migrações
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('20250629_000001_create_users');

-- Down (para rollback — executar manualmente se necessário)
-- DROP TABLE IF EXISTS users;
-- DROP TYPE IF EXISTS user_role;
-- DROP FUNCTION IF EXISTS update_updated_at;
-- DELETE FROM schema_migrations WHERE version = '20250629_000001_create_users';
