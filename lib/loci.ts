/**
 * Lógica pura del Método Loci (sin dependencias de UI), para poder testearla.
 *
 * Cubre el "recuerdo libre": el usuario escribe el ítem que colocó en cada
 * locus y comparamos con tolerancia (acentos, mayúsculas, plurales y pequeños
 * errores de tecleo) para no penalizar fallos triviales. Ver
 * `docs/PLAN_MEJORAS_Y_EJERCICIOS.md` (B2).
 */

/** Normaliza para comparar: minúsculas, sin acentos, sin signos, espacios colapsados. */
export function normalizeAnswer(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos (compatible con Hermes)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distancia de edición de Levenshtein entre dos cadenas. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // inserción
        prev[j] + 1,          // borrado
        prev[j - 1] + cost,   // sustitución
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * ¿La respuesta del usuario coincide razonablemente con el objetivo?
 * Acepta igualdad normalizada, contención (plurales/artículos) y pequeños
 * errores de tecleo proporcionales a la longitud de la palabra.
 */
export function matchesRecall(guess: string, target: string): boolean {
  const g = normalizeAnswer(guess);
  const t = normalizeAnswer(target);
  if (!g || !t) return false;
  if (g === t) return true;

  // Contención para palabras suficientemente largas (p.ej. "manzana" vs "la manzana").
  if (t.length >= 4 && (g.includes(t) || t.includes(g))) return true;

  // Tolerancia a erratas: 1 para palabras cortas, 2 para largas.
  const tolerance = t.length <= 4 ? 1 : 2;
  return levenshtein(g, t) <= tolerance;
}

export interface RecallGrade {
  correct: number;
  total: number;
  /** Aciertos / total, en [0,1]. */
  score: number;
  /** Resultado por posición (en el orden de `targets`). */
  results: boolean[];
}

/**
 * Califica un recuerdo libre.
 * @param guesses Respuestas del usuario (alineadas por posición con `targets`).
 * @param targets Ítems correctos en el orden del recorrido.
 * @param ordered Si `true`, cada respuesta debe coincidir con su posición
 *   (recorrido ordenado). Si `false`, basta con haber recordado el ítem en
 *   cualquier posición aún no consumida (recuerdo libre sin orden).
 */
export function gradeRecall(
  guesses: string[],
  targets: string[],
  ordered = true,
): RecallGrade {
  const total = targets.length;

  if (ordered) {
    const results = targets.map((t, i) => matchesRecall(guesses[i] ?? '', t));
    const correct = results.filter(Boolean).length;
    return { correct, total, score: total ? correct / total : 0, results };
  }

  // No ordenado: emparejamiento codicioso, cada objetivo se consume una vez.
  const used = new Array(total).fill(false);
  const results = guesses.slice(0, total).map((guess) => {
    const idx = targets.findIndex((t, i) => !used[i] && matchesRecall(guess, t));
    if (idx >= 0) {
      used[idx] = true;
      return true;
    }
    return false;
  });
  while (results.length < total) results.push(false);
  const correct = results.filter(Boolean).length;
  return { correct, total, score: total ? correct / total : 0, results };
}

/**
 * Mapea el `score` de un recuerdo ([0,1]) a la calidad SM-2 [0,5] que espera
 * `calculateSM2` (ver `lib/sm2.ts`). Los cortes son generosos en la parte alta
 * (recordar casi todo el palacio = respuesta sólida) y exigentes en la baja
 * (un recuerdo pobre reinicia el intervalo). Quality ≥ 3 cuenta como aprobado.
 */
export function scoreToQuality(score: number): number {
  const s = Math.max(0, Math.min(1, score));
  if (s >= 1) return 5;
  if (s >= 0.8) return 4;
  if (s >= 0.6) return 3;
  if (s >= 0.4) return 2;
  if (s >= 0.2) return 1;
  return 0;
}

/** ¿Toca repasar este palacio? (su próxima fecha programada ya venció). */
export function isDue(nextDue: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!nextDue) return true; // sin programación previa, conviene repasar.
  const due = nextDue instanceof Date ? nextDue : new Date(nextDue);
  if (Number.isNaN(due.getTime())) return true;
  return due.getTime() <= now.getTime();
}
