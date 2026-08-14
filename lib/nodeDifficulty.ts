/**
 * Dificultad efectiva de un nodo de la ruta.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * Cada nodo de `ruta.tsx` lleva un `level` fijo y se pasaba como `?level=N` a
 * `/exercise/[id]`, donde `pinnedLevel` tenía prioridad absoluta sobre
 * `prog.current_level`. Resultado: el motor adaptativo (`lib/adaptLevel.ts`)
 * subía y bajaba el nivel del usuario, pero la ruta lo ignoraba por completo.
 * Un usuario que dominaba Schulte seguía repitiendo "Schulte 3×3" para siempre,
 * y rejugar un nodo ya superado no ofrecía ningún reto nuevo.
 *
 * MODELO
 * ------
 * El nivel del nodo pasa a ser un **suelo curricular**, no un techo:
 *
 *   - Es el mínimo garantizado: la ruta está diseñada para introducir conceptos
 *     en cierto orden y un principiante debe verlos en ese orden.
 *   - Si el usuario ya rinde por encima, el nodo se sirve más difícil, con un
 *     tope para que la subida sea gradual y no un muro (evita el salto de 3×3 a
 *     7×7 de golpe, que es la forma más rápida de que alguien abandone).
 *   - Rejugar un nodo ya completado permite un empujón mayor: es el patrón de
 *     "repaso reforzado" de Duolingo, y da valor a volver sobre lo ya hecho.
 */

/** Empuje máximo sobre el nivel del nodo la primera vez que se juega. */
export const MAX_BOOST_FIRST_PLAY = 1;

/** Empuje máximo al rejugar un nodo ya completado (repaso reforzado). */
export const MAX_BOOST_REPLAY = 2;

export interface NodeDifficultyInput {
  /** Nivel de diseño del nodo en la ruta. Actúa de suelo. */
  nodeLevel: number;
  /** Nivel adaptativo actual del usuario para ese ejercicio. */
  adaptiveLevel: number;
  /** true si el usuario ya completó este nodo antes. */
  completed: boolean;
  /** Niveles disponibles en `constants/difficulty.ts` para ese ejercicio. */
  maxLevel: number;
}

export interface NodeDifficulty {
  /** Nivel con el que arrancar el ejercicio. */
  level: number;
  /** Cuánto se subió respecto al nivel de diseño (0 = sin empuje). */
  boost: number;
  /** true si el tope de empuje recortó el nivel adaptativo del usuario. */
  cappedByBoost: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Calcula con qué nivel debe abrirse un nodo.
 *
 * Nunca devuelve menos que `nodeLevel` (el suelo curricular se respeta aunque
 * el usuario haya bajado de nivel por una mala racha: la ruta enseña un
 * contenido concreto y saltárselo rompería la progresión).
 */
export function resolveNodeDifficulty(input: NodeDifficultyInput): NodeDifficulty {
  const { nodeLevel, adaptiveLevel, completed, maxLevel } = input;

  const floor = Math.max(1, nodeLevel);
  const maxBoost = completed ? MAX_BOOST_REPLAY : MAX_BOOST_FIRST_PLAY;
  const ceiling = Math.min(maxLevel, floor + maxBoost);

  const level = clamp(adaptiveLevel, floor, ceiling);

  return {
    level,
    boost: level - floor,
    // Solo cuenta como recorte si fue el tope de empuje —y no el máximo del
    // ejercicio— quien limitó al usuario; si ya está en el nivel más alto
    // disponible no hay nada que recortar.
    cappedByBoost: adaptiveLevel > ceiling && ceiling < maxLevel,
  };
}

/** Etiqueta corta para la UI del nodo. Devuelve null si no hay empuje que anunciar. */
export function boostLabel(d: NodeDifficulty): string | null {
  if (d.boost <= 0) return null;
  return d.boost === 1 ? 'Adaptado a tu nivel' : 'Reto reforzado';
}
