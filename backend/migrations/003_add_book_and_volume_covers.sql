-- Adds optional book- and volume-level cover references.
-- This migration has already been applied to the before-media-library Neon branch.
-- IF NOT EXISTS makes it safe to run again in environments where the columns exist.

BEGIN;

ALTER TABLE books
    ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT '';

ALTER TABLE volumes
    ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN books.cover_url IS
    'URL of the book cover image used across the site';

COMMENT ON COLUMN volumes.cover_url IS
    'Optional volume-specific cover image; empty means use the parent book cover';

COMMIT;
