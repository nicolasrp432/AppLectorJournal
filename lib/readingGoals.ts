/**
 * Objetivos de lectura — entrenamiento metacognitivo.
 *
 * POR QUÉ EXISTE
 * --------------
 * La app entrena velocidad con RSVP (una palabra a la vez, hasta 800 WPM), y la
 * evidencia es bastante dura con ese enfoque: las revisiones de Rayner et al.
 * (2016) y el trabajo sobre apps de lectura rápida encuentran que por encima de
 * ~500 WPM la comprensión cae por debajo del 50% en textos complejos, porque los
 * movimientos oculares suponen como mucho un 10% del tiempo de lectura. Subir el
 * WPM sin más no enseña a leer mejor: enseña a pasar páginas.
 *
 * Klimovich, Tiffin-Richards y Richter (2023, Journal of Research in Reading)
 * compararon entrenamiento de lectura rápida contra entrenamiento *metacognitivo*
 * —fijar un objetivo antes de leer— y encontraron que el segundo lograba mejoras
 * de velocidad equivalentes, sin pérdida de comprensión y con bastante menos
 * tiempo de entrenamiento. El mecanismo no es mover el ojo más rápido: es
 * recalibrar el umbral de auto-monitorización, reduciendo las regresiones
 * innecesarias sin eliminar las útiles.
 *
 * Por eso el objetivo no es decorativo. Cambia el WPM sugerido, el tipo de
 * preguntas que se enfatizan y el listón de comprensión, y al terminar se
 * compara lo que el usuario se propuso con lo que logró (calibración), que es
 * justamente el bucle que produce el efecto.
 */

export type ReadingGoalId = 'gist' | 'scan' | 'study';

/** Qué tipo de pregunta pesa más al evaluar según el objetivo declarado. */
export type QuestionEmphasis = 'main_idea' | 'detail' | 'inference';

export interface ReadingGoal {
  id: ReadingGoalId;
  label: string;
  /** Instrucción concreta; la vaguedad ("lee bien") no recalibra nada. */
  prompt: string;
  icon: string;
  /** Multiplicador sobre el WPM base del nivel. */
  wpmFactor: number;
  emphasis: QuestionEmphasis;
  /** Comprensión (0..1) que cuenta como objetivo cumplido. */
  passThreshold: number;
}

export const READING_GOALS: ReadingGoal[] = [
  {
    id: 'gist',
    label: 'Captar la idea',
    prompt: 'Quédate con la tesis principal. Puedes soltar los detalles.',
    icon: 'eye-outline',
    wpmFactor: 1.3,
    emphasis: 'main_idea',
    // Barrer acepta perder detalle: exigir 80% aquí sería contradecir el objetivo.
    passThreshold: 0.6,
  },
  {
    id: 'scan',
    label: 'Buscar datos',
    prompt: 'Localiza nombres, cifras y fechas concretas.',
    icon: 'search-outline',
    wpmFactor: 1.15,
    emphasis: 'detail',
    passThreshold: 0.7,
  },
  {
    id: 'study',
    label: 'Estudiar a fondo',
    prompt: 'Vas a tener que explicárselo a alguien. Entiende el porqué.',
    icon: 'school-outline',
    // Estudiar debe ir *más lento* que la velocidad base. Es el caso donde la
    // app antes empujaba en la dirección equivocada.
    wpmFactor: 0.85,
    emphasis: 'inference',
    passThreshold: 0.8,
  },
];

export const DEFAULT_GOAL_ID: ReadingGoalId = 'study';

export function getGoal(id: ReadingGoalId | null | undefined): ReadingGoal {
  return READING_GOALS.find(g => g.id === id) ?? READING_GOALS[2];
}

/** WPM sugerido para un objetivo, redondeado a múltiplos de 10 y acotado. */
export function wpmForGoal(baseWpm: number, goalId: ReadingGoalId | null | undefined): number {
  const goal = getGoal(goalId);
  const raw = baseWpm * goal.wpmFactor;
  // Techo en 600: por encima la comprensión se desploma y estaríamos entrenando
  // a pasar páginas, no a leer.
  const bounded = Math.max(120, Math.min(600, raw));
  return Math.round(bounded / 10) * 10;
}

export type CalibrationVerdict = 'on_target' | 'over_confident' | 'under_confident';

export interface Calibration {
  verdict: CalibrationVerdict;
  /** Mensaje para el usuario, en segunda persona. */
  message: string;
  met: boolean;
}

/**
 * Compara la intención declarada con el resultado real.
 *
 * Este feedback es el ingrediente activo: sin él, elegir un objetivo es un
 * clic más. Con él, el usuario aprende a estimar su propia comprensión, que es
 * lo que reduce las regresiones improductivas.
 */
export function calibrate(
  goalId: ReadingGoalId | null | undefined,
  comprehension: number,
  actualWpm: number,
  targetWpm: number,
): Calibration {
  const goal = getGoal(goalId);
  const met = comprehension >= goal.passThreshold;
  const wentFast = actualWpm > targetWpm * 1.15;

  if (met && !wentFast) {
    return {
      verdict: 'on_target',
      met: true,
      message: `Objetivo "${goal.label}" cumplido a ${Math.round(actualWpm)} WPM.`,
    };
  }

  if (!met && wentFast) {
    return {
      verdict: 'over_confident',
      met: false,
      message: `Fuiste a ${Math.round(actualWpm)} WPM, por encima de tu objetivo, y la comprensión se resintió. Baja el ritmo en el próximo intento.`,
    };
  }

  if (!met) {
    return {
      verdict: 'over_confident',
      met: false,
      message: `No alcanzaste el listón de "${goal.label}". Releer una frase clave cuesta menos que perder el hilo entero.`,
    };
  }

  // Cumplió el objetivo yendo más rápido de lo previsto: puede subir el listón.
  return {
    verdict: 'under_confident',
    met: true,
    message: `Cumpliste el objetivo a ${Math.round(actualWpm)} WPM, más rápido de lo previsto. Puedes exigirte un objetivo más duro.`,
  };
}
