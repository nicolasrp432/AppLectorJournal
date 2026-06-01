/**
 * Utilidades de texto compartidas.
 *
 * Centralizar evita reimplementar el mismo parsing en varias pantallas y permite
 * usar una versión más liviana del conteo de palabras (una sola pasada, sin crear
 * un array intermedio gigante con todas las palabras del libro).
 */

/**
 * Cuenta palabras (secuencias de caracteres no-espacio) en una sola pasada.
 *
 * Equivale a `text.split(/\s+/).filter(Boolean).length` pero sin materializar el
 * array completo de palabras: para un libro de ~100k palabras eso evita asignar
 * (y luego recolectar) un array de 100k strings en el hilo de UI.
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Hash determinista y barato (djb2-like, 32-bit) → `h_<n>`.
 *
 * IMPORTANTE: la implementación debe permanecer byte-idéntica, porque su salida
 * se persiste como `text_slice_hash` en la caché de quizzes; cambiarla invalidaría
 * todas las entradas ya cacheadas.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash)}`;
}
