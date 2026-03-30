-- Migration: 20250629_000003_create_user_invites
-- Up

CREATE TABLE user_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'VIEWER',
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_invites_token ON user_invites (token) WHERE accepted_at IS NULL;
CREATE INDEX idx_user_invites_email ON user_invites (email);

INSERT INTO schema_migrations (version) VALUES ('20250629_000003_create_user_invites');

-- Down
-- DROP TABLE IF EXISTS user_invites;
-- DELETE FROM schema_migrations WHERE version = '20250629_000003_create_user_invites';
