-- 020: default role membership for reusable access profiles.
-- Only links roles that exist in this installation; no content rules are changed.
INSERT INTO access_profile_roles (profile_id, role_id)
SELECT p.id, r.id
FROM access_profiles p
JOIN app_roles r ON (
    (p.profile_key = 'registered' AND r.role_key = 'member') OR
    (p.profile_key = 'beta_testers' AND r.role_key = 'beta_tester') OR
    (p.profile_key = 'bonus' AND r.role_key = 'member') OR
    (p.profile_key = 'administrators' AND r.role_key IN ('owner', 'admin'))
)
ON CONFLICT DO NOTHING;
