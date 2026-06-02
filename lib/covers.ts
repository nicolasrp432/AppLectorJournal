import { supabase } from './supabase';

/**
 * Busca una portada por título en Open Library (gratuito, sin API key).
 * Devuelve una URL de imagen o null si no hay coincidencia / sin red.
 */
export async function searchCoverByTitle(title: string): Promise<string | null> {
  const q = (title || '').trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=5`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const doc = (json.docs || []).find((d: any) => d.cover_i);
    if (!doc?.cover_i) return null;
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  } catch {
    return null; // degrada en silencio (se mantiene el color de portada)
  }
}

/**
 * Sube una imagen local (uri de expo-image-picker) al bucket público `covers`
 * bajo `{userId}/{itemId}` y devuelve su URL pública. Requiere sesión (userId
 * real). Devuelve null si falla (offline / sin sesión) para degradar al color.
 */
export async function uploadCover(
  userId: string,
  itemId: string,
  uri: string,
): Promise<string | null> {
  if (!userId || userId === 'local') return null;
  try {
    const blob = await (await fetch(uri)).blob();
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    const path = `${userId}/${itemId}.${ext}`;
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const { error } = await supabase.storage.from('covers').upload(path, arrayBuffer, {
      contentType: blob.type || 'image/jpeg',
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}
