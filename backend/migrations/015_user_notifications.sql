-- In-app notifications for messages and important account changes.
CREATE TABLE IF NOT EXISTS app_user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    target_path TEXT NOT NULL DEFAULT '/account',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL,
    CHECK (char_length(title) BETWEEN 1 AND 160),
    CHECK (char_length(body) <= 1000),
    CHECK (char_length(target_path) <= 500)
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
    ON app_user_notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_date
    ON app_user_notifications(user_id, created_at DESC);
