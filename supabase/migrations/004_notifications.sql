-- ─── notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'mission'
                          CHECK (category IN ('mission','achievement','system','streak','tip')),
  icon        TEXT        DEFAULT 'notifications-outline',
  xp_reward   INT         DEFAULT 0,
  claimed     BOOLEAN     NOT NULL DEFAULT FALSE,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: owner read" ON notifications;
CREATE POLICY "notifications: owner read"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications: owner update" ON notifications;
CREATE POLICY "notifications: owner update"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
