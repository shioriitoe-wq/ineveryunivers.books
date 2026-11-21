-- Add a separate beta-tester designation.
-- It is intentionally an additional role: a beta tester can also remain a member.
-- No existing user is automatically enrolled.
INSERT INTO app_roles (role_key, label, description, is_system)
VALUES (
    'beta_tester',
    'Beta tester',
    'Testování neveřejných funkcí a obsahu určeného pro beta program.',
    TRUE
)
ON CONFLICT (role_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;
