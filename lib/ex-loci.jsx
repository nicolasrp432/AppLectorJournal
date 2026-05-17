// Method of Loci — associate words to places in a "house"
// Phase 1: Show word-to-room associations
// Phase 2: User matches word back to its room

function LociExercise({ onFinish, onQuit, theme, config }) {
  const accent = config?.color || '#8B5CF6';
  const wantCount = Math.min(8, Math.max(3, config?.count || 5));
  const studyMs = config?.studyMs || 4000;

  const allRooms = [
    { id: 'entrance', label: 'Entrada', x: 15, y: 70 },
    { id: 'kitchen', label: 'Cocina', x: 70, y: 70 },
    { id: 'living', label: 'Sala', x: 40, y: 45 },
    { id: 'bedroom', label: 'Dormitorio', x: 15, y: 20 },
    { id: 'office', label: 'Oficina', x: 70, y: 20 },
    { id: 'bath', label: 'Baño', x: 85, y: 45 },
    { id: 'garden', label: 'Jardín', x: 15, y: 45 },
    { id: 'attic', label: 'Ático', x: 50, y: 8 },
  ];
  const allWords = ['llave', 'manzana', 'libro', 'reloj', 'guitarra', 'sombrero', 'paraguas', 'vela'];
  const rooms = allRooms.slice(0, wantCount);
  const words = allWords.slice(0, wantCount);

  const [assoc] = React.useState(() => rooms.map((r, i) => ({ ...r, word: words[i] })));
  const [phase, setPhase] = React.useState('learn'); // learn | recall
  const [learnIdx, setLearnIdx] = React.useState(0);
  const [recallIdx, setRecallIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [feedback, setFeedback] = React.useState(null);
  const [startTime] = React.useState(() => Date.now());
  // Auto-advance learn step after `studyMs` so users can practice timed study
  const [autoAdvance, setAutoAdvance] = React.useState(true);
  React.useEffect(() => {
    if (phase !== 'learn' || !autoAdvance) return;
    const t = setTimeout(() => {
      if (learnIdx + 1 >= assoc.length) setPhase('recall');
      else setLearnIdx(learnIdx + 1);
    }, studyMs);
    return () => clearTimeout(t);
  }, [learnIdx, phase, autoAdvance, studyMs]);

  const handleRoomPick = (roomId) => {
    if (feedback) return;
    const target = assoc[recallIdx];
    const correct = roomId === target.id;
    setFeedback({ room: roomId, correct });
    setTimeout(() => {
      setAnswers([...answers, correct]);
      setFeedback(null);
      if (recallIdx + 1 >= assoc.length) {
        const allCorrect = [...answers, correct].filter(Boolean).length;
        onFinish({
          correct: allCorrect,
          total: assoc.length,
          time: (Date.now() - startTime) / 1000,
        });
      } else {
        setRecallIdx(recallIdx + 1);
      }
    }, 1000);
  };

  const House = ({ highlightId, badges = [] }) => (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '1 / 0.8',
      background: '#FAF5FF',
      borderRadius: 24, border: `2px solid ${accent}20`,
      overflow: 'hidden',
    }}>
      {/* Floor plan lines */}
      <svg viewBox="0 0 100 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="70" fill="none" stroke={`${accent}30`} strokeWidth="0.5" rx="2" />
        <line x1="50" y1="5" x2="50" y2="40" stroke={`${accent}30`} strokeWidth="0.3" />
        <line x1="5" y1="40" x2="95" y2="40" stroke={`${accent}30`} strokeWidth="0.3" />
        <line x1="50" y1="55" x2="50" y2="75" stroke={`${accent}30`} strokeWidth="0.3" />
      </svg>
      {assoc.map(r => {
        const highlight = r.id === highlightId;
        const badge = badges.find(b => b.id === r.id);
        return (
          <button
            key={r.id}
            onClick={() => phase === 'recall' && handleRoomPick(r.id)}
            disabled={phase !== 'recall' || !!feedback}
            style={{
              position: 'absolute',
              left: `${r.x}%`, top: `${r.y}%`,
              transform: 'translate(-50%, -50%)',
              padding: '10px 14px',
              background: highlight
                ? (feedback?.correct === false ? '#FEE2E2' : feedback?.correct ? '#DCFCE7' : `${accent}25`)
                : '#fff',
              border: highlight
                ? (feedback?.correct === false ? '2px solid #EF4444' : feedback?.correct ? '2px solid #22C55E' : `2px solid ${accent}`)
                : `2px solid ${accent}30`,
              borderRadius: 14,
              fontFamily: 'Nunito', fontSize: 12, fontWeight: 900,
              color: highlight ? (feedback?.correct === false ? '#EF4444' : feedback?.correct ? '#16A34A' : accent) : '#374151',
              cursor: phase === 'recall' && !feedback ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              transition: 'all 200ms',
              boxShadow: highlight ? `0 4px 12px ${accent}30` : 'none',
            }}>
            {r.label}
            {badge && (
              <div style={{
                position: 'absolute', top: -10, right: -10,
                padding: '3px 7px', background: accent, color: '#fff',
                borderRadius: 8, fontSize: 10, fontWeight: 900,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>{badge.word}</div>
            )}
          </button>
        );
      })}
    </div>
  );

  if (phase === 'learn') {
    const current = assoc[learnIdx];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={(learnIdx + 1) / assoc.length} accent={accent} onQuit={onQuit} title="Aprende" />

        <div style={{ padding: '16px 20px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Asocia objeto con habitación ({learnIdx + 1}/{assoc.length})
          </div>
        </div>

        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{
            padding: '16px 24px',
            background: `linear-gradient(145deg, ${accent}, ${accent}CC)`,
            borderRadius: 18, boxShadow: `0 10px 24px ${accent}40`,
            fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#fff',
          }}>{current.word}</div>
          <GIcon name="arrowRight" size={28} accent={accent} />
          <div style={{
            padding: '14px 20px', background: '#fff',
            border: `2px solid ${accent}`, borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 16, fontWeight: 900, color: accent,
          }}>{current.label}</div>
        </div>

        <div style={{ flex: 1, padding: 20 }}>
          <House highlightId={current.id} badges={assoc.slice(0, learnIdx + 1)} />
        </div>

        <div style={{ padding: '14px 20px 24px' }}>
          <button onClick={() => learnIdx + 1 >= assoc.length ? setPhase('recall') : setLearnIdx(learnIdx + 1)} style={{
            width: '100%', padding: '14px',
            background: accent, border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            boxShadow: `0 6px 16px ${accent}50`,
          }}>{learnIdx + 1 >= assoc.length ? 'Empezar recuerdo' : 'Siguiente'}</button>
        </div>
      </div>
    );
  }

  // Recall
  const current = assoc[recallIdx];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      <ExerciseTopBar progress={recallIdx / assoc.length} accent={accent} onQuit={onQuit} title="Recuerda" />

      <div style={{ padding: '16px 20px 8px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>¿Dónde pusiste este objeto?</div>
        <div style={{
          display: 'inline-block', marginTop: 8,
          padding: '12px 24px',
          background: `linear-gradient(145deg, ${accent}, ${accent}CC)`,
          borderRadius: 16, boxShadow: `0 10px 24px ${accent}40`,
          fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#fff',
        }}>{current.word}</div>
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        <House highlightId={feedback?.room} />
      </div>
    </div>
  );
}

Object.assign(window, { LociExercise });
