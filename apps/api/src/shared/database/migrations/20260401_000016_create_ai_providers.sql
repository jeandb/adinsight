-- Migration: 20260401_000016_create_ai_providers
-- Up

CREATE TABLE ai_providers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  provider          TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
  model             TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  max_tokens        INTEGER NOT NULL DEFAULT 4096,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_scenario_assignments (
  scenario     TEXT PRIMARY KEY,
  provider_id  UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_scenario_assignments (scenario) VALUES
  ('chat'),
  ('daily-analysis'),
  ('on-demand');

CREATE TRIGGER ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO schema_migrations (version) VALUES ('20260401_000016_create_ai_providers');

-- Down
-- DROP TABLE IF EXISTS ai_scenario_assignments;
-- DROP TABLE IF EXISTS ai_providers;
-- DELETE FROM schema_migrations WHERE version = '20260401_000016_create_ai_providers';
