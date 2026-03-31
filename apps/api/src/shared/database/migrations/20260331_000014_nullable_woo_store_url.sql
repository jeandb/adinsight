-- Migration: 20260331_000014_nullable_woo_store_url
-- Up
-- Allow woo_stores.url to be NULL so manual (file-import) stores don't require a URL.

ALTER TABLE woo_stores ALTER COLUMN url DROP NOT NULL;

INSERT INTO schema_migrations (version) VALUES ('20260331_000014_nullable_woo_store_url');

-- Down
-- UPDATE woo_stores SET url = '' WHERE url IS NULL;
-- ALTER TABLE woo_stores ALTER COLUMN url SET NOT NULL;
-- DELETE FROM schema_migrations WHERE version = '20260331_000014_nullable_woo_store_url';
