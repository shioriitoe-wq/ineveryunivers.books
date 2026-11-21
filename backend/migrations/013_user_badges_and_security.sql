-- User badges and account security extensions. Additive migration only.
CREATE TABLE IF NOT EXISTS app_badges (
  id BIGSERIAL PRIMARY KEY,
  badge_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '✧',
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_user_badges (
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES app_badges(id) ON DELETE CASCADE,
  awarded_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,badge_id)
);
CREATE INDEX IF NOT EXISTS idx_app_user_badges_user ON app_user_badges(user_id,awarded_at DESC);
INSERT INTO app_badges (badge_key,title,description,icon,rarity,is_hidden) VALUES
 ('first_steps','První kroky','Vítej v komunitě In Every Universe.','✧','common',FALSE),
 ('bookworm','Knižní nadšenec','Ocenění pro čtenáře a milovníky příběhů.','📚','rare',FALSE),
 ('pioneer','Průkopník','Za pomoc s testováním nových funkcí.','🦋','epic',FALSE)
ON CONFLICT (badge_key) DO NOTHING;
