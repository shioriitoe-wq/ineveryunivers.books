-- Convert existing video tag columns from TEXT to JSONB.
-- Drop legacy defaults first: PostgreSQL cannot always cast a column default
-- automatically when changing the column type. Existing row values are preserved.

ALTER TABLE media_videos
    ALTER COLUMN genre_tags DROP DEFAULT,
    ALTER COLUMN mood_tags DROP DEFAULT;

ALTER TABLE media_videos
    ALTER COLUMN genre_tags TYPE JSONB
    USING CASE
        WHEN genre_tags IS NULL OR BTRIM(genre_tags) = '' THEN '[]'::jsonb
        ELSE genre_tags::jsonb
    END;

ALTER TABLE media_videos
    ALTER COLUMN mood_tags TYPE JSONB
    USING CASE
        WHEN mood_tags IS NULL OR BTRIM(mood_tags) = '' THEN '[]'::jsonb
        ELSE mood_tags::jsonb
    END;

ALTER TABLE media_videos
    ALTER COLUMN genre_tags SET DEFAULT '[]'::jsonb,
    ALTER COLUMN genre_tags SET NOT NULL,
    ALTER COLUMN mood_tags SET DEFAULT '[]'::jsonb,
    ALTER COLUMN mood_tags SET NOT NULL;
