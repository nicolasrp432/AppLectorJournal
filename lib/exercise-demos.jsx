// Animated visual demos — one per exercise type.
// Each demo TEACHES via animation: cursor taps, eye gaze, sequential phases.
// No text inside the animation; the rationale lives in "Por qué es efectivo".

function ExerciseDemo({ kind, accent = '#22C55E', height = 200 }) {
  return (
    <div style={{
      width: '100%', height,
      background: `linear-gradient(180deg, ${accent}10, #fff)`,
      border: `1px solid ${accent}20`,
      borderRadius: 18,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid pattern */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }} width="100%" height="100%">
        <defs>
          <pattern id={`g-${kind}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={accent} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g-${kind})`} />
      </svg>
      {kind === 'schulte' && <DemoSchulte accent={accent} />}
      {(kind === 'rsvp' || kind === 'reading') && <DemoRSVP accent={accent} />}
      {kind === 'wordspan' && <DemoWordSpan accent={accent} />}
      {kind === 'loci' && <DemoLoci accent={accent} />}
      {kind === 'comprehension' && <DemoComprehension accent={accent} />}
      {kind === 'boss' && <DemoBoss accent={accent} />}
    </div>
  );
}

// Tiny "finger cursor" — appears where the user would tap
function Cursor({ x, y, visible = true, color = '#111827' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-30%, -10%)',
      transition: 'left 380ms cubic-bezier(0.4,0.0,0.2,1), top 380ms cubic-bezier(0.4,0.0,0.2,1), opacity 200ms',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none', zIndex: 5,
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))',
    }}>
      <svg width="22" height="26" viewBox="0 0 22 26">
        <path d="M 3 2 L 3 18 L 8 14 L 11 22 L 14 21 L 11 13 L 17 13 Z" fill="#fff" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Tiny eye icon — fixed gaze indicator
function EyeIcon({ x, y, color, size = 22 }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
      <svg width={size} height={size * 0.7} viewBox="0 0 32 24">
        <path d="M 2 12 Q 9 3 16 3 Q 23 3 30 12 Q 23 21 16 21 Q 9 21 2 12 Z" fill="#fff" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="16" cy="12" r="4.5" fill={color} />
        <circle cx="17" cy="11" r="1.6" fill="#fff" />
      </svg>
    </div>
  );
}

