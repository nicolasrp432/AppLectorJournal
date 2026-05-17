// Word Span — short-term memory
// Show a sequence of words, user reproduces them in order by tapping.

function WordSpanExercise({ onFinish, onQuit, theme, config }) {
  const accent = config?.color || '#3B82F6';
  const level = config?.level || 6; // N words in sequence
  const showMs = config?.showMs || 1100;
  const distractorCount = config?.distractors ?? 4;

  const wordBank = ['luz', 'río', 'viento', 'hoja', 'sol', 'nube', 'piedra', 'mar', 'fuego', 'bosque', 'árbol', 'lluvia', 'cielo', 'flor', 'montaña', 'agua', 'tierra', 'estrella', 'luna', 'pájaro', 'cristal', 'umbral', 'silencio'];
  const [sequence] = React.useState(() => shuffle(wordBank).slice(0, level));
  const [phase, setPhase] = React.useState('show'); // show | recall | done
  const [shownIdx, setShownIdx] = React.useState(0);
  const [selection, setSelection] = React.useState([]);
  const [options, setOptions] = React.useState([]);
  const [startTime] = React.useState(() => Date.now());

  // Show phase: reveal words one at a time
  React.useEffect(() => {
    if (phase !== 'show') return;
    if (shownIdx < sequence.length) {
      const t = setTimeout(() => setShownIdx(shownIdx + 1), showMs);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        // Build options: sequence + distractors
        const distractors = wordBank.filter(w => !sequence.includes(w)).slice(0, distractorCount);
        setOptions(shuffle([...sequence, ...distractors]));
        setPhase('recall');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [shownIdx, phase]);

  const toggleSelect = (word) => {
    if (selection.includes(word)) {
      setSelection(selection.filter(w => w !== word));
    } else if (selection.length < sequence.length) {
      const newSel = [...selection, word];
      setSelection(newSel);
      if (newSel.length === sequence.length) {
        // Finish
        setTimeout(() => {
          const correct = newSel.filter((w, i) => w === sequence[i]).length;
          onFinish({
            correct,
            total: sequence.length,
            time: (Date.now() - startTime) / 1000,
          });
        }, 600);
      }
    }
  };

  if (phase === 'show') {
    const current = sequence[shownIdx];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={(shownIdx) / sequence.length} accent={accent} onQuit={onQuit} title="Memoriza" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Palabra {shownIdx + 1} de {sequence.length}</div>
          {current && (
            <div key={shownIdx} style={{
              padding: '32px 48px',
              background: `linear-gradient(145deg, ${accent}, ${accent}CC)`,
              borderRadius: 28,
              boxShadow: `0 20px 50px ${accent}40`,
              fontFamily: 'Nunito', fontSize: 44, fontWeight: 900, color: '#fff',
              letterSpacing: -0.5,
              animation: 'wordPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>{current}</div>
          )}
          {!current && (
            <div style={{ textAlign: 'center' }}>
              <Calm size={110} />
              <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 900, color: '#111827', marginTop: 8 }}>Concéntrate…</div>
            </div>
          )}
        </div>
        <style>{`
          @keyframes wordPop {
            from { transform: scale(0.7); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Recall phase
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      <ExerciseTopBar progress={selection.length / sequence.length} accent={accent} onQuit={onQuit} title="Recuerda" />

      <div style={{ padding: '14px 20px 6px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Selecciona en orden</div>
      </div>

      {/* Current selection */}
      <div style={{ padding: '10px 20px', minHeight: 90 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: sequence.length }).map((_, i) => {
            const w = selection[i];
            return (
              <div key={i} style={{
                minWidth: 60, padding: '10px 14px',
                border: w ? `2px solid ${accent}` : '2px dashed #D1D5DB',
                background: w ? `${accent}12` : 'transparent',
                borderRadius: 12,
                fontFamily: 'Nunito', fontSize: 15, fontWeight: 900,
                color: w ? accent : '#D1D5DB',
                textAlign: 'center',
                transition: 'all 200ms',
              }}>
                {w || (i + 1)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Word bank */}
      <div style={{ flex: 1, padding: '14px 20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', background: '#fff', padding: 16, borderRadius: 20, border: '1px solid #F3F4F6' }}>
          {options.map(w => {
            const selected = selection.includes(w);
            return (
              <button key={w} onClick={() => toggleSelect(w)} style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: 12,
                background: selected ? '#E5E7EB' : `${accent}15`,
                color: selected ? '#9CA3AF' : accent,
                fontFamily: 'Nunito', fontSize: 14, fontWeight: 900,
                cursor: selected ? 'default' : 'pointer',
                opacity: selected ? 0.5 : 1,
                transition: 'all 180ms',
              }}>{w}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WordSpanExercise });
