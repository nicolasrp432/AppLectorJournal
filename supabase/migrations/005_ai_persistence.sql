-- Tabla para caché de análisis de lectura
CREATE TABLE IF NOT EXISTS public.reading_analyses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id TEXT        REFERENCES public.library_items(id) ON DELETE CASCADE,
  difficulty      TEXT        NOT NULL CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  suggested_wpm   INT         NOT NULL DEFAULT 280,
  explanation     TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_reading_analyses_item ON public.reading_analyses(library_item_id);
ALTER TABLE public.reading_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_analyses: public read" ON public.reading_analyses FOR SELECT USING (true);

-- Tabla para guardar escenas e imágenes del Palacio de la Memoria (Loci)
CREATE TABLE IF NOT EXISTS public.loci_memories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room            TEXT        NOT NULL,
  item            TEXT        NOT NULL,
  story           TEXT        NOT NULL,
  image_url       TEXT        , -- Almacenará la URI base64 o link de almacenamiento
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loci_memories_user ON public.loci_memories(user_id);
ALTER TABLE public.loci_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loci_memories: owner read" ON public.loci_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loci_memories: owner insert" ON public.loci_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