// ===== SCHULTE: fixed eye + cursor taps numbers in order =====
function DemoSchulte({ accent }) {
  // 9 steps: tap 1..5 sequentially; then 4 hold/reset frames
  const TOTAL = 9;
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % TOTAL), 600);
    return () => clearInterval(id);
  }, []);

  // Cells laid out 3x3. Numbers visible on cells (random scatter).
  // Cell positions match an actual grid; we point the cursor at them.
  const cellSize = 34;
  const gap = 5;
  const gridW = cellSize * 3 + gap * 2;
  // Map number -> grid index (visually scattered)
  const positions = [4, 0, 6, 2, 7, 1, 8, 3, 5]; // index = number-1
  const lit = Math.min(5, step + 1); // numbers 1..lit are tapped

  const targetIdx = lit <= 5 ? positions[Math.max(0, lit - 1)] : positions[4];
  const cursorActive = step < 5;
  // Compute cursor pixel position based on cell index
  const col = targetIdx % 3, row = Math.floor(targetIdx / 3);
  const cursorX = `calc(50% - ${gridW / 2}px + ${col * (cellSize + gap) + cellSize * 0.6}px)`;
  const cursorY = `calc(50% - ${gridW / 2}px + ${row * (cellSize + gap) + cellSize * 0.55}px + 8px)`;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Gaze halo */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 130, height: 130, transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}25, transparent 65%)`,
        animation: 'gazePulse 2.2s ease-in-out infinite',
      }} />
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cellSize}px)`, gap, position: 'relative', zIndex: 1 }}>
        {Array.from({ length: 9 }).map((_, idx) => {
          const number = positions.indexOf(idx) + 1; // 1..9
          const isLit = number <= lit;
          const isCurrent = number === lit && step < 5;
          return (
            <div key={idx} style={{
              width: cellSize, height: cellSize, borderRadius: 7,
              background: isCurrent ? accent : isLit ? `${accent}25` : '#fff',
              border: isCurrent ? `2px solid ${accent}` : '1.5px solid #E5E7EB',
              color: isCurrent ? '#fff' : isLit ? accent : '#9CA3AF',
              fontFamily: 'Nunito', fontWeight: 900, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: isCurrent ? 'scale(1.18)' : 'scale(1)',
              transition: 'all 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: isCurrent ? `0 6px 14px ${accent}60` : 'none',
            }}>{number}</div>
          );
        })}
      </div>
      {/* Fixed-gaze eye placed OUTSIDE the grid (left side) with a sight line to center */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="100%" height="100%">
        <line x1="32" y1="50%" x2="50%" y2="50%" stroke={accent} strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
      </svg>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
        <div style={{
          padding: 5, background: '#fff', borderRadius: '50%',
          border: `1.5px solid ${accent}`, boxShadow: `0 3px 8px ${accent}30`,
        }}>
          <svg width="22" height="16" viewBox="0 0 32 24">
            <path d="M 2 12 Q 9 3 16 3 Q 23 3 30 12 Q 23 21 16 21 Q 9 21 2 12 Z" fill="#fff" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="16" cy="12" r="4.5" fill={accent} />
            <circle cx="17" cy="11" r="1.6" fill="#fff" />
          </svg>
        </div>
      </div>
      {/* Number counter pill at top */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        padding: '3px 10px', background: '#111827', color: '#fff',
        fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
        borderRadius: 999, letterSpacing: 1,
      }}>BUSCA · {Math.min(lit, 5)}</div>
      {/* Cursor that moves between cells */}
      <Cursor x={cursorX} y={cursorY} visible={cursorActive} color={accent} />
      <style>{`@keyframes gazePulse {0%,100%{transform:translate(-50%,-50%) scale(0.92);opacity:0.85}50%{transform:translate(-50%,-50%) scale(1.08);opacity:0.5}}`}</style>
    </div>
  );
}

// ===== RSVP: stack of words feeds through a fixed focus window =====
function DemoRSVP({ accent }) {
  const words = ['leer', 'rápido', 'sin', 'mover', 'los', 'ojos'];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % words.length), 450);
    return () => clearInterval(id);
  }, []);
  const w = words[idx];
  const orp = Math.max(0, Math.floor(w.length * 0.35));
  // Next words queue
  const next = [words[(idx + 1) % words.length], words[(idx + 2) % words.length]];
  const prev = words[(idx - 1 + words.length) % words.length];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {/* Top label */}
      <div style={{
        padding: '3px 10px', background: '#111827', color: '#fff',
        fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
        borderRadius: 999, letterSpacing: 1,
      }}>OJOS FIJOS · 320 WPM</div>

      {/* Word "channel" — previous word sliding out left, current center, next sliding in right */}
      <div style={{ position: 'relative', width: 280, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Focus window indicator */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 110, height: 50, border: `1.5px dashed ${accent}55`, borderRadius: 10,
          background: `${accent}08`,
        }} />
        {/* Previous (fading out left) */}
        <div key={'p' + idx} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Lexend', fontSize: 18, fontWeight: 500, color: '#9CA3AF',
          animation: 'rsvpOutLeft 450ms ease-out forwards',
          opacity: 0.5,
        }}>{prev}</div>
        {/* Current (sharp center) */}
        <div key={'c' + idx} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Lexend', fontSize: 26, fontWeight: 700, color: '#111827',
          animation: 'rsvpIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 2, letterSpacing: 0.5,
        }}>
          <span>{w.slice(0, orp)}</span>
          <span style={{ color: accent, fontWeight: 800 }}>{w[orp]}</span>
          <span>{w.slice(orp + 1)}</span>
          {/* ORP mark */}
          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 10, height: 2, background: accent, borderRadius: 1 }} />
        </div>
        {/* Eye to the side, NOT moving (stays put) */}
        <div style={{ position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%)' }}>
          <EyeIcon x={11} y={11} color={accent} size={22} />
        </div>
      </div>

      {/* Rhythm dots — show that every word lands on a beat */}
      <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
        {words.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 16 : 6, height: 6, borderRadius: 4,
            background: i === idx ? accent : i < idx ? `${accent}66` : '#E5E7EB',
            transition: 'all 220ms ease',
          }} />
        ))}
      </div>

      {/* Bottom hint: arrow showing words come in at rhythm */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Nunito', fontSize: 9, fontWeight: 800, color: '#9CA3AF', letterSpacing: 1 }}>
        <span>RITMO CONSTANTE</span>
      </div>

      <style>{`
        @keyframes rsvpIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes rsvpOutLeft {
          from { opacity: 0.5; transform: translate(-50%, -50%) translateX(0); }
          to { opacity: 0; transform: translate(-50%, -50%) translateX(-60px); }
        }
      `}</style>
    </div>
  );
}



