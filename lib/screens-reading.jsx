// Reading Session — the core speed reading exercise
// Focal reading mode with WPM control + Swift mascot guide

function ReadingScreen({ onNav, theme }) {
  const primary = theme?.primary || '#22C55E';
  const [phase, setPhase] = React.useState('intro'); // intro | reading | done
  const [wpm, setWpm] = React.useState(320);
  const [wordIdx, setWordIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const words = React.useMemo(() => (
    'La lectura rápida no consiste en leer menos sino en entrenar la mente para capturar más en cada fijación de la vista cerebro y ojos trabajan juntos como un equipo'.split(' ')
  ), []);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setWordIdx(i => {
        if (i >= words.length - 1) {
          setPlaying(false);
          setPhase('done');
          return i;
        }
        return i + 1;
      });
    }, 60000 / wpm);
    return () => clearInterval(id);
  }, [playing, wpm, words.length]);

  if (phase === 'intro') {
    return <ReadingIntro onNav={onNav} onStart={() => { setPhase('reading'); setPlaying(true); }} wpm={wpm} setWpm={setWpm} />;
  }
  if (phase === 'done') {
    return <ReadingDone onNav={onNav} wpm={wpm} comprehension={87} />;
  }

  // Active reading
  const progress = (wordIdx / (words.length - 1)) * 100;
  const currentWord = words[wordIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '56px 24px 32px', position: 'relative' }}>
      {/* Top bar: progress "Eco" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => { setPlaying(false); onNav('path'); }} style={{ border: 'none', background: '#F3F4F6', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1 }}><ProgressEco value={progress} color="#F97316" /></div>
        <StatBadge icon="⚡" value={wpm} color="#F97316" label="WPM" />
      </div>
      <p style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 }}>
        Lectura Focal · {wordIdx + 1}/{words.length}
      </p>

      {/* Swift mascot at the side, cheering */}
      <div style={{ position: 'absolute', right: 20, top: 130 }}>
        <Swift size={70} bouncing={playing} />
      </div>

      {/* Word display */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
          {/* Focus point indicator */}
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', width: 2, height: 16, background: '#F97316', borderRadius: 1 }} />
          <div style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: 52,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: -1,
            lineHeight: 1,
          }}>
            {currentWord && currentWord.split('').map((ch, i) => {
              const mid = Math.floor(currentWord.length / 3);
              return <span key={i} style={{ color: i === mid ? '#F97316' : '#111827' }}>{ch}</span>;
            })}
          </div>
          <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', width: 2, height: 16, background: '#F97316', borderRadius: 1 }} />
        </div>

        <div style={{ marginTop: 60, fontFamily: 'Lexend', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
          Mantén tu mirada en el punto naranja.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <CircBtn icon="−" onClick={() => setWpm(w => Math.max(120, w - 20))} />
        <PushButton
          color={playing ? '#F97316' : '#22C55E'}
          onClick={() => setPlaying(p => !p)}
        >
          {playing ? '❚❚ Pausar' : '▶ Continuar'}
        </PushButton>
        <CircBtn icon="+" onClick={() => setWpm(w => Math.min(800, w + 20))} />
      </div>
    </div>
  );
}

function CircBtn({ icon, onClick }) {
  const [p, setP] = React.useState(false);
  return (
    <button
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      onClick={onClick}
      style={{
        width: 52, height: 52, borderRadius: 16,
        border: '2px solid #E5E7EB',
        background: '#fff',
        fontSize: 22, fontWeight: 900, color: '#374151',
        cursor: 'pointer',
        boxShadow: p ? '0 0 0 #E5E7EB' : '0 4px 0 #E5E7EB',
        transform: p ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        fontFamily: 'Nunito',
      }}
    >{icon}</button>
  );
}

function ReadingIntro({ onNav, onStart, wpm, setWpm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '48px 24px 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexShrink: 0 }}>
        <button onClick={() => onNav('path')} style={{ border: 'none', background: '#F3F4F6', width: 36, height: 36, borderRadius: 12, fontSize: 16, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Nodo 5 · Zona de Enfoque</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
        <Swift size={110} bouncing />
        <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 24, color: '#111827', textAlign: 'center', margin: 0, lineHeight: 1.15 }}>
          Lectura Focal
        </h1>
        <p style={{ fontFamily: 'Lexend', fontSize: 13, color: '#6B7280', textAlign: 'center', maxWidth: 300, margin: 0, lineHeight: 1.4 }}>
          Swift te guiará palabra por palabra. Mantén la vista fija en el punto central.
        </p>

        <CognitiveCard color="#FED7AA" style={{ width: '100%', marginTop: 10 }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: 1 }}>Velocidad objetivo</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 36, fontWeight: 900, color: '#111827' }}>{wpm}</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 800, color: '#6B7280' }}>WPM</div>
          </div>
          <input
            type="range" min={120} max={600} step={20} value={wpm}
            onChange={e => setWpm(Number(e.target.value))}
            style={{ width: '100%', marginTop: 8, accentColor: '#F97316' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Lexend', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            <span>Tranquilo</span><span>Tu récord: 380</span><span>Desafío</span>
          </div>
        </CognitiveCard>
      </div>

      <div style={{ flexShrink: 0, paddingTop: 12 }}>
        <PushButton color="#F97316" onClick={onStart}>Comenzar</PushButton>
      </div>
    </div>
  );
}

function ReadingDone({ onNav, wpm, comprehension }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '56px 24px 32px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <Joy size={140} bouncing />
      </div>
      <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 28, color: '#111827', margin: '20px 0 4px' }}>¡Lección completada!</h1>
      <p style={{ fontFamily: 'Lexend', fontSize: 14, color: '#6B7280', margin: 0 }}>Joy quiere darte tu premio</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 }}>
        <CognitiveCard color="#FED7AA">
          <div style={{ fontSize: 32 }}>⚡</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 4 }}>{wpm}</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: 0.8 }}>WPM logrados</div>
        </CognitiveCard>
        <CognitiveCard color="#BBF7D0">
          <div style={{ fontSize: 32 }}>🎯</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 4 }}>{comprehension}%</div>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: 0.8 }}>Comprensión</div>
        </CognitiveCard>
      </div>

      <CognitiveCard color="#FDE68A" style={{ marginTop: 14, background: '#FEFCE8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>✨</div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#A16207', textTransform: 'uppercase', letterSpacing: 1 }}>Recompensa</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 900, color: '#111827' }}>+85 XP</div>
          </div>
          <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#A16207', fontWeight: 700 }}>¡Racha +1!</div>
        </div>
      </CognitiveCard>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PushButton color="#22C55E" onClick={() => onNav('path')}>Continuar el viaje</PushButton>
        <OutlineButton color="#E5E7EB" textColor="#6B7280" onClick={() => onNav('rewards')}>Ir a la Tienda</OutlineButton>
      </div>
    </div>
  );
}

Object.assign(window, { ReadingScreen });
