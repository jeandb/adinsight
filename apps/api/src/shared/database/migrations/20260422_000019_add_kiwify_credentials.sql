-- up
ALTER TABLE woo_stores
  ADD COLUMN IF NOT EXISTS kiwify_client_id_encrypted     TEXT,
  ADD COLUMN IF NOT EXISTS kiwify_client_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS kiwify_account_id_encrypted    TEXT;

ALTER TABLE woo_stores
  DROP CONSTRAINT IF EXISTS woo_stores_source_type_check;

ALTER TABLE woo_stores
  ADD CONSTRAINT woo_stores_source_type_check
  CHECK (source_type = ANY (ARRAY['woocommerce'::text, 'manual'::text, 'kiwify'::text]));

INSERT INTO schema_migrations (version) VALUES ('20260422_000019_add_kiwify_credentials');

-- down
ALTER TABLE woo_stores
  DROP COLUMN IF EXISTS kiwify_client_id_encrypted,
  DROP COLUMN IF EXISTS kiwify_client_secret_encrypted,
  DROP COLUMN IF EXISTS kiwify_account_id_encrypted;
