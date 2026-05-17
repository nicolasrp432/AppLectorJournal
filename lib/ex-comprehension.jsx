// Reading comprehension quiz — short passage + 3-4 questions

function ComprehensionExercise({ onFinish, onQuit, theme, config }) {
  const accent = config?.color || '#EAB308';

  const passage = {
    title: 'El cerebro que lee',
    text: 'Leer no es una habilidad natural del cerebro humano. A diferencia del habla, que emerge espontáneamente en los niños, la lectura requiere reconvertir áreas cerebrales originalmente destinadas al reconocimiento facial y de objetos. Este proceso, llamado reciclaje neuronal, explica por qué aprender a leer toma años. Los lectores experimentados procesan palabras completas como unidades visuales, no letra por letra. Esta habilidad es la que permite leer rápido sin perder comprensión.',
  };

  const questions = [
    {
      q: '¿Qué significa "reciclaje neuronal" en el texto?',
      opts: [
        'Crear nuevas neuronas para leer',
        'Reutilizar áreas cerebrales para una nueva función',
        'Reemplazar células dañadas del cerebro',
        'Dormir para consolidar la lectura',
      ],
      correct: 1,
    },
    {
      q: 'Según el texto, ¿en qué se diferencia leer de hablar?',
      opts: [
        'Leer requiere más tiempo al día',
        'Hablar requiere más esfuerzo',
        'Hablar emerge espontáneamente; leer requiere aprendizaje',
        'Leer es más antiguo evolutivamente',
      ],
      correct: 2,
    },
    {
      q: '¿Cómo procesan las palabras los lectores expertos?',
      opts: [
        'Letra por letra, muy rápido',
        'Como unidades visuales completas',
        'Traduciendo a sonidos primero',
        'Usando solo el hemisferio derecho',
      ],
      correct: 1,
    },
  ];

  const [phase, setPhase] = React.useState('read'); // read | quiz | done
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [picked, setPicked] = React.useState(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [startTime] = React.useState(() => Date.now());
  const [readStart] = React.useState(() => Date.now());
  const [readTime, setReadTime] = React.useState(null);

  const handlePick = (i) => {
    if (showFeedback) return;
    setPicked(i);
    setShowFeedback(true);
    setTimeout(() => {
      const newAnswers = [...answers, i === questions[qIdx].correct];
      setAnswers(newAnswers);
      setPicked(null);
      setShowFeedback(false);
      if (qIdx + 1 >= questions.length) {
        const correct = newAnswers.filter(Boolean).length;
        const wordCount = passage.text.split(/\s+/).length;
        const wpm = readTime ? Math.round((wordCount / readTime) * 60) : 0;
        onFinish({
          correct,
          total: questions.length,
          wpm,
          time: (Date.now() - startTime) / 1000,
        });
      } else {
        setQIdx(qIdx + 1);
      }
    }, 1200);
  };

  if (phase === 'read') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Lee" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Lectura con comprensión</div>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', margin: '4px 0 0', letterSpacing: -0.3 }}>{passage.title}</h1>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20, padding: 22,
            border: '1px solid #F3F4F6',
            fontFamily: 'Lexend', fontSize: 15, lineHeight: 1.7,
            color: '#1F2937', textWrap: 'pretty',
          }}>
            {passage.text}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'Nunito', fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>
            Después responderás 3 preguntas
          </div>
        </div>

        <div style={{ padding: '14px 20px 24px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={() => { setReadTime((Date.now() - readStart) / 1000); setPhase('quiz'); }} style={{
            width: '100%', padding: '14px',
            background: accent, border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            boxShadow: `0 6px 16px ${accent}50`,
          }}>Ya leí, continuar</button>
        </div>
      </div>
    );
  }

  const q = questions[qIdx];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      <ExerciseTopBar progress={qIdx / questions.length} accent={accent} onQuit={onQuit} title={`Pregunta ${qIdx + 1}/${questions.length}`} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Pregunta {qIdx + 1}</div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 19, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.3, letterSpacing: -0.3 }}>{q.q}</h2>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.opts.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = showFeedback && i === q.correct;
            const isWrong = showFeedback && isPicked && i !== q.correct;
            return (
              <button key={i} onClick={() => handlePick(i)} disabled={showFeedback} style={{
                padding: '14px 16px', textAlign: 'left',
                background: isCorrect ? '#DCFCE7' : isWrong ? '#FEE2E2' : isPicked ? `${accent}15` : '#fff',
                border: isCorrect ? '2px solid #22C55E' : isWrong ? '2px solid #EF4444' : isPicked ? `2px solid ${accent}` : '1.5px solid #E5E7EB',
                borderRadius: 14,
                fontFamily: 'Lexend', fontSize: 14, color: '#111827',
                cursor: showFeedback ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 200ms',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: isCorrect ? '#22C55E' : isWrong ? '#EF4444' : '#F3F4F6',
                  color: isCorrect || isWrong ? '#fff' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, flexShrink: 0,
                }}>
                  {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + i)}
                </div>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ComprehensionExercise });
