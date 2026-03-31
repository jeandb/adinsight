-- Migration: 20260401_000017_create_ai_history
-- Up

CREATE TABLE ai_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  scenario         TEXT NOT NULL,
  provider         TEXT NOT NULL,
  model            TEXT NOT NULL,
  messages         JSONB NOT NULL,
  context_snapshot JSONB,
  tokens_input     INTEGER,
  tokens_output    INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_history_user_id    ON ai_history (user_id);
CREATE INDEX idx_ai_history_scenario   ON ai_history (scenario);
CREATE INDEX idx_ai_history_created_at ON ai_history (created_at DESC);

INSERT INTO schema_migrations (version) VALUES ('20260401_000017_create_ai_history');

-- Down
-- DROP TABLE IF EXISTS ai_history;
-- DELETE FROM schema_migrations WHERE version = '20260401_000017_create_ai_history';
