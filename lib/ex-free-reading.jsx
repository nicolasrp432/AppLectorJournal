// Free-reading mode — full text scroll with WPM tracking + completion quiz

function FreeReadingExercise({ onFinish, onQuit, theme, config }) {
  const accent = config?.color || '#22C55E';
  const passage = React.useMemo(() => config?.book?.content
    ? { title: config.book.title, text: config.book.content, questions: pickPassage('medium').questions }
    : pickPassage('medium'), [config]);
  const words = passage.text.split(/\s+/);

  const [phase, setPhase] = React.useState('reading'); // reading | quiz | done
  const [startTime] = React.useState(Date.now());
  const [scrollPct, setScrollPct] = React.useState(0);
  const [readSeconds, setReadSeconds] = React.useState(0);
  const [picked, setPicked] = React.useState({});
  const [qIdx, setQIdx] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);
  const scrollerRef = React.useRef(null);

  const handleScroll = (e) => {
    const el = e.target;
    const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    setScrollPct(pct);
  };

  const finishReading = () => {
    setReadSeconds((Date.now() - startTime) / 1000);
    setPhase('quiz');
  };

  const handleAnswer = (qi, oi) => {
    if (feedback !== null) return;
    const correct = passage.questions[qi].correct === oi;
    setFeedback({ qi, oi, correct });
    setPicked({ ...picked, [qi]: oi });
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= passage.questions.length) {
        const allPicks = { ...picked, [qi]: oi };
        const totalCorrect = Object.entries(allPicks)
          .filter(([k, v]) => passage.questions[+k].correct === v).length;
        const wpm = Math.round((words.length / Math.max(1, readSeconds)) * 60);
        onFinish({
          wpm,
          mode: 'free',
          time: readSeconds,
          comprehension: totalCorrect / passage.questions.length,
          correct: totalCorrect,
          total: passage.questions.length,
        });
      } else {
        setQIdx(qi + 1);
      }
    }, 1100);
  };

  if (phase === 'reading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={scrollPct} accent={accent} onQuit={onQuit} title="Lectura libre" />
        <div ref={scrollerRef} onScroll={handleScroll} style={{
          flex: 1, overflowY: 'auto', padding: '20px 22px 30px',
        }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>{words.length} palabras</div>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', margin: '6px 0 16px', lineHeight: 1.2 }}>{passage.title}</h1>
          <div style={{ fontFamily: 'Lexend', fontSize: 16, lineHeight: 1.85, color: '#1f2937' }}>
            {passage.text}
          </div>
          <div style={{ marginTop: 30, padding: 14, background: `${accent}10`, borderRadius: 14, border: `1px solid ${accent}25`, fontFamily: 'Lexend', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
            <strong style={{ color: accent }}>¿Listo?</strong> Cuando termines, responderás {passage.questions.length} preguntas para validar tu comprensión.
          </div>
        </div>
        <div style={{ padding: '14px 20px 24px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={finishReading} style={{
            width: '100%', padding: 14, background: accent, border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            boxShadow: `0 6px 16px ${accent}50`,
          }}>Terminé · ir al quiz</button>
        </div>
      </div>
    );
  }

  // quiz
  const q = passage.questions[qIdx];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      <ExerciseTopBar progress={qIdx / passage.questions.length} accent={accent} onQuit={onQuit} title={`Pregunta ${qIdx + 1}/${passage.questions.length}`} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Comprensión</div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 19, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.3 }}>{q.q}</h2>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.opts.map((opt, i) => {
            const isPicked = picked[qIdx] === i;
            const showCorrect = feedback && i === q.correct;
            const showWrong = feedback && isPicked && i !== q.correct;
            return (
              <button key={i} onClick={() => handleAnswer(qIdx, i)} disabled={!!feedback} style={{
                padding: '14px 16px', textAlign: 'left',
                background: showCorrect ? '#DCFCE7' : showWrong ? '#FEE2E2' : isPicked ? `${accent}15` : '#fff',
                border: showCorrect ? '2px solid #22C55E' : showWrong ? '2px solid #EF4444' : '1.5px solid #E5E7EB',
                borderRadius: 14, fontFamily: 'Lexend', fontSize: 14, color: '#111827',
                cursor: feedback ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: showCorrect ? '#22C55E' : showWrong ? '#EF4444' : '#F3F4F6',
                  color: showCorrect || showWrong ? '#fff' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Nunito', fontSize: 11, fontWeight: 900,
                }}>{showCorrect ? '✓' : showWrong ? '✕' : String.fromCharCode(65 + i)}</div>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FreeReadingExercise });
