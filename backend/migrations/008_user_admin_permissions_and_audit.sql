-- User administration permissions and audit trail. Additive only.
CREATE TABLE IF NOT EXISTS app_user_admin_log (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    target_user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_user_admin_log_target_date
    ON app_user_admin_log (target_user_id, created_at DESC);

-- The admin role can inspect and manage ordinary accounts. Role assignment stays owner-only.
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
JOIN app_permissions p ON p.permission_key IN ('admin.dashboard.view', 'users.view', 'users.manage')
WHERE r.role_key = 'admin'
ON CONFLICT DO NOTHING;
