ALTER TABLE music_tracks
    ADD COLUMN IF NOT EXISTS character_names TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE music_tracks
    ADD COLUMN IF NOT EXISTS volume_id INTEGER NULL
        REFERENCES volumes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_music_tracks_volume
    ON music_tracks (volume_id);
