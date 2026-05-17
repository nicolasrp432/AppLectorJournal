-- ============================================================
-- LectorApp Neuro-Journey — Initial Schema
-- Run once against your Supabase project via:
--   Dashboard → SQL Editor → paste & Run
-- ============================================================

-- ─── 1. Custom ENUM types ────────────────────────────────────

CREATE TYPE mascot_key    AS ENUM ('focus','calm','joy','swift','memo','loci','boss');
CREATE TYPE exercise_id   AS ENUM ('schulte','reading','wordspan','loci','comprehension','boss');
CREATE TYPE library_kind  AS ENUM ('book','text');
CREATE TYPE library_source AS ENUM ('catalog','custom','imported');
CREATE TYPE font_family   AS ENUM ('Lexend','Nunito','Georgia');


-- ─── 2. profiles ─────────────────────────────────────────────
-- Mirrors auth.users 1-to-1. Created automatically by trigger.

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT,
  avatar      mascot_key  NOT NULL DEFAULT 'focus',
  bio         TEXT        NOT NULL DEFAULT 'Aprendiendo a leer mejor cada día',
  level       INT         NOT NULL DEFAULT 1  CHECK (level >= 1),
  xp          INT         NOT NULL DEFAULT 0  CHECK (xp >= 0),
  streak      INT         NOT NULL DEFAULT 0  CHECK (streak >= 0),
  last_active TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner read"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Insert is handled only by the trigger (SECURITY DEFINER), so no INSERT policy needed.


-- ─── 3. sessions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  exercise_id   exercise_id NOT NULL,
  level         INT         NOT NULL DEFAULT 1,
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score         FLOAT       NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 1),
  errors        INT         NOT NULL DEFAULT 0 CHECK (errors >= 0),
  time_seconds  FLOAT       NOT NULL DEFAULT 0,
  wpm           FLOAT,
  comprehension FLOAT                          CHECK (comprehension BETWEEN 0 AND 1),
  xp_earned     INT         NOT NULL DEFAULT 0
);

CREATE INDEX sessions_user_finished ON sessions (user_id, finished_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: owner read"
  ON sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions: owner insert"
  ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─── 4. exercise_progress ────────────────────────────────────

CREATE TABLE IF NOT EXISTS exercise_progress (
  user_id       UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  exercise_id   exercise_id NOT NULL,
  current_level INT         NOT NULL DEFAULT 1  CHECK (current_level >= 1),
  best_score    FLOAT       NOT NULL DEFAULT 0  CHECK (best_score BETWEEN 0 AND 1),
  last_score    FLOAT       NOT NULL DEFAULT 0  CHECK (last_score BETWEEN 0 AND 1),
  total_sessions INT        NOT NULL DEFAULT 0  CHECK (total_sessions >= 0),
  mastery       FLOAT       NOT NULL DEFAULT 0  CHECK (mastery BETWEEN 0 AND 1),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_progress: owner read"
  ON exercise_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "exercise_progress: owner upsert"
  ON exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_progress: owner update"
  ON exercise_progress FOR UPDATE USING (auth.uid() = user_id);


-- ─── 5. library_items ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_items (
  id          TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id     UUID           NOT NULL REFERENCES profiles ON DELETE CASCADE,
  kind        library_kind   NOT NULL DEFAULT 'book',
  title       TEXT           NOT NULL,
  author      TEXT,
  content     TEXT,
  words       INT            NOT NULL DEFAULT 0,
  progress    FLOAT          NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  last_read_at TIMESTAMPTZ,
  cover_color TEXT           NOT NULL DEFAULT '#22C55E',
  source      library_source NOT NULL DEFAULT 'custom',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX library_items_user ON library_items (user_id, created_at DESC);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_items: owner read"
  ON library_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "library_items: owner insert"
  ON library_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "library_items: owner update"
  ON library_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "library_items: owner delete"
  ON library_items FOR DELETE USING (auth.uid() = user_id);


-- ─── 6. user_prefs ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_prefs (
  user_id               UUID        PRIMARY KEY REFERENCES profiles ON DELETE CASCADE,
  wpm_default           INT         NOT NULL DEFAULT 280,
  font_family           font_family NOT NULL DEFAULT 'Lexend',
  font_size             INT         NOT NULL DEFAULT 16,
  theme_color           TEXT        NOT NULL DEFAULT '#22C55E',
  dyslexia_font         BOOLEAN     NOT NULL DEFAULT FALSE,
  high_contrast         BOOLEAN     NOT NULL DEFAULT FALSE,
  reduce_motion         BOOLEAN     NOT NULL DEFAULT FALSE,
  daily_xp_goal         INT         NOT NULL DEFAULT 200,
  daily_minutes_goal    INT         NOT NULL DEFAULT 15,
  daily_exercises_goal  INT         NOT NULL DEFAULT 3,
  notifications_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  notifications_time    TEXT        NOT NULL DEFAULT '20:00',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prefs: owner read"
  ON user_prefs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_prefs: owner upsert"
  ON user_prefs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_prefs: owner update"
  ON user_prefs FOR UPDATE USING (auth.uid() = user_id);


-- ─── 7. owned_rewards ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owned_rewards (
  user_id     UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  reward_id   TEXT        NOT NULL,
  equipped    BOOLEAN     NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reward_id)
);

ALTER TABLE owned_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owned_rewards: owner read"
  ON owned_rewards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owned_rewards: owner insert"
  ON owned_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owned_rewards: owner update"
  ON owned_rewards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "owned_rewards: owner delete"
  ON owned_rewards FOR DELETE USING (auth.uid() = user_id);


-- ─── 8. Trigger: auto-provision new user ─────────────────────
-- Fires after every Supabase auth.signUp() call.
-- Creates profile, prefs, starting exercise progress, and free rewards.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name TEXT;
BEGIN
  -- Prefer the name sent via signUp options.data, fall back to email prefix
  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Profile
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, _name, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Default prefs
  INSERT INTO user_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Starting exercise progress (level 1, blank slate)
  INSERT INTO exercise_progress (user_id, exercise_id)
  VALUES
    (NEW.id, 'schulte'),
    (NEW.id, 'reading'),
    (NEW.id, 'wordspan'),
    (NEW.id, 'loci'),
    (NEW.id, 'comprehension'),
    (NEW.id, 'boss')
  ON CONFLICT DO NOTHING;

  -- Free starter rewards
  INSERT INTO owned_rewards (user_id, reward_id, equipped)
  VALUES
    (NEW.id, 'theme-green',  TRUE),
    (NEW.id, 'avatar-focus', TRUE)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── 9. Helper function: update streak ───────────────────────
-- Call from the client after finishing an exercise session.
-- Increments streak if last_active was yesterday; resets to 1 if gap > 1 day.

CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_active DATE;
  _today       DATE := CURRENT_DATE;
BEGIN
  SELECT last_active::DATE INTO _last_active FROM profiles WHERE id = p_user_id;

  IF _last_active IS NULL OR _last_active < _today - INTERVAL '1 day' THEN
    -- Gap of more than 1 day → reset streak
    UPDATE profiles SET streak = 1, last_active = NOW() WHERE id = p_user_id;
  ELSIF _last_active = _today - INTERVAL '1 day' THEN
    -- Consecutive day → increment
    UPDATE profiles SET streak = streak + 1, last_active = NOW() WHERE id = p_user_id;
  ELSE
    -- Same day → just update last_active timestamp
    UPDATE profiles SET last_active = NOW() WHERE id = p_user_id;
  END IF;
END;
$$;
