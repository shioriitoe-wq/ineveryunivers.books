-- Member directory, public profiles and 1:1 private messaging.
-- Additive migration. Apply only to the development-admin database after review.

CREATE TABLE IF NOT EXISTS app_user_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '',
    favorite_books TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    profile_visibility TEXT NOT NULL DEFAULT 'members'
        CHECK (profile_visibility IN ('public', 'members', 'private')),
    show_badges BOOLEAN NOT NULL DEFAULT TRUE,
    show_join_date BOOLEAN NOT NULL DEFAULT TRUE,
    allow_messages_from TEXT NOT NULL DEFAULT 'members'
        CHECK (allow_messages_from IN ('everyone', 'members', 'none')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (char_length(bio) <= 1000),
    CHECK (cardinality(favorite_books) <= 20)
);

-- Stable ordered participant pair guarantees one direct conversation per pair.
CREATE TABLE IF NOT EXISTS app_private_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_low_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    user_high_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NULL,
    CHECK (user_low_id < user_high_id),
    UNIQUE (user_low_id, user_high_id)
);
CREATE INDEX IF NOT EXISTS idx_private_conversations_low_last
    ON app_private_conversations(user_low_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_private_conversations_high_last
    ON app_private_conversations(user_high_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS app_private_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES app_private_conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,
    CHECK (char_length(body) BETWEEN 1 AND 5000)
);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_date
    ON app_private_messages(conversation_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS app_private_conversation_state (
    conversation_id BIGINT NOT NULL REFERENCES app_private_conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NULL,
    archived_at TIMESTAMPTZ NULL,
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS app_user_blocks (
    blocker_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    blocked_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS app_private_message_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    message_id BIGINT NOT NULL REFERENCES app_private_messages(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('harassment', 'spam', 'threat', 'inappropriate', 'other')),
    details TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected')),
    reviewed_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (char_length(details) <= 2000),
    UNIQUE (reporter_id, message_id)
);
CREATE INDEX IF NOT EXISTS idx_private_message_reports_status_date
    ON app_private_message_reports(status, created_at DESC);

INSERT INTO app_permissions (permission_key, label, description)
VALUES
 ('community.members.list', 'Zobrazit členy', 'Přístup k veřejnému seznamu členů komunity.'),
 ('community.profiles.view', 'Zobrazit profily členů', 'Přístup k veřejným profilům členů komunity.'),
 ('community.messages.moderate', 'Řešit nahlášené zprávy', 'Přístup k nahlášeným soukromým zprávám pouze v rozsahu konkrétního hlášení.')
ON CONFLICT (permission_key) DO NOTHING;

-- Member directory/profile visibility is enforced in the API; these catalogue
-- entries are not automatically granted to administrative roles.

INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key = 'community.messages.moderate'
WHERE r.role_key IN ('admin', 'moderator')
ON CONFLICT DO NOTHING;
