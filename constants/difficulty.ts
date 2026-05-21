import type {
  SchulteLevel, WordSpanLevel, LociLevel,
  ComprehensionLevel, ReadingLevel, BossLevel,
} from '../types/exercises';

export const DIFFICULTY = {
  schulte: [
    { level: 1, label: '3×3 Fácil',     size: 3, target_time: 12  },
    { level: 2, label: '4×4 Medio',     size: 4, target_time: 25  },
    { level: 3, label: '5×5 Estándar',  size: 5, target_time: 50, showQuadrantHint: true },
    { level: 4, label: '6×6 Difícil',   size: 6, target_time: 80, showQuadrantHint: true },
    { level: 5, label: '7×7 Experto',   size: 7, target_time: 130, showQuadrantHint: true, inverse: true },
  ] as SchulteLevel[],

  wordspan: [
    { level: 1, label: '4 palabras',          count: 4, show_ms: 1300 },
    { level: 2, label: '5 palabras',          count: 5, show_ms: 1200 },
    { level: 3, label: '6 palabras',          count: 6, show_ms: 1100 },
    { level: 4, label: '7 palabras rápido',   count: 7, show_ms: 900  },
    { level: 5, label: '9 palabras experto',  count: 9, show_ms: 800  },
  ] as WordSpanLevel[],

  loci: [
    { level: 1, label: '5 objetos', count: 5 },
    { level: 2, label: '6 objetos', count: 6 },
    { level: 3, label: '7 objetos', count: 7 },
    { level: 4, label: '8 objetos', count: 8 },
  ] as LociLevel[],

  comprehension: [
    { level: 1, label: 'Pasaje corto', length: 'short'  as const, q_count: 3 },
    { level: 2, label: 'Pasaje medio', length: 'medium' as const, q_count: 4 },
    { level: 3, label: 'Pasaje largo', length: 'long'   as const, q_count: 5 },
  ] as ComprehensionLevel[],

  reading: [
    { level: 1, label: '200 WPM',  wpm: 200 },
    { level: 2, label: '250 WPM',  wpm: 250 },
    { level: 3, label: '300 WPM',  wpm: 300 },
    { level: 4, label: '400 WPM',  wpm: 400 },
    { level: 5, label: '500+ WPM', wpm: 500 },
  ] as ReadingLevel[],

  boss: [
    { level: 1, label: 'Jefe Enfoque',   zone: 'focus'  },
    { level: 2, label: 'Jefe Memoria',   zone: 'memory' },
    { level: 3, label: 'Jefe Velocidad', zone: 'speed'  },
  ] as BossLevel[],

  freereading: [
    { level: 1, label: 'Pasaje corto',  length: 'short'  as const },
    { level: 2, label: 'Pasaje medio',  length: 'medium' as const },
    { level: 3, label: 'Pasaje largo',  length: 'long'   as const },
  ],
} as const;

export function getLevel<T extends keyof typeof DIFFICULTY>(
  exId: T,
  level: number,
): (typeof DIFFICULTY)[T][number] {
  const list = DIFFICULTY[exId] as readonly { level: number }[];
  const idx  = Math.max(0, Math.min(list.length - 1, level - 1));
  return list[idx] as (typeof DIFFICULTY)[T][number];
}