// ===== WORDSPAN: cards reveal sequence, then cursor fills slots in order =====
function DemoWordSpan({ accent }) {
  const seq = ['sol', 'mar', 'luz', 'hoja'];
  const TOTAL = 14; // 0-3 show, 4 pause, 5-8 cursor fills slots, 9-13 hold complete
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % TOTAL), 500);
    return () => clearInterval(id);
  }, []);

  const phase = step < 4 ? 'show' : step < 5 ? 'switch' : 'recall';
  const recallFilled = Math.max(0, Math.min(4, step - 5));

  // Slot pixel positions for cursor
  const slotPositions = [-72, -24, 24, 72]; // x offsets from center
  const cursorX = phase === 'recall' && recallFilled < 4
    ? `calc(50% + ${slotPositions[recallFilled]}px)`
    : '50%';
  const cursorY = phase === 'recall' && recallFilled < 4 ? 'calc(50% + 8px)' : 'calc(50% + 60px)';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      {/* Top label */}
      <div style={{
        padding: '3px 10px', background: phase === 'show' ? accent : '#111827', color: '#fff',
        fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
        borderRadius: 999, letterSpacing: 1, transition: 'background 280ms',
      }}>{phase === 'show' ? `MEMORIZA · ${Math.min(step + 1, 4)}/4` : 'RECUERDA EN ORDEN'}</div>

      {phase === 'show' && (
        <>
          {/* Single card centered, pops in */}
          <div key={step} style={{
            padding: '14px 28px', borderRadius: 14,
            background: `linear-gradient(145deg, ${accent}, ${accent}CC)`,
            fontFamily: 'Nunito', fontSize: 24, fontWeight: 900, color: '#fff',
            boxShadow: `0 10px 22px ${accent}55`,
            animation: 'wordPopDemo 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>{seq[step]}</div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {seq.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 14 : 5, height: 5, borderRadius: 3,
                background: i === step ? accent : i < step ? `${accent}66` : '#E5E7EB',
                transition: 'all 220ms',
              }} />
            ))}
          </div>
        </>
      )}

      {phase !== 'show' && (
        <>
          {/* Empty slots that fill in */}
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            {seq.map((w, i) => {
              const filled = i < recallFilled;
              return (
                <div key={i} style={{
                  minWidth: 44, padding: '10px 6px',
                  border: filled ? `2px solid ${accent}` : '2px dashed #D1D5DB',
                  borderRadius: 10,
                  background: filled ? `${accent}15` : 'transparent',
                  fontFamily: 'Nunito', fontSize: 13, fontWeight: 900,
                  color: filled ? accent : '#D1D5DB',
                  textAlign: 'center',
                  transition: 'all 240ms',
                  transform: filled ? 'scale(1)' : 'scale(1)',
                }}>{filled ? w : i + 1}</div>
              );
            })}
          </div>

          {/* Word bank below */}
          <div style={{ display: 'flex', gap: 5, padding: '6px 8px', background: '#fff', borderRadius: 10, border: '1px solid #F3F4F6', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
            {[...seq, 'río', 'piedra'].map((w, i) => {
              const used = seq.indexOf(w) > -1 && seq.indexOf(w) < recallFilled;
              return (
                <div key={i} style={{
                  padding: '4px 9px', borderRadius: 7,
                  background: used ? '#F3F4F6' : `${accent}15`,
                  color: used ? '#9CA3AF' : accent,
                  fontFamily: 'Nunito', fontSize: 11, fontWeight: 900,
                  opacity: used ? 0.4 : 1, transition: 'all 200ms',
                  textDecoration: used ? 'line-through' : 'none',
                }}>{w}</div>
              );
            })}
          </div>

          <Cursor x={cursorX} y={cursorY} visible={phase === 'recall' && recallFilled < 4} color={accent} />
        </>
      )}
      <style>{`@keyframes wordPopDemo { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ===== LOCI: items get placed in rooms, then a question; cursor taps correct room =====
function DemoLoci({ accent }) {
  // Rooms in a 2-row floor plan
  const rooms = [
    { id: 'A', x: 18, y: 70 }, // entrance
    { id: 'B', x: 50, y: 70 }, // kitchen
    { id: 'C', x: 82, y: 70 }, // bath
    { id: 'D', x: 18, y: 25 }, // bedroom
    { id: 'E', x: 50, y: 25 }, // office
    { id: 'F', x: 82, y: 25 }, // attic
  ];
  const items = [
    { word: '🔑', target: 'A', color: '#F59E0B' },
    { word: '📖', target: 'D', color: '#3B82F6' },
    { word: '⏰', target: 'F', color: '#22C55E' },
  ];
  const TOTAL = 14;
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % TOTAL), 600);
    return () => clearInterval(id);
  }, []);

  // Phases: 0-5 place 3 items (each item travels in 2 steps), 6-7 pause,
  // 8-9 question shown, 10-13 cursor goes to correct room and locks in
  const placingIdx = step < 6 ? Math.floor(step / 2) : null; // 0..2
  const placeSettled = step < 6 ? step % 2 === 1 : true;
  const phase = step < 6 ? 'place' : step < 8 ? 'recap' : 'recall';
  const questionItem = items[1]; // book
  const target = rooms.find(r => r.id === questionItem.target);

  // Placed items: all that have been settled
  const placed = items.map((it, i) => {
    if (i < (placingIdx ?? items.length)) return it;
    if (i === placingIdx && placeSettled) return it;
    return null;
  }).filter(Boolean);

  return (
    <div style={{ position: 'absolute', inset: 0, padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        alignSelf: 'center',
        padding: '3px 10px', background: phase === 'recall' ? '#111827' : accent, color: '#fff',
        fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
        borderRadius: 999, letterSpacing: 1, transition: 'background 200ms',
      }}>{phase === 'place' ? 'COLOCA EN LA CASA' : phase === 'recall' ? '¿DÓNDE PUSISTE?' : 'MEMORIZA…'}</div>

      <div style={{
        position: 'relative', flex: 1,
        background: `${accent}08`,
        border: `1.5px solid ${accent}25`,
        borderRadius: 10,
      }}>
        {/* Walls */}
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line x1="33" y1="2" x2="33" y2="78" stroke={`${accent}30`} strokeWidth="0.5" />
          <line x1="66" y1="2" x2="66" y2="78" stroke={`${accent}30`} strokeWidth="0.5" />
          <line x1="2" y1="48" x2="98" y2="48" stroke={`${accent}30`} strokeWidth="0.5" />
        </svg>
        {/* Rooms */}
        {rooms.map(r => {
          const item = placed.find(it => it.target === r.id);
          const isTarget = phase === 'recall' && r.id === questionItem.target && step >= 10;
          const isQueried = phase === 'recall' && r.id === questionItem.target && step < 10;
          return (
            <div key={r.id} style={{
              position: 'absolute', left: `${r.x}%`, top: `${r.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 28, height: 24, borderRadius: 6,
              background: isTarget ? '#22C55E' : item ? '#fff' : 'transparent',
              border: isTarget ? '2px solid #22C55E' : item ? `1.5px solid ${accent}` : `1px dashed ${accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, transition: 'all 280ms',
              boxShadow: isTarget ? '0 4px 10px rgba(34,197,94,0.5)' : item ? `0 3px 8px ${accent}30` : 'none',
              fontFamily: 'Nunito', fontWeight: 900, color: '#9CA3AF',
            }}>
              {item ? item.word : r.id}
              {isQueried && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 6,
                  border: '2px dashed #DC2626',
                  animation: 'pulseHalo 1s ease-in-out infinite',
                }} />
              )}
            </div>
          );
        })}
        {/* Travelling item during placement */}
        {phase === 'place' && placingIdx != null && (() => {
          const it = items[placingIdx];
          const tr = rooms.find(r => r.id === it.target);
          return (
            <div style={{
              position: 'absolute',
              left: placeSettled ? `${tr.x}%` : '50%',
              top: placeSettled ? `${tr.y}%` : '110%',
              transform: 'translate(-50%, -50%)',
              fontSize: 18,
              transition: 'all 480ms cubic-bezier(0.4,0,0.2,1)',
              opacity: placeSettled ? 0 : 1,
              filter: `drop-shadow(0 4px 8px ${it.color}55)`,
            }}>{it.word}</div>
          );
        })()}
        {/* Question item ("which room had this?") */}
        {phase === 'recall' && (
          <div style={{
            position: 'absolute', left: '50%', top: -10,
            transform: 'translate(-50%, -50%)',
            padding: '4px 10px', background: '#fff',
            border: '2px solid #DC2626', borderRadius: 10,
            fontFamily: 'Nunito', fontSize: 12, fontWeight: 900,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
          }}>
            <span style={{ fontSize: 16 }}>{questionItem.word}</span>
            <span style={{ color: '#DC2626' }}>?</span>
          </div>
        )}
        {/* Cursor moving to target on recall */}
        {phase === 'recall' && step >= 8 && (
          <Cursor
            x={`${target.x}%`}
            y={`${target.y}%`}
            visible
            color="#22C55E"
          />
        )}
      </div>
    </div>
  );
}

// ===== COMPREHENSION: text scans line by line, then question + correct answer locks =====
function DemoComprehension({ accent }) {
  const TOTAL = 10;
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % TOTAL), 600);
    return () => clearInterval(id);
  }, []);
  // 0-3 read 3 lines, 4 hold, 5-9 show quiz + cursor + correct
  const phase = step < 4 ? 'read' : 'quiz';
  const linesRead = Math.min(3, step + 1);
  const cursorAtCorrect = step >= 6;
  const showResult = step >= 7;

  return (
    <div style={{ position: 'absolute', inset: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        alignSelf: 'flex-start',
        padding: '3px 10px',
        background: phase === 'read' ? accent : '#111827', color: '#fff',
        fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
        borderRadius: 999, letterSpacing: 1, transition: 'background 220ms',
      }}>{phase === 'read' ? 'LEE EL PASAJE' : 'RESPONDE'}</div>

      {/* Paragraph */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
        {[0, 1, 2].map(i => {
          const isReading = phase === 'read' && i === step;
          const wasRead = i < linesRead && !isReading;
          return (
            <div key={i} style={{
              height: 8, borderRadius: 4, position: 'relative',
              background: wasRead ? `${accent}45` : isReading ? `linear-gradient(90deg, ${accent} 0%, ${accent} 50%, #E5E7EB 50%)` : '#F3F4F6',
              width: i === 2 ? '72%' : '100%',
              transition: 'background 240ms',
              backgroundSize: isReading ? '200% 100%' : '100% 100%',
              animation: isReading ? 'readLine 600ms linear forwards' : 'none',
            }} />
          );
        })}
      </div>

      {/* Quiz appears below */}
      {phase === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, position: 'relative' }}>
          {[0, 1, 2].map(i => {
            const correctIdx = 1;
            const isCorrect = showResult && i === correctIdx;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 7px', borderRadius: 8,
                background: isCorrect ? '#DCFCE7' : '#fff',
                border: isCorrect ? '1.5px solid #22C55E' : '1.5px solid #F3F4F6',
                transition: 'all 240ms',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 8,
                  background: isCorrect ? '#22C55E' : '#F3F4F6',
                  color: isCorrect ? '#fff' : '#9CA3AF',
                  fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{isCorrect ? '✓' : String.fromCharCode(65 + i)}</div>
                <div style={{ height: 6, flex: 1, borderRadius: 3, background: isCorrect ? '#86EFAC' : '#E5E7EB' }} />
              </div>
            );
          })}
          {/* Cursor lands on correct option */}
          <Cursor
            x="38%"
            y={cursorAtCorrect ? 'calc(50% + 24px)' : 'calc(50% + 60px)'}
            visible={step >= 5}
            color="#22C55E"
          />
        </div>
      )}
      <style>{`@keyframes readLine { from { background-position: 100% 0; } to { background-position: 0 0; } }`}</style>
    </div>
  );
}

