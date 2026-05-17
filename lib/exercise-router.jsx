// Exercise registry — metadata for every exercise
// Used by PathScreen nodes and ExerciseRouter to display intro/launch

const EXERCISES = {
  schulte: {
    id: 'schulte',
    title: 'Tabla de Schulte',
    category: 'Enfoque',
    mascot: 'focus',
    color: '#22C55E',
    xp: 40,
    duration: '2 min',
    difficulty: 'Fácil',
    improves: 'Campo visual',
    demo: 'schulte',
    description: 'Entrena tu visión periférica. Encuentra los números del 1 al 25 sin mover los ojos.',
    whyEffective: 'Al obligar a tu cerebro a detectar números con la vista periférica, expandes el "tramo útil de fijación". Lectores rápidos capturan 3-5 palabras por golpe de vista; principiantes, solo 1-2. Este ejercicio ataca exactamente ese límite.',
    steps: [
      'Fija la mirada en el centro de la cuadrícula',
      'Localiza los números en orden ascendente',
      'Toca cada número tan rápido como puedas',
    ],
  },
  reading: {
    id: 'reading',
    title: 'Lectura Focal',
    category: 'Velocidad',
    mascot: 'swift',
    color: '#F97316',
    xp: 60,
    duration: '3 min',
    difficulty: 'Medio',
    improves: 'WPM',
    demo: 'rsvp',
    description: 'Swift te guiará palabra por palabra a la velocidad objetivo. Mantén la vista fija en el punto central.',
    whyEffective: 'La lectura tradicional pierde tiempo en regresiones y subvocalización. Al presentar una palabra a la vez en el mismo punto, eliminas el movimiento ocular y entrenas al cerebro a reconocer formas más rápido. La velocidad se vuelve un hábito mental.',
    steps: [
      'Elige tu velocidad objetivo en WPM',
      'Mira el punto central, deja que las palabras pasen',
      'No regreses la vista — confía en el ritmo',
    ],
  },
  wordspan: {
    id: 'wordspan',
    title: 'Word Span',
    category: 'Memoria',
    mascot: 'calm',
    color: '#3B82F6',
    xp: 50,
    duration: '2 min',
    difficulty: 'Medio',
    improves: 'Memoria corta',
    demo: 'wordspan',
    description: 'Memoriza una secuencia de palabras y recupéralas en el mismo orden.',
    whyEffective: 'La memoria de trabajo es el cuello de botella de la lectura: si no retienes las palabras anteriores, pierdes el hilo del sentido. Ampliar tu span de palabras se traduce directamente en mejor comprensión, especialmente en frases largas.',
    steps: [
      'Observa cada palabra mientras se muestra',
      'Construye asociaciones mentales entre ellas',
      'Selecciónalas en el orden correcto',
    ],
  },
  loci: {
    id: 'loci',
    title: 'Método Loci',
    category: 'Memoria',
    mascot: 'loci',
    color: '#8B5CF6',
    xp: 70,
    duration: '4 min',
    difficulty: 'Difícil',
    improves: 'Memoria espacial',
    demo: 'loci',
    description: 'La técnica más poderosa: asocia objetos con habitaciones de una casa mental.',
    whyEffective: 'El cerebro evolucionó para recordar lugares, no listas. Anclar información en espacios familiares activa el hipocampo y crea recuerdos mucho más duraderos. Campeones de memoria mundial usan exactamente esta técnica.',
    steps: [
      'Aprende qué objeto va en cada habitación',
      'Visualiza cada asociación vívidamente',
      'Recuerda dónde pusiste cada objeto',
    ],
  },
  comprehension: {
    id: 'comprehension',
    title: 'Comprensión Lectora',
    category: 'Comprensión',
    mascot: 'joy',
    color: '#EAB308',
    xp: 55,
    duration: '4 min',
    difficulty: 'Medio',
    improves: 'Comprensión',
    demo: 'comprehension',
    description: 'Lee un pasaje y responde preguntas para medir tu comprensión real.',
    whyEffective: 'Leer rápido sin comprender es solo pasar los ojos por el papel. Las preguntas después del texto te obligan a leer con propósito, identificar ideas clave y conectar detalles. Esa intención cambia cómo procesa tu cerebro.',
    steps: [
      'Lee el pasaje a tu ritmo natural',
      'Identifica ideas principales y detalles',
      'Responde preguntas sin volver al texto',
    ],
  },
  boss: {
    id: 'boss',
    title: 'Jefe de Zona',
    category: 'Evaluación',
    mascot: 'focus',
    color: '#DC2626',
    xp: 150,
    duration: '6 min',
    difficulty: 'Difícil',
    improves: 'Todo',
    demo: 'boss',
    description: 'Tres rondas de velocidad, memoria y comprensión. Derrota al jefe para desbloquear la siguiente zona.',
    whyEffective: 'Combinar varias habilidades bajo presión es lo que más se parece a leer en el mundo real: mantener la velocidad, recordar lo que ya leíste y comprender el todo. El jefe pone a prueba la integración, no solo las partes.',
    steps: [
      'Ronda 1: velocidad — lee tan rápido como puedas',
      'Ronda 2: memoria — retén una secuencia',
      'Ronda 3: comprensión — responde correctamente',
    ],
  },
};

