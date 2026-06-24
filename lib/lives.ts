/**
 * Lógica pura de regeneración de vidas de lectura (espejo cliente del RPC
 * 011_reading_lives.sql). El servidor es la fuente de verdad; estas funciones
 * sirven para fallbacks (usuario local/premium), cálculos optimistas y el
 * temporizador de la UI. Mantener en sincronía con la migración.
 */
import { MAX_READING_LIVES, LIFE_REGEN_MINUTES } from '../constants/lives';

export interface LivesState {
  /** Vidas disponibles tras aplicar la regeneración (0..MAX). */
  lives: number;
  /** Ancla del temporizador de regeneración (ISO). */
  updatedAt: string;
  /** Cuándo llega la próxima vida (ISO), o null si está lleno. */
  nextRegenAt: string | null;
}

const REGEN_MS = LIFE_REGEN_MINUTES * 60 * 1000;

/**
 * Regenera vidas de forma perezosa anclando el reloj, igual que el RPC.
 * No muta: devuelve el estado calculado.
 */
export function regenerate(
  lives: number,
  updatedAt: string | Date,
  now: Date = new Date(),
): LivesState {
  const upd = new Date(updatedAt);
  const regen = Math.floor((now.getTime() - upd.getTime()) / REGEN_MS);
  const cur = Math.min(MAX_READING_LIVES, lives + Math.max(0, regen));

  if (cur >= MAX_READING_LIVES) {
    return { lives: MAX_READING_LIVES, updatedAt: now.toISOString(), nextRegenAt: null };
  }
  const anchored = new Date(upd.getTime() + Math.max(0, regen) * REGEN_MS);
  return {
    lives: cur,
    updatedAt: anchored.toISOString(),
    nextRegenAt: new Date(anchored.getTime() + REGEN_MS).toISOString(),
  };
}

/** Milisegundos hasta la próxima vida (0 si está lleno o ya disponible). */
export function msToNextLife(nextRegenAt: string | null, now: Date = new Date()): number {
  if (!nextRegenAt) return 0;
  return Math.max(0, new Date(nextRegenAt).getTime() - now.getTime());
}

/** Formatea milisegundos restantes como "mm:ss" para la UI. */
export function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
