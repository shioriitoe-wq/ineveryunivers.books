CREATE TABLE IF NOT EXISTS media_videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    storage_path TEXT NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 524288000),
    duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_videos_published_sort ON media_videos (published, sort_order, created_at DESC);
CREATE TABLE IF NOT EXISTS media_video_tracks (
    video_id BIGINT NOT NULL REFERENCES media_videos(id) ON DELETE CASCADE,
    track_id BIGINT NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'karaoke' CHECK (role IN ('karaoke','story')),
    PRIMARY KEY (video_id, track_id, role)
);
CREATE TABLE IF NOT EXISTS media_video_books (
    video_id BIGINT NOT NULL REFERENCES media_videos(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    volume_id INTEGER NULL REFERENCES volumes(id) ON DELETE SET NULL,
    id BIGSERIAL PRIMARY KEY
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_video_books_assignment
    ON media_video_books (video_id, book_id, COALESCE(volume_id, 0));
CREATE INDEX IF NOT EXISTS idx_media_video_tracks_track ON media_video_tracks (track_id);
CREATE INDEX IF NOT EXISTS idx_media_video_books_book ON media_video_books (book_id, volume_id);
