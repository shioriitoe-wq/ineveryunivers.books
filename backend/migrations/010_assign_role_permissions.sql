-- Role permission baseline for ineveryunivers.books.
-- Additive and idempotent: does not alter users, account statuses, or existing role assignments.

INSERT INTO app_permissions (permission_key, label, description)
VALUES
    ('beta.features.access', 'Přístup k beta funkcím', 'Přístup k funkcím a obsahu určenému beta testerům.')
ON CONFLICT (permission_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;

-- Administrators can manage ordinary users, non-owner roles, site content and community.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN (
    'admin.dashboard.view',
    'users.view',
    'users.manage',
    'roles.manage',
    'content.manage',
    'community.manage'
)
WHERE r.role_key = 'admin'
ON CONFLICT DO NOTHING;

-- Moderators can access the moderation area and manage community content only.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN (
    'admin.dashboard.view',
    'community.manage'
)
WHERE r.role_key = 'moderator'
ON CONFLICT DO NOTHING;

-- Beta testers receive a feature flag permission, not administrative permissions.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key = 'beta.features.access'
WHERE r.role_key = 'beta_tester'
ON CONFLICT DO NOTHING;

-- Members intentionally receive no administrative permissions.
