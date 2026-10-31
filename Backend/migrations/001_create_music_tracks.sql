CREATE TABLE IF NOT EXISTS music_tracks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    artist TEXT NOT NULL DEFAULT '',
    book_id INTEGER NULL REFERENCES books(id) ON DELETE SET NULL,
    audio_url TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    mood_tags TEXT[] NOT NULL DEFAULT '{}',
    genre_tags TEXT[] NOT NULL DEFAULT '{}',
    scene TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    author_comment TEXT NOT NULL DEFAULT '',
    lyrics_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    allow_download BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_published_sort
    ON music_tracks (published, sort_order, title);

CREATE INDEX IF NOT EXISTS idx_music_tracks_book
    ON music_tracks (book_id);
