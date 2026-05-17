// Boss Level — mixed evaluation
// Sequential mini-challenges: speed reading + comprehension + memory

function BossExercise({ onFinish, onQuit, theme, config }) {
  const accent = '#DC2626'; // boss red

  const challenges = [
    { type: 'speed', label: 'Velocidad' },
    { type: 'memory', label: 'Memoria' },
    { type: 'comprehension', label: 'Comprensión' },
  ];

  const [cIdx, setCIdx] = React.useState(0);
  const [scores, setScores] = React.useState([]);
  const [bossHP, setBossHP] = React.useState(100);
  const [phase, setPhase] = React.useState('intro'); // intro | playing | round-end
  const [roundResult, setRoundResult] = React.useState(null);
  const [startTime] = React.useState(() => Date.now());

  const handleRoundFinish = (score) => {
    const damage = Math.floor(score * 33);
    const newHP = Math.max(0, bossHP - damage);
    setBossHP(newHP);
    setScores([...scores, score]);
    setRoundResult({ score, damage });
    setPhase('round-end');
  };

  const handleNext = () => {
    if (cIdx + 1 >= challenges.length) {
      const totalScore = scores.reduce((a, b) => a + b, 0) / challenges.length;
      onFinish({
        score: totalScore,
        defeated: bossHP === 0,
        time: (Date.now() - startTime) / 1000,
        rounds: scores.length,
      });
    } else {
      setCIdx(cIdx + 1);
      setPhase('playing');
      setRoundResult(null);
    }
  };

  // Header with boss HP bar
  const BossHeader = () => (
    <div style={{
      padding: '52px 20px 18px',
      background: `linear-gradient(145deg, #450A0A, #1F2937)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(220,38,38,0.2)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onQuit} style={{ border: 'none', background: 'rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <GIcon name="x" size={28} accent="#fff" dark />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 }}>JEFE · Ronda {cIdx + 1}/{challenges.length}</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 2 }}>Guardián de la Comprensión</div>
        </div>
        <div style={{ fontSize: 40 }}>👹</div>
      </div>
      <div style={{ marginTop: 12, position: 'relative' }}>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${bossHP}%`, height: '100%', background: 'linear-gradient(90deg, #EF4444, #DC2626)', borderRadius: 5, transition: 'width 700ms ease-out' }} />
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#FCA5A5', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>HP: {bossHP}/100</div>
      </div>
    </div>
  );

  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1F2937', color: '#fff' }}>
        <BossHeader />
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 100, textShadow: '0 0 40px rgba(220,38,38,0.6)' }}>👹</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 }}>Reto final de la zona</div>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 28, fontWeight: 900, margin: 0, textAlign: 'center', letterSpacing: -0.5 }}>3 rondas.<br />Un jefe.</h1>
          <p style={{ fontFamily: 'Lexend', fontSize: 14, color: '#D1D5DB', textAlign: 'center', maxWidth: 300, margin: 0 }}>Supera las pruebas de velocidad, memoria y comprensión. Cada acierto debilita al jefe.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {challenges.map((c, i) => (
              <div key={i} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, border: '1px solid rgba(255,255,255,0.15)' }}>
                {i + 1}. {c.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 20px 24px' }}>
          <button onClick={() => setPhase('playing')} style={{
            width: '100%', padding: '15px',
            background: 'linear-gradient(145deg, #EF4444, #B91C1C)',
            border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 15, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
            boxShadow: '0 10px 30px rgba(220,38,38,0.5)',
          }}>¡A LA BATALLA!</button>
        </div>
      </div>
    );
  }

  if (phase === 'round-end') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1F2937', color: '#fff' }}>
        <BossHeader />
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ fontSize: 80 }}>{roundResult.score > 0.66 ? '⚔️' : roundResult.score > 0.33 ? '💥' : '🛡️'}</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 }}>Ronda completada</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 42, fontWeight: 900, margin: 0, color: '#EF4444' }}>-{roundResult.damage} HP</div>
          <p style={{ fontFamily: 'Lexend', fontSize: 14, color: '#D1D5DB', margin: 0 }}>
            {bossHP === 0 ? '¡El jefe está vencido!' : cIdx + 1 >= challenges.length ? 'Última ronda terminada' : 'Prepárate para la siguiente'}
          </p>
        </div>
        <div style={{ padding: '14px 20px 24px' }}>
          <button onClick={handleNext} style={{
            width: '100%', padding: '14px',
            background: '#EF4444', border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.8,
          }}>{cIdx + 1 >= challenges.length ? 'Ver resultado final' : 'Siguiente ronda'}</button>
        </div>
      </div>
    );
  }

  // Playing phase — delegate to mini-exercise
  const current = challenges[cIdx];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BossHeader />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {current.type === 'speed' && <BossSpeedRound onFinish={handleRoundFinish} accent={accent} />}
        {current.type === 'memory' && <BossMemoryRound onFinish={handleRoundFinish} accent={accent} />}
        {current.type === 'comprehension' && <BossComprehensionRound onFinish={handleRoundFinish} accent={accent} />}
      </div>
    </div>
  );
}

