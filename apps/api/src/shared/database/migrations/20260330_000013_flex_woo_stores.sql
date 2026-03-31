-- Migration: 20260330_000013_flex_woo_stores
-- Up
-- Allow user-created stores beyond the 3 pre-seeded ones,
-- and support both WooCommerce API and manual file import as source types.

-- 1. Change 'type' from ENUM to TEXT (preserves existing values as strings)
ALTER TABLE woo_stores ALTER COLUMN type TYPE TEXT USING type::text;
DROP TYPE IF EXISTS woo_store_type;

-- 2. Add source type: 'woocommerce' (API integration) | 'manual' (file upload)
ALTER TABLE woo_stores ADD COLUMN source_type TEXT NOT NULL DEFAULT 'woocommerce'
  CONSTRAINT woo_stores_source_type_check CHECK (source_type IN ('woocommerce', 'manual'));

-- 3. Allow deletion only for user-created stores (not the 3 pre-seeded ones)
ALTER TABLE woo_stores ADD COLUMN is_deletable BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE woo_stores SET is_deletable = FALSE
  WHERE type IN ('LOJA_DAS_PROFS', 'CLUBE_DAS_PROFS', 'TUDO_DE_PROF');

-- 4. Remove UNIQUE constraint on 'type' so users can add custom stores freely
ALTER TABLE woo_stores DROP CONSTRAINT IF EXISTS woo_stores_type_key;

INSERT INTO schema_migrations (version) VALUES ('20260330_000013_flex_woo_stores');

-- Down
-- ALTER TABLE woo_stores DROP COLUMN IF EXISTS is_deletable;
-- ALTER TABLE woo_stores DROP COLUMN IF EXISTS source_type;
-- CREATE TYPE woo_store_type AS ENUM ('LOJA_DAS_PROFS','CLUBE_DAS_PROFS','TUDO_DE_PROF');
-- ALTER TABLE woo_stores ALTER COLUMN type TYPE woo_store_type USING type::woo_store_type;
-- ALTER TABLE woo_stores ADD CONSTRAINT woo_stores_type_key UNIQUE (type);
-- DELETE FROM schema_migrations WHERE version = '20260330_000013_flex_woo_stores';
