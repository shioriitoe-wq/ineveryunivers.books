-- 016: Central site configuration foundation.
-- Additive and repeat-safe. Existing site behavior remains public/active by default.

CREATE TABLE IF NOT EXISTS site_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_status TEXT NOT NULL DEFAULT 'active'
        CHECK (site_status IN ('active', 'maintenance', 'locked', 'inactive')),
    maintenance_title TEXT NOT NULL DEFAULT 'Právě připravujeme něco nového',
    maintenance_message TEXT NOT NULL DEFAULT 'Web je dočasně mimo provoz. Zkus to prosím později.',
    maintenance_background_url TEXT NOT NULL DEFAULT '',
    expected_restore_at TIMESTAMPTZ NULL,
    allow_admin_access BOOLEAN NOT NULL DEFAULT TRUE,
    allow_moderator_access BOOLEAN NOT NULL DEFAULT FALSE,
    allow_beta_tester_access BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_section_settings (
    section_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'locked', 'authenticated', 'roles')),
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    locked_message TEXT NOT NULL DEFAULT 'Tato část webu je momentálně uzamčená.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_section_settings (section_key, label, status) VALUES
    ('books', 'Knihy', 'active'),
    ('filmoteka', 'Filmotéka', 'active'),
    ('soundtrack', 'Soundtrack', 'active'),
    ('community', 'Komunita', 'active'),
    ('fans', 'Fanoušci', 'active'),
    ('accounts', 'Účty', 'active'),
    ('private_messages', 'Soukromé zprávy', 'active'),
    ('notifications', 'Upozornění', 'active'),
    ('administration', 'Administrace', 'active')
ON CONFLICT (section_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_feature_flags (
    feature_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    implementation_status TEXT NOT NULL DEFAULT 'ready'
        CHECK (implementation_status IN ('ready', 'preparing')),
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (implementation_status = 'ready' OR is_enabled = FALSE)
);

INSERT INTO site_feature_flags
    (feature_key, label, description, implementation_status, is_enabled)
VALUES
    ('user_registration', 'Registrace nových členů', 'Povoluje vytváření nových uživatelských účtů.', 'ready', TRUE),
    ('user_login', 'Přihlašování', 'Povoluje přihlášení existujících členů.', 'ready', TRUE),
    ('public_member_profiles', 'Veřejné profily členů', 'Zpřístupnění veřejných členských profilů.', 'preparing', FALSE),
    ('private_messages', 'Soukromé zprávy', 'Povoluje odesílání nových soukromých zpráv.', 'ready', TRUE),
    ('private_message_reports', 'Nahlášení zpráv', 'Povoluje hlášení soukromých zpráv.', 'ready', TRUE),
    ('beta_testing', 'Beta testování', 'Povoluje přístup k beta funkcím podle oprávnění.', 'ready', TRUE),
    ('email_notifications', 'E-mailová upozornění', 'Řídí odesílání e-mailových upozornění.', 'ready', TRUE),
    ('email_verification', 'Ověřování e-mailů', 'Ověřování e-mailových adres členů.', 'preparing', FALSE),
    ('public_member_directory', 'Veřejný seznam členů', 'Veřejné procházení seznamu členů.', 'preparing', FALSE),
    ('fanfiction', 'Fanfikce', 'Publikování fanfikcí členů.', 'preparing', FALSE),
    ('fanart', 'Fanart', 'Galerie fanouškovské tvorby.', 'preparing', FALSE),
    ('comments', 'Komentáře', 'Komentáře k obsahu.', 'preparing', FALSE),
    ('reactions', 'Reakce', 'Reakce na obsah.', 'preparing', FALSE)
ON CONFLICT (feature_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_site_section_settings_status
    ON site_section_settings (status);
CREATE INDEX IF NOT EXISTS idx_site_feature_flags_enabled
    ON site_feature_flags (is_enabled);

-- settings.manage already exists in the identity/access foundation and is
-- intentionally owner-only in the current role model. No role grants are added.
