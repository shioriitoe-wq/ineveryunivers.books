-- 017: Complete the existing hierarchical access-control foundation.
-- Additive and repeat-safe. Existing resources remain public until explicit rules are set.

ALTER TABLE access_rules
    ADD COLUMN IF NOT EXISTS locked_message TEXT NOT NULL
    DEFAULT 'Tento obsah je momentálně uzamčen.';

INSERT INTO access_resources (resource_key, label, resource_type, is_active)
VALUES
    ('section:books', 'Knihy', 'section', TRUE),
    ('section:filmoteka', 'Filmotéka', 'section', TRUE),
    ('section:soundtrack', 'Soundtracky', 'section', TRUE),
    ('section:community', 'Komunita', 'section', TRUE),
    ('section:fans', 'Fanoušci', 'section', TRUE),
    ('section:accounts', 'Účty', 'section', TRUE),
    ('section:private_messages', 'Soukromé zprávy', 'section', TRUE),
    ('section:notifications', 'Upozornění', 'section', TRUE),
    ('section:administration', 'Administrace', 'section', TRUE)
ON CONFLICT (resource_key) DO NOTHING;

INSERT INTO access_rules (resource_id, access_mode, locked_message)
SELECT id, 'inherit', 'Tato část webu je momentálně uzamčená.'
FROM access_resources
WHERE resource_key LIKE 'section:%'
ON CONFLICT (resource_id) DO NOTHING;
