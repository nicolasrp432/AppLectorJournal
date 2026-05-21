-- ============================================================
-- LectorApp Neuro-Journey — Flashcards Schema (SM-2)
-- ============================================================

-- ─── 1. decks ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  color           TEXT        NOT NULL DEFAULT '#22C55E',
  is_ai_generated BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decks_user_created ON decks (user_id, created_at DESC);
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks: owner read"
  ON decks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "decks: owner insert"
  ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "decks: owner update"
  ON decks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "decks: owner delete"
  ON decks FOR DELETE USING (auth.uid() = user_id);


-- ─── 2. flashcards ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id         UUID        NOT NULL REFERENCES decks ON DELETE CASCADE,
  front           TEXT        NOT NULL,
  back            TEXT        NOT NULL,
  hint            TEXT        NOT NULL DEFAULT '',
  interval        INT         NOT NULL DEFAULT 0,
  repetitions     INT         NOT NULL DEFAULT 0,
  ease_factor     FLOAT       NOT NULL DEFAULT 2.5,
  next_due        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flashcards_deck_due ON flashcards (deck_id, next_due ASC);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcards: owner read"
  ON flashcards FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks WHERE decks.id = flashcards.deck_id AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "flashcards: owner insert"
  ON flashcards FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks WHERE decks.id = flashcards.deck_id AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "flashcards: owner update"
  ON flashcards FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks WHERE decks.id = flashcards.deck_id AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "flashcards: owner delete"
  ON flashcards FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks WHERE decks.id = flashcards.deck_id AND decks.user_id = auth.uid()
    )
  );


-- ─── 3. flashcard_sessions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcard_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  deck_id         UUID        NOT NULL REFERENCES decks ON DELETE CASCADE,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cards_reviewed  INT         NOT NULL DEFAULT 0,
  xp_earned       INT         NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS flashcard_sessions_user ON flashcard_sessions (user_id, finished_at DESC);
ALTER TABLE flashcard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcard_sessions: owner read"
  ON flashcard_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "flashcard_sessions: owner insert"
  ON flashcard_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
