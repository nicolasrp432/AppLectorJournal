-- ─── Library covers: imagen de portada + bucket de Storage ───────────────────

-- 1. Columna opcional para la URL de portada (subida o externa).
ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS cover_url text;

-- 2. Bucket público de lectura para las portadas subidas por el usuario.
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage para el bucket 'covers'.
--    Lectura pública (las portadas se muestran en la biblioteca/lector);
--    escritura/borrado solo del dueño, bajo su carpeta {auth.uid()}/...
DROP POLICY IF EXISTS "covers: public read"   ON storage.objects;
DROP POLICY IF EXISTS "covers: owner insert"  ON storage.objects;
DROP POLICY IF EXISTS "covers: owner update"  ON storage.objects;
DROP POLICY IF EXISTS "covers: owner delete"  ON storage.objects;

CREATE POLICY "covers: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "covers: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "covers: owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "covers: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
