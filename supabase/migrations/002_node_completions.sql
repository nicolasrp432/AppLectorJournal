-- ============================================================
-- LectorApp — Node Completions
-- Run via: Dashboard → SQL Editor → paste & Run
-- ============================================================

CREATE TABLE IF NOT EXISTS node_completions (
  user_id      UUID        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  node_id      TEXT        NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, node_id)
);

CREATE INDEX node_completions_user ON node_completions (user_id);

ALTER TABLE node_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "node_completions: owner read"
  ON node_completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "node_completions: owner insert"
  ON node_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "node_completions: owner upsert"
  ON node_completions FOR UPDATE USING (auth.uid() = user_id);
