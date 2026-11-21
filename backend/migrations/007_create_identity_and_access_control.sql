-- ineveryunivers.books: identity, roles, sessions and hierarchical content access.
-- Additive migration: does not alter or delete existing project tables or content.

CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    account_status TEXT NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('pending', 'active', 'suspended', 'disabled')),
    email_verified_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_email_lower
    ON app_users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_username_lower
    ON app_users (LOWER(username));

CREATE TABLE IF NOT EXISTS app_roles (
    id BIGSERIAL PRIMARY KEY,
    role_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_permissions (
    id BIGSERIAL PRIMARY KEY,
    permission_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS app_user_roles (
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE RESTRICT,
    assigned_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_role ON app_user_roles (role_id);

CREATE TABLE IF NOT EXISTS app_role_permissions (
    role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES app_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_app_role_permissions_permission
    ON app_role_permissions (permission_id);

CREATE TABLE IF NOT EXISTS app_user_permissions (
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES app_permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- Store only a hash of each opaque session token, never the raw token.
CREATE TABLE IF NOT EXISTS app_user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    ip_address INET NULL
);
CREATE INDEX IF NOT EXISTS idx_app_user_sessions_user_active
    ON app_user_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;

-- A resource is a page, panel, chapter, video, soundtrack item, etc.
-- parent_resource_id enables inherited access rules and child exceptions.
CREATE TABLE IF NOT EXISTS access_resources (
    id BIGSERIAL PRIMARY KEY,
    resource_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('section', 'page', 'panel', 'book', 'volume', 'chapter', 'character', 'video', 'track', 'community_item', 'other')),
    parent_resource_id BIGINT NULL REFERENCES access_resources(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (parent_resource_id IS NULL OR parent_resource_id <> id)
);
CREATE INDEX IF NOT EXISTS idx_access_resources_parent
    ON access_resources (parent_resource_id);

-- access_mode:
-- inherit = use nearest ancestor rule; public = everyone; authenticated = signed-in users;
-- roles/users = allow-list via the two grant tables; locked = deny normal users.
-- available_from / available_until optionally schedule an availability window.
CREATE TABLE IF NOT EXISTS access_rules (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL UNIQUE REFERENCES access_resources(id) ON DELETE CASCADE,
    access_mode TEXT NOT NULL DEFAULT 'inherit'
        CHECK (access_mode IN ('inherit', 'public', 'authenticated', 'roles', 'users', 'locked')),
    available_from TIMESTAMPTZ NULL,
    available_until TIMESTAMPTZ NULL,
    updated_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (available_from IS NULL OR available_until IS NULL OR available_until > available_from)
);
CREATE INDEX IF NOT EXISTS idx_access_rules_mode ON access_rules (access_mode);

CREATE TABLE IF NOT EXISTS access_rule_roles (
    access_rule_id BIGINT NOT NULL REFERENCES access_rules(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (access_rule_id, role_id)
);

CREATE TABLE IF NOT EXISTS access_rule_users (
    access_rule_id BIGINT NOT NULL REFERENCES access_rules(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    PRIMARY KEY (access_rule_id, user_id)
);

CREATE TABLE IF NOT EXISTS access_change_log (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NULL REFERENCES access_resources(id) ON DELETE SET NULL,
    changed_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_change_log_resource_date
    ON access_change_log (resource_id, created_at DESC);

-- Built-in role records only. No user is created and no privileges are assigned here.
INSERT INTO app_roles (role_key, label, description, is_system)
VALUES
    ('owner', 'Vlastník', 'Nejvyšší oprávnění k celému projektu.', TRUE),
    ('admin', 'Administrátor', 'Správa přidělených částí webu.', TRUE),
    ('moderator', 'Moderátor', 'Správa komunitního obsahu podle oprávnění.', TRUE),
    ('member', 'Člen', 'Běžný registrovaný uživatel.', TRUE)
ON CONFLICT (role_key) DO NOTHING;

-- Permission catalogue. Grants will be assigned deliberately in a later step.
INSERT INTO app_permissions (permission_key, label, description)
VALUES
    ('admin.dashboard.view', 'Zobrazit administraci', 'Přístup do administračního přehledu.'),
    ('users.view', 'Zobrazit uživatele', 'Prohlížení seznamu uživatelů.'),
    ('users.manage', 'Spravovat uživatele', 'Úprava, blokování a správa účtů.'),
    ('roles.manage', 'Spravovat role', 'Přidělování rolí a oprávnění.'),
    ('content.manage', 'Spravovat obsah', 'Správa knihovního a mediálního obsahu.'),
    ('community.manage', 'Spravovat komunitu', 'Správa komunitních příspěvků a anket.'),
    ('access.manage', 'Spravovat přístupy', 'Zamykání a odemykání částí webu.'),
    ('settings.manage', 'Spravovat nastavení', 'Změna globálních nastavení projektu.')
ON CONFLICT (permission_key) DO NOTHING;
