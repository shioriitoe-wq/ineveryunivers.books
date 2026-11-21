-- 011: scoped role permissions for unified account-based administration.
-- Run only on development-admin first. No account roles are assigned here.
INSERT INTO app_permissions (permission_key, label, description) VALUES
 ('moderation.access', 'Přístup k moderaci', 'Přístup do moderátorské části komunity.'),
 ('beta.center.access', 'Přístup do Beta centra', 'Přístup do samostatného Beta centra.')
ON CONFLICT (permission_key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

-- Ensure admin has its intended site-management permissions.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM app_roles r JOIN app_permissions p ON p.permission_key IN
 ('admin.dashboard.view','users.view','users.manage','roles.manage','content.manage','community.manage')
WHERE r.role_key = 'admin' ON CONFLICT DO NOTHING;

-- Moderators get community moderation only; remove legacy broad dashboard access.
DELETE FROM app_role_permissions rp USING app_roles r, app_permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id AND r.role_key = 'moderator'
  AND p.permission_key IN ('admin.dashboard.view','users.view','users.manage','roles.manage','content.manage','access.manage','settings.manage');
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM app_roles r JOIN app_permissions p ON p.permission_key IN ('moderation.access','community.manage')
WHERE r.role_key = 'moderator' ON CONFLICT DO NOTHING;

-- Beta testers get the beta center and beta feature flag only.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM app_roles r JOIN app_permissions p ON p.permission_key IN ('beta.center.access','beta.features.access')
WHERE r.role_key = 'beta_tester' ON CONFLICT DO NOTHING;
