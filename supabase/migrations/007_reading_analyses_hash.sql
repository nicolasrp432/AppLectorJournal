-- ============================================================
-- 007 — Caché de análisis de lectura por hash de contenido (§6.E)
--      + índice faltante en loci_memories.palace_id (§6.H)
-- Ejecutar una vez: Dashboard → SQL Editor → pegar & Run.
-- ============================================================

-- ─── §6.E — reading_analyses por (library_item_id, text_slice_hash) ───
-- Antes la caché era UNIQUE solo por library_item_id, así que distintos
-- pasajes del mismo ítem compartían (erróneamente) el mismo análisis.
-- Ahora se cachea por hash del texto analizado, igual que custom_reading_quizzes.

ALTER TABLE public.reading_analyses
  ADD COLUMN IF NOT EXISTS text_slice_hash TEXT;

-- Reemplazar el índice único antiguo por uno compuesto.
DROP INDEX IF EXISTS uidx_reading_analyses_item;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_reading_analyses_item_slice
  ON public.reading_analyses(library_item_id, text_slice_hash);

-- La tabla 005 solo tenía política de SELECT pública: sin política de INSERT,
-- RLS bloqueaba las escrituras del cliente y la caché NUNCA se poblaba.
-- Añadimos INSERT público (consistente con custom_reading_quizzes).
DROP POLICY IF EXISTS "reading_analyses: public insert" ON public.reading_analyses;
CREATE POLICY "reading_analyses: public insert"
  ON public.reading_analyses FOR INSERT WITH CHECK (true);


-- ─── §6.H — índice faltante para loci_memories.palace_id ──────────────
-- useLociStore consulta con .in('palace_id', [...]) pero no había índice.

CREATE INDEX IF NOT EXISTS idx_loci_memories_palace
  ON public.loci_memories(palace_id);
