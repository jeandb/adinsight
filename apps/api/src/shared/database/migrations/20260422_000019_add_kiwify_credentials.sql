-- up
ALTER TABLE woo_stores
  ADD COLUMN IF NOT EXISTS kiwify_client_id_encrypted     TEXT,
  ADD COLUMN IF NOT EXISTS kiwify_client_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS kiwify_account_id_encrypted    TEXT;

-- down
ALTER TABLE woo_stores
  DROP COLUMN IF EXISTS kiwify_client_id_encrypted,
  DROP COLUMN IF EXISTS kiwify_client_secret_encrypted,
  DROP COLUMN IF EXISTS kiwify_account_id_encrypted;
