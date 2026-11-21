-- 018: Unified access profiles, hidden resources, multi-context links and action permissions.
-- Additive and repeat-safe. Does not change existing resource visibility or role assignments.
-- Apply after migrations 001-017.

-- Extend the existing rule modes without changing current records.
ALTER TABLE access_rules DROP CONSTRAINT IF EXISTS access_rules_access_mode_check;
ALTER TABLE access_rules
    ADD CONSTRAINT access_rules_access_mode_check
    CHECK (access_mode IN ('inherit', 'public', 'authenticated', 'roles', 'users', 'locked', 'hidden', 'profile'));

-- Reusable profiles: assign once, reuse on any number of resources/actions.
CREATE TABLE IF NOT EXISTS access_profiles (
    id BIGSERIAL PRIMARY KEY,
    profile_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_profile_roles (
    profile_id BIGINT NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, role_id)
);

CREATE TABLE IF NOT EXISTS access_profile_users (
    profile_id BIGINT NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, user_id)
);

ALTER TABLE access_rules
    ADD COLUMN IF NOT EXISTS access_profile_id BIGINT NULL
        REFERENCES access_profiles(id) ON DELETE SET NULL;

-- A resource may appear in several parts of the site (e.g. a track linked to a book,
-- a volume and a character). Keep parent_resource_id for legacy inheritance,
-- while recording additional contextual relationships separately.
CREATE TABLE IF NOT EXISTS access_resource_links (
    resource_id BIGINT NOT NULL REFERENCES access_resources(id) ON DELETE CASCADE,
    linked_resource_id BIGINT NOT NULL REFERENCES access_resources(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL DEFAULT 'related',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (resource_id, linked_resource_id, relation_type),
    CHECK (resource_id <> linked_resource_id)
);
CREATE INDEX IF NOT EXISTS idx_access_resource_links_linked
    ON access_resource_links (linked_resource_id);

-- Stable mapping from real application records to access resources.
-- source_key is an application-owned identifier, not something admins type manually.
ALTER TABLE access_resources
    ADD COLUMN IF NOT EXISTS source_type TEXT NULL,
    ADD COLUMN IF NOT EXISTS source_id TEXT NULL,
    ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_access_resources_source
    ON access_resources (source_type, source_id)
    WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

-- Action permissions are separate from reading content (comment, publish, react, upload, etc.).
CREATE TABLE IF NOT EXISTS access_actions (
    id BIGSERIAL PRIMARY KEY,
    action_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    scope_type TEXT NOT NULL DEFAULT 'global'
        CHECK (scope_type IN ('global', 'resource_type', 'resource')),
    resource_type TEXT NULL,
    resource_id BIGINT NULL REFERENCES access_resources(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (scope_type = 'global' AND resource_type IS NULL AND resource_id IS NULL) OR
        (scope_type = 'resource_type' AND resource_type IS NOT NULL AND resource_id IS NULL) OR
        (scope_type = 'resource' AND resource_id IS NOT NULL AND resource_type IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS access_action_profiles (
    action_id BIGINT NOT NULL REFERENCES access_actions(id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES access_profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (action_id, profile_id)
);

CREATE TABLE IF NOT EXISTS access_action_roles (
    action_id BIGINT NOT NULL REFERENCES access_actions(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (action_id, role_id)
);

CREATE TABLE IF NOT EXISTS access_action_users (
    action_id BIGINT NOT NULL REFERENCES access_actions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    PRIMARY KEY (action_id, user_id)
);

-- Built-in profiles are deliberately descriptive. No permissions are granted to
-- individual users and existing access rules are not rewritten.
INSERT INTO access_profiles (profile_key, label, description) VALUES
 ('public', 'Veřejný obsah', 'Obsah dostupný i bez přihlášení.'),
 ('registered', 'Registrovaní členové', 'Obsah dostupný přihlášeným členům.'),
 ('beta_testers', 'Beta testeři', 'Obsah dostupný uživatelům s rolí beta tester.'),
 ('bonus', 'Bonusový obsah', 'Profil pro budoucí bonusový obsah členů.'),
 ('administrators', 'Administrace', 'Obsah určený vlastníkovi a pověřeným správcům.')
ON CONFLICT (profile_key) DO NOTHING;

-- Seed common action catalog. These are definitions only; no endpoint behavior changes
-- until application routes explicitly enforce the relevant action keys.
INSERT INTO access_actions (action_key, label, description, scope_type, resource_type) VALUES
 ('content.comment', 'Přidávat komentáře', 'Vytváření komentářů k obsahu.', 'global', NULL),
 ('content.publish', 'Publikovat vlastní obsah', 'Publikování vlastních příspěvků a tvorby.', 'global', NULL),
 ('content.react', 'Reagovat na obsah', 'Přidávání reakcí k obsahu.', 'global', NULL),
 ('content.upload', 'Nahrávat soubory', 'Nahrávání vlastních souborů a médií.', 'global', NULL),
 ('community.message', 'Odesílat komunitní zprávy', 'Odesílání zpráv v komunitních částech.', 'global', NULL)
ON CONFLICT (action_key) DO NOTHING;
