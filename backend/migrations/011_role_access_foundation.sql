-- Explicit, least-privilege access for moderation and the separate Beta Center.
-- Additive and idempotent. Does not assign any role to any user.

INSERT INTO app_permissions (permission_key, label, description)
VALUES
    ('moderation.access', 'Přístup do moderátorské sekce', 'Přístup do samostatné správy komunitního obsahu.'),
    ('beta.center.access', 'Přístup do Beta centra', 'Přístup do samostatné stránky Beta centra v administraci.')
ON CONFLICT (permission_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;

-- Administrators can access user, content, moderation and beta work areas.
-- Global access rules and global settings remain owner-only.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN (
    'admin.dashboard.view',
    'users.view',
    'users.manage',
    'roles.manage',
    'content.manage',
    'community.manage',
    'moderation.access',
    'beta.center.access',
    'beta.features.access'
)
WHERE r.role_key = 'admin'
ON CONFLICT DO NOTHING;

-- Moderators get only the moderation workspace and community management.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN (
    'moderation.access',
    'community.manage'
)
WHERE r.role_key = 'moderator'
ON CONFLICT DO NOTHING;

-- Remove broad administrative access from moderators.
DELETE FROM app_role_permissions rp
USING app_roles r, app_permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.role_key = 'moderator'
  AND p.permission_key IN (
      'admin.dashboard.view',
      'users.view',
      'users.manage',
      'roles.manage',
      'content.manage',
      'access.manage',
      'settings.manage',
      'beta.center.access',
      'beta.features.access'
  );

-- Beta testers get the Beta Center and beta feature flag only.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN (
    'beta.center.access',
    'beta.features.access'
)
WHERE r.role_key = 'beta_tester'
ON CONFLICT DO NOTHING;

-- No users are assigned or removed from any role by this migration.
