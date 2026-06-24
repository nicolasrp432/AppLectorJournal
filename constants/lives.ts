// Sistema de vidas/energía para ejercicios de lectura (v1).
// La lógica autoritativa vive en RPCs server-side (011_reading_lives.sql); estas
// constantes solo gobiernan el comportamiento del cliente (UI, fallbacks, gating).

import type { ExerciseId } from '../types/db';

/** Flag de rollout: permite activar/desactivar el sistema sin redeploy. */
export const LIVES_ENABLED = true;

/** Vidas máximas que puede acumular un usuario. Debe coincidir con el CHECK de la migración. */
export const MAX_READING_LIVES = 5;

/** Minutos que tarda en regenerarse 1 vida. Debe coincidir con el RPC. */
export const LIFE_REGEN_MINUTES = 30;

/** Comprensión mínima (0..1) que devuelve 1 vida al terminar una lectura. */
export const REFUND_COMPREHENSION_THRESHOLD = 0.8;

/** Factor de XP cuando se juega en modo práctica (sin vidas). */
export const PRACTICE_MODE_XP_FACTOR = 0.3;

/** Ejercicios (ids de pantalla) regidos por vidas en lugar del límite diario. */
export const READING_EXERCISE_IDS = new Set<ExerciseId>([
  'reading',
  'freereading',
  'comprehension',
  'reading_test',
]);

/** True si el ejercicio se rige por vidas de lectura. */
export function isReadingExercise(exerciseId: string): boolean {
  return READING_EXERCISE_IDS.has(exerciseId as ExerciseId);
}