// ===== BOSS: 3 round icons strike boss, HP bar drains =====
function DemoBoss({ accent }) {
  const TOTAL = 8;
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % TOTAL), 600);
    return () => clearInterval(id);
  }, []);
  // Rounds strike at 1, 3, 5; HP drops at 2, 4, 6
  const hp = step <= 1 ? 100 : step <= 3 ? 66 : step <= 5 ? 33 : 0;
  const rounds = [
    { name: 'velocidad', icon: 'gauge', color: '#F97316' },
    { name: 'memoria', icon: 'brain', color: '#3B82F6' },
    { name: 'comprensión', icon: 'book', color: '#EAB308' },
  ];
  // Which round is currently "striking"
  const striking = step === 1 ? 0 : step === 3 ? 1 : step === 5 ? 2 : null;

  return (
    <div style={{ position: 'absolute', inset: 0, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {/* HP pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          padding: '3px 8px', background: '#DC2626', color: '#fff',
          fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
          borderRadius: 999, letterSpacing: 1,
        }}>JEFE · HP {hp}</div>
      </div>

      {/* Boss + strike effects */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          transform: striking !== null ? 'translate(2px, 0)' : 'translate(0, 0)',
          animation: striking !== null ? 'bossShake 200ms ease-out' : 'none',
        }}>
          <BossMascot size={62} expression={hp === 0 ? 'defeated' : striking !== null ? 'angry' : 'serious'} />
        </div>
        {/* Strike bolt */}
        {striking !== null && (
          <div style={{
            position: 'absolute', left: -36, top: '50%', transform: 'translateY(-50%)',
            animation: 'boltFly 260ms ease-out forwards',
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32">
              <path d="M 18 4 L 8 18 L 14 18 L 12 28 L 22 13 L 16 13 Z" fill={rounds[striking].color} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* HP bar */}
      <div style={{ width: 180 }}>
        <div style={{ height: 8, borderRadius: 5, background: '#FECACA', overflow: 'hidden' }}>
          <div style={{
            width: `${hp}%`, height: '100%',
            background: 'linear-gradient(90deg, #EF4444, #DC2626)',
            transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
            borderRadius: 5,
          }} />
        </div>
      </div>

      {/* Round chips */}
      <div style={{ display: 'flex', gap: 6 }}>
        {rounds.map((r, i) => {
          const done = step > i * 2 + 1;
          const active = striking === i;
          return (
            <div key={i} style={{
              padding: 5, borderRadius: 9,
              background: done ? `${r.color}25` : '#fff',
              border: `1.5px solid ${active ? r.color : done ? `${r.color}55` : '#E5E7EB'}`,
              transform: active ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: done || active ? 1 : 0.5,
              boxShadow: active ? `0 6px 14px ${r.color}55` : 'none',
            }}>
              <GIcon name={r.icon} size={22} accent={r.color} />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes boltFly {
          0% { transform: translate(0, -50%) scale(0.6); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(34px, -50%) scale(1.2); opacity: 0; }
        }
        @keyframes bossShake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { ExerciseDemo, Cursor, EyeIcon, DemoSchulte, DemoRSVP, DemoWordSpan, DemoLoci, DemoComprehension, DemoBoss });
