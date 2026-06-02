import { invokeEdgeFunction } from './supabase';
import { dedupe } from './taskQueue';
import { simpleHash } from './text';
import { useQuizCacheStore, QuizQuestion } from '../store/useQuizCacheStore';

export const MIN_QUIZ_WORDS = 40;

/**
 * Genera (o recupera de caché) preguntas de comprensión para un fragmento de
 * texto. Reutilizado por el lector (al terminar de leer) y por la biblioteca
 * (botón "Analizar con IA" / modo solo-quiz). Cachea por hash del fragmento en
 * `useQuizCacheStore` (y `custom_reading_quizzes`), así que regenerar un mismo
 * fragmento lo reemplaza y otros fragmentos quedan guardados.
 *
 * @param force  si es true, ignora la caché y vuelve a invocar a la IA.
 * @returns las preguntas, o [] si el texto es muy corto / no hay resultados.
 */
export async function ensureQuizForText(
  bookId: string,
  textSlice: string,
  count = 3,
  force = false,
): Promise<QuizQuestion[]> {
  const slice = (textSlice || '').trim();
  if (slice.split(/\s+/).filter(Boolean).length < MIN_QUIZ_WORDS) return [];

  const sliceHash = simpleHash(slice);
  const store = useQuizCacheStore.getState();

  if (!force) {
    await store.fetchQuizzes(bookId);
    const cached = store.getQuiz(bookId, sliceHash);
    if (cached?.questions?.length) return cached.questions;
  }

  // dedupe: si el mismo fragmento ya se está generando, comparte la promesa.
  const { data, error } = await dedupe(
    `ai-questions:${bookId}:${sliceHash}${force ? ':force' : ''}`,
    () => invokeEdgeFunction<{ questions: QuizQuestion[] }>('ai-questions', { text: slice, count }),
  );
  if (error) throw error;
  if (data?.questions?.length) {
    await store.insertQuiz(bookId, sliceHash, data.questions);
    return data.questions;
  }
  return [];
}

/** Toma una porción representativa del contenido para generar el quiz. */
export function quizSliceFromContent(content: string | null | undefined, maxWords = 600): string {
  if (!content) return '';
  const words = content.split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}