// Boss mini-rounds (simplified)
function BossSpeedRound({ onFinish, accent }) {
  const words = ['rápido', 'leer', 'foco', 'mente', 'atento', 'claro', 'ágil', 'despierto'];
  const [idx, setIdx] = React.useState(0);
  const [taps, setTaps] = React.useState(0);
  const [start] = React.useState(Date.now());

  React.useEffect(() => {
    if (idx >= words.length) {
      const time = (Date.now() - start) / 1000;
      const score = Math.max(0, Math.min(1, 1 - (time - 6) / 10));
      onFinish(score);
    }
  }, [idx]);

  if (idx >= words.length) return null;

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', background: '#111827', color: '#fff', justifyContent: 'center', alignItems: 'center', gap: 30 }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 }}>Toca tan rápido como leas · {idx}/{words.length}</div>
      <div key={idx} style={{
        padding: '32px 40px',
        background: `linear-gradient(145deg, ${accent}, #991B1B)`,
        borderRadius: 24, boxShadow: `0 20px 50px ${accent}70`,
        fontFamily: 'Nunito', fontSize: 52, fontWeight: 900, color: '#fff',
        animation: 'wordPop 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>{words[idx]}</div>
      <button onClick={() => setIdx(idx + 1)} style={{
        padding: '14px 32px', background: '#fff', color: '#111827',
        border: 'none', borderRadius: 14,
        fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, cursor: 'pointer',
        textTransform: 'uppercase', letterSpacing: 1,
      }}>Siguiente ↓</button>
    </div>
  );
}

function BossMemoryRound({ onFinish, accent }) {
  const [digits] = React.useState(() => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)));
  const [phase, setPhase] = React.useState('show');
  const [input, setInput] = React.useState([]);

  React.useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), 3500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const tap = (n) => {
    const newIn = [...input, n];
    setInput(newIn);
    if (newIn.length === digits.length) {
      const correct = newIn.filter((d, i) => d === digits[i]).length;
      onFinish(correct / digits.length);
    }
  };

  if (phase === 'show') {
    return (
      <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', background: '#111827', color: '#fff', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 }}>Memoriza estos números</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {digits.map((d, i) => (
            <div key={i} style={{
              width: 46, height: 60, borderRadius: 12,
              background: `linear-gradient(145deg, ${accent}, #991B1B)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Nunito', fontSize: 30, fontWeight: 900, color: '#fff',
              boxShadow: `0 8px 20px ${accent}50`,
            }}>{d}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', background: '#111827', color: '#fff', gap: 16 }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>Escribe los números en orden</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {digits.map((_, i) => (
          <div key={i} style={{
            width: 38, height: 48, borderRadius: 10,
            border: input[i] != null ? `2px solid ${accent}` : '2px dashed rgba(255,255,255,0.2)',
            background: input[i] != null ? `${accent}30` : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Nunito', fontSize: 22, fontWeight: 900,
            color: input[i] != null ? '#fff' : 'transparent',
          }}>{input[i]}</div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => tap(n)} style={{
            padding: '16px 0', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
            fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#fff',
            cursor: 'pointer',
          }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function BossComprehensionRound({ onFinish, accent }) {
  const [picked, setPicked] = React.useState(null);
  const q = {
    text: 'La práctica espaciada mejora la memoria a largo plazo más que estudiar todo de una vez.',
    q: '¿Qué afirma el texto?',
    opts: ['Estudiar intensivo es igual de eficaz', 'Espaciar la práctica mejora el recuerdo duradero', 'La memoria no se puede entrenar'],
    correct: 1,
  };

  const handle = (i) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => onFinish(i === q.correct ? 1 : 0), 1000);
  };

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', background: '#111827', color: '#fff', gap: 16, justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' }}>Lee y responde</div>
      <div style={{ padding: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 18, fontFamily: 'Lexend', fontSize: 16, lineHeight: 1.6, color: '#F3F4F6' }}>{q.text}</div>
      <div style={{ fontFamily: 'Nunito', fontSize: 16, fontWeight: 900, color: '#fff' }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.opts.map((opt, i) => (
          <button key={i} onClick={() => handle(i)} disabled={picked !== null} style={{
            padding: '14px 16px', textAlign: 'left',
            background: picked === i ? (i === q.correct ? '#16A34A' : '#DC2626') : picked !== null && i === q.correct ? '#16A34A' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
            fontFamily: 'Lexend', fontSize: 14, color: '#fff', cursor: 'pointer',
          }}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BossExercise });
