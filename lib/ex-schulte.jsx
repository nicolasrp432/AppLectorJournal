// Schulte Table — peripheral vision trainer
// User taps numbers in order 1..N as fast as possible.

function SchulteExercise({ onFinish, onQuit, theme, config }) {
  const size = config?.size || 5; // 3x3, 4x4, 5x5
  const accent = config?.color || '#22C55E';
  const total = size * size;

  const [numbers, setNumbers] = React.useState(() => shuffle([...Array(total)].map((_, i) => i + 1)));
  const [next, setNext] = React.useState(1);
  const [startTime] = React.useState(() => Date.now());
  const [elapsed, setElapsed] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [shake, setShake] = React.useState(null);

  React.useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 100);
    return () => clearInterval(t);
  }, [startTime]);

  const handleTap = (n) => {
    if (n === next) {
      if (next === total) {
        onFinish({
          time: (Date.now() - startTime) / 1000,
          errors,
          size,
        });
      } else {
        setNext(next + 1);
      }
    } else {
      setErrors(errors + 1);
      setShake(n);
      setTimeout(() => setShake(null), 300);
    }
  };

  const cellSize = size === 3 ? 90 : size === 4 ? 74 : 58;
  const fontSize = size === 3 ? 32 : size === 4 ? 26 : 22;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      <ExerciseTopBar progress={(next - 1) / total} accent={accent} onQuit={onQuit} title="Schulte" />

      {/* Stats strip */}
      <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
        <StatPill icon="clock" value={elapsed.toFixed(1) + 's'} label="Tiempo" color="#3B82F6" />
        <StatPill icon="target" value={next - 1 + '/' + total} label="Progreso" color={accent} />
        <StatPill icon="x" value={errors} label="Errores" color="#EF4444" />
      </div>

      {/* Instruction */}
      <div style={{ textAlign: 'center', padding: '8px 20px 16px' }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Busca</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 56, fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: -2, marginTop: 2 }}>{next}</div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)`, gap: 6, padding: 10, background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 4px 20px rgba(17,24,39,0.04)' }}>
          {numbers.map((n, i) => {
            const done = n < next;
            const shaking = shake === n;
            return (
              <button
                key={i}
                onClick={() => handleTap(n)}
                disabled={done}
                style={{
                  width: cellSize, height: cellSize,
                  border: 'none',
                  borderRadius: 12,
                  background: done ? `${accent}15` : '#FAFAF9',
                  color: done ? `${accent}60` : '#111827',
                  fontFamily: 'Nunito', fontSize,
                  fontWeight: 900,
                  cursor: done ? 'default' : 'pointer',
                  transition: 'all 180ms',
                  animation: shaking ? 'shakeX 300ms' : 'none',
                  outline: shaking ? '2px solid #EF4444' : 'none',
                }}>{n}</button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '8px 10px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
      <GIcon name={icon} size={22} accent={color} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Object.assign(window, { SchulteExercise, StatPill, shuffle });
