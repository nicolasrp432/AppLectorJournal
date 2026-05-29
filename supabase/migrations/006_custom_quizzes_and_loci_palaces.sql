-- 1. Tabla para caché de preguntas de comprensión con IA
CREATE TABLE IF NOT EXISTS public.custom_reading_quizzes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id TEXT        REFERENCES public.library_items(id) ON DELETE CASCADE,
  text_slice_hash TEXT        NOT NULL,
  questions       JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_quiz_cache_item_slice ON public.custom_reading_quizzes(library_item_id, text_slice_hash);
ALTER TABLE public.custom_reading_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_reading_quizzes: owner select" ON public.custom_reading_quizzes FOR SELECT USING (true);
CREATE POLICY "custom_reading_quizzes: owner insert" ON public.custom_reading_quizzes FOR INSERT WITH CHECK (true);

-- 2. Tabla de Palacios de Memoria del Usuario
CREATE TABLE IF NOT EXISTS public.user_memory_palaces (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic           TEXT        NOT NULL, -- Ej: "Leyes de Newton"
  theme           TEXT        NOT NULL DEFAULT 'casa', -- casa, oficina, naturaleza
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_memory_palaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_memory_palaces: owner select" ON public.user_memory_palaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_memory_palaces: owner insert" ON public.user_memory_palaces FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Añadir palace_id a loci_memories
ALTER TABLE public.loci_memories ADD COLUMN IF NOT EXISTS palace_id UUID REFERENCES public.user_memory_palaces(id) ON DELETE CASCADE;
