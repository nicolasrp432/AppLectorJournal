import type { ExerciseId } from '../types/db';
import { DIFFICULTY, thresholdsFor } from '../constants/difficulty';

export interface AdaptResult {
  /** Nivel resultante tras (posiblemente) adaptar. */
  newLevel: number;
  /** Mastery resultante en [0,1] — ya clampeado y reseteado si cambió de nivel. */
  newMastery: number;
  /** Variación aplicada al mastery en este intento (telemetría / compatibilidad). */
  masteryDelta: number;
  reason: 'up' | 'down' | 'hold';
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Mastery con el que arranca un nivel recién alcanzado (pequeña ventaja). */
const FRESH_LEVEL_MASTERY = 0.1;
/** Con este mastery o más, un único intento fuerte basta para subir (confianza). */
const CONFIDENT_MASTERY = 0.6;

/**
 * Motor de dificultad adaptativa.
 *
 * Reglas de diseño (ver `docs/PLAN_MEJORAS_Y_EJERCICIOS.md`, B1):
 * - **Confirmación / histéresis**: no se sube por un único intento afortunado.
 *   Se sube si hay dos resultados "buenos" consecutivos, o uno bueno cuando el
 *   mastery ya es alto. Se baja solo con dos resultados "pobres" consecutivos
 *   (no se castiga un mal día aislado).
 * - **Umbrales por ejercicio** (`thresholdsFor`), no globales.
 * - **`mastery` se usa de verdad**: acumula confianza dentro del nivel y se
 *   resetea al cambiar de nivel.
 *
 * @param exId        Ejercicio.
 * @param score       Score del intento actual, en [0,1].
 * @param currentLevel Nivel actual (1-based).
 * @param mastery     Mastery actual en [0,1].
 * @param prevScore   Score del intento anterior (p.ej. `prog.last_score`); `null`
 *                    si no hay historial todavía.
 */
export function adaptLevel(
  exId: ExerciseId,
  score: number,
  currentLevel: number,
  mastery = 0,
  prevScore: number | null = null,
): AdaptResult {
  // Flashcards usa su propio motor (SM-2); aquí no se adapta el nivel.
  if (exId === ('flashcards' as ExerciseId)) {
    return { newLevel: 1, newMastery: clamp01(mastery), masteryDelta: 0, reason: 'hold' };
  }

  const s = clamp01(score);
  const max = (DIFFICULTY as Record<string, readonly unknown[]>)[exId]?.length || 1;
  const { up, down } = thresholdsFor(exId);

  // Variación de mastery del intento (acumulador de confianza en el nivel).
  let masteryDelta: number;
  if (s >= up) masteryDelta = +0.15;
  else if (s >= 0.7) masteryDelta = +0.05;
  else if (s < down) masteryDelta = -0.10;
  else masteryDelta = 0;

  const goodNow = s >= up;
  const goodPrev = prevScore != null && clamp01(prevScore) >= up;
  const poorNow = s < down;
  const poorPrev = prevScore != null && clamp01(prevScore) < down;
  const confident = mastery >= CONFIDENT_MASTERY;

  // Subir: requiere confirmación (dos buenos seguidos) o confianza ya consolidada.
  if (goodNow && currentLevel < max && (goodPrev || confident)) {
    return { newLevel: currentLevel + 1, newMastery: FRESH_LEVEL_MASTERY, masteryDelta, reason: 'up' };
  }

  // Bajar: requiere dos pobres consecutivos (no castigar un único mal intento).
  if (poorNow && poorPrev && currentLevel > 1) {
    return { newLevel: currentLevel - 1, newMastery: FRESH_LEVEL_MASTERY, masteryDelta, reason: 'down' };
  }

  // Mantener: el mastery evoluciona dentro del nivel.
  return {
    newLevel: currentLevel,
    newMastery: clamp01(mastery + masteryDelta),
    masteryDelta,
    reason: 'hold',
  };
}