// Router — picks exercise screen by id and handles intro → play → result flow
function ExerciseRouter({ exerciseId, onExit, theme, config }) {
  const exercise = EXERCISES[exerciseId];
  const [phase, setPhase] = React.useState('intro'); // intro | playing | result
  const [result, setResult] = React.useState(null);
  // Intensity state — defaulted per exercise; live-editable on intro from dashboard
  const [intensity, setIntensity] = React.useState(() => {
    switch (exerciseId) {
      case 'schulte': return { size: 5 };
      case 'wordspan': return { level: 6, showMs: 1100, distractors: 4 };
      case 'loci': return { count: 5, studyMs: 4000 };
      case 'reading': return { wpm: 320, mode: config?.mode || 'rsvp' };
      case 'comprehension': return { length: 'medium' };
      case 'boss': return { bossLevel: 'normal' };
      default: return {};
    }
  });

  if (!exercise) return null;
  const fromDashboard = !!config?.fromDashboard;

  // Persist session + adapt level when result is set
  const saveSession = (raw, finalResult) => {
    if (typeof supa === 'undefined') return;
    const prog = supa.progress.get(exerciseId);
    const score = finalResult.passed ? 0.9 : 0.45;
    supa.sessions.insert({
      exercise_id: exerciseId,
      level: prog.current_level,
      score,
      time_seconds: raw.time || 0,
      wpm: raw.wpm || null,
      comprehension: raw.comprehension || null,
    });
    const adapt = adaptLevel(exerciseId, score, prog.current_level, prog.mastery);
    supa.progress.update(exerciseId, {
      current_level: adapt.newLevel,
      best_score: Math.max(prog.best_score || 0, score),
      total_sessions: (prog.total_sessions || 0) + 1,
      mastery: Math.max(0, Math.min(1, (prog.mastery || 0) + adapt.masteryDelta)),
      last_score: score,
    });
  };

  const handleFinish = (raw) => {
    // Build result object depending on exercise type
    let r;
    if (exerciseId === 'schulte') {
      const passed = raw.errors < 3;
      r = {
        passed,
        headline: passed ? `${raw.size}×${raw.size} dominado` : null,
        xpEarned: passed ? exercise.xp : Math.floor(exercise.xp / 3),
        stats: [
          { icon: 'clock', value: raw.time.toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
          { icon: 'target', value: raw.size * raw.size, unit: '', label: 'Celdas', color: exercise.color },
          { icon: 'x', value: raw.errors, unit: '', label: 'Errores', color: '#EF4444' },
          { icon: 'gauge', value: ((raw.size * raw.size) / raw.time).toFixed(1), unit: '/s', label: 'Ritmo', color: '#F97316' },
        ],
        insight: passed ? 'Tu visión periférica está ampliándose. Prueba un 5×5 la próxima.' : 'Fija más la vista en el centro. Menos saltos oculares = más velocidad.',
      };
    } else if (exerciseId === 'wordspan') {
      const passed = raw.correct >= raw.total - 1;
      r = {
        passed,
        headline: passed ? 'Memoria afilada' : null,
        xpEarned: Math.floor(exercise.xp * (raw.correct / raw.total)),
        stats: [
          { icon: 'check', value: raw.correct, unit: `/${raw.total}`, label: 'Correctas', color: '#22C55E' },
          { icon: 'clock', value: raw.time.toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Intenta crear una historia que conecte las palabras en orden.' : 'Agrupa las palabras en bloques de 3 — es más fácil retener.',
      };
    } else if (exerciseId === 'loci') {
      const passed = raw.correct === raw.total;
      r = {
        passed,
        headline: passed ? 'Palacio mental activado' : null,
        xpEarned: Math.floor(exercise.xp * (raw.correct / raw.total)),
        stats: [
          { icon: 'check', value: raw.correct, unit: `/${raw.total}`, label: 'Aciertos', color: '#22C55E' },
          { icon: 'clock', value: raw.time.toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Practica con tu propia casa real — la familiaridad potencia el efecto.' : 'Visualiza con todos los sentidos: forma, color, sonido. Más vívido = más memorable.',
      };
    } else if (exerciseId === 'comprehension') {
      const passed = raw.correct >= raw.total - 1;
      r = {
        passed,
        headline: passed ? 'Comprensión sólida' : null,
        xpEarned: Math.floor(exercise.xp * (raw.correct / raw.total)),
        stats: [
          { icon: 'check', value: raw.correct, unit: `/${raw.total}`, label: 'Correctas', color: '#22C55E' },
          { icon: 'gauge', value: raw.wpm || '—', unit: 'WPM', label: 'Lectura', color: '#F97316' },
          { icon: 'clock', value: raw.time.toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
          { icon: 'brain', value: Math.round((raw.correct / raw.total) * 100), unit: '%', label: 'Comprensión', color: '#8B5CF6' },
        ],
        insight: passed ? 'Excelente balance entre velocidad y comprensión.' : 'Baja el ritmo un poco y vuelve a leer. La velocidad sin comprensión no sirve.',
      };
    } else if (exerciseId === 'reading') {
      const passed = raw.comprehension >= 0.7;
      r = {
        passed,
        headline: passed ? `${raw.wpm} WPM con comprensión` : null,
        xpEarned: Math.floor(exercise.xp * Math.max(0.4, raw.comprehension)),
        stats: [
          { icon: 'gauge', value: raw.wpm, unit: 'WPM', label: 'Velocidad', color: '#F97316' },
          { icon: 'brain', value: Math.round(raw.comprehension * 100), unit: '%', label: 'Comprensión', color: '#8B5CF6' },
          { icon: 'check', value: raw.correct, unit: `/${raw.total}`, label: 'Aciertos', color: '#22C55E' },
          { icon: 'clock', value: raw.time.toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Excelente balance velocidad/comprensión. Prueba +30 WPM la próxima.' : 'Baja un poco la velocidad para retener más. La comprensión cuenta tanto como la velocidad.',
      };
    } else if (exerciseId === 'boss') {
      const passed = raw.defeated;
      r = {
        passed,
        headline: passed ? '¡Jefe derrotado!' : null,
        xpEarned: passed ? exercise.xp : Math.floor(exercise.xp / 3),
        stats: [
          { icon: 'trophy', value: Math.round(raw.score * 100), unit: '%', label: 'Puntaje', color: '#EAB308' },
          { icon: 'clock', value: raw.time.toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Desbloqueaste la siguiente zona. Los desafíos serán mayores.' : 'Entrena más en esta zona antes de volver a enfrentarlo.',
      };
    } else {
      // generic reading
      r = {
        passed: true,
        headline: 'Sesión completa',
        xpEarned: exercise.xp,
        stats: [
          { icon: 'gauge', value: raw.wpm || 280, unit: 'WPM', label: 'Velocidad', color: '#F97316' },
          { icon: 'clock', value: (raw.time || 120).toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: 'Tu ritmo es constante. Prueba subir 20 WPM la próxima.',
      };
    }
    setResult(r);
    saveSession(raw, r);
    setPhase('result');
  };

  if (phase === 'intro') {
    return <ExerciseIntro
      exercise={exercise}
      onStart={() => setPhase('playing')}
      onBack={onExit}
      theme={theme}
      fromDashboard={fromDashboard}
      intensity={intensity}
      setIntensity={setIntensity}
    />;
  }
  if (phase === 'result') {
    return <ExerciseResult exercise={exercise} result={result} onContinue={() => onExit(result.xpEarned)} onRetry={() => { setResult(null); setPhase('playing'); }} theme={theme} />;
  }

  // Playing — fold intensity into config so each exercise gets its own knobs
  const commonProps = {
    onFinish: handleFinish,
    onQuit: () => onExit(0),
    theme,
    config: { color: exercise.color, ...config, ...intensity },
  };
  switch (exerciseId) {
    case 'schulte': return <SchulteExercise {...commonProps} />;
    case 'wordspan': return <WordSpanExercise {...commonProps} />;
    case 'loci': return <LociExercise {...commonProps} />;
    case 'comprehension': return <ComprehensionExercise {...commonProps} />;
    case 'boss': return <BossExercise {...commonProps} />;
    case 'reading':
      if (intensity.mode === 'free' || config?.mode === 'free') return <FreeReadingExercise {...commonProps} />;
      return <FocalReadingExercise {...commonProps} />;
    default:
      return <FocalReadingExercise {...commonProps} />;
  }
}

Object.assign(window, { EXERCISES, ExerciseRouter });
