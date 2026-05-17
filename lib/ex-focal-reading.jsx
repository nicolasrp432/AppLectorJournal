// Deep Focal Reading — RSVP / guide / chunking with WPM, ORP, pause, comprehension quiz

function FocalReadingExercise({ onFinish, onQuit, theme, config }) {
  const accent = config?.color || '#F97316';
  const initialWpm = config?.wpm || (supa.prefs.get().wpm_default || 280);
  const initialMode = config?.mode || 'rsvp'; // rsvp | guide | chunk

  const passage = React.useMemo(() => {
    // If launched from Library with a specific book/content, build a synthetic passage.
    const book = config?.book;
    if (book && book.content) {
      return {
        id: book.id || 'custom',
        title: book.title || 'Lectura',
        text: book.content,
        // Generic comprehension prompts that work for any passage
        questions: [
          { q: '¿Qué nivel de comprensión sientes que tuviste?', opts: ['Excelente, capté todo', 'Buena, casi todo', 'Regular, lo esencial', 'Baja, me distraje'], correct: 0 },
          { q: '¿Pudiste mantener el ritmo cómodamente?', opts: ['Sí, fluido', 'Sí, con algo de esfuerzo', 'A veces perdí palabras', 'No, fue muy rápido'], correct: 0 },
          { q: '¿Recuerdas el tema central del texto?', opts: ['Sí, claramente', 'Más o menos', 'Solo fragmentos', 'No'], correct: 0 },
        ],
      };
    }
    return pickPassage('medium');
  }, []);
  const words = React.useMemo(() => passage.text.split(/\s+/), [passage]);

  const [wpm, setWpm] = React.useState(initialWpm);
  const [mode, setMode] = React.useState(initialMode);
  const [chunkSize, setChunkSize] = React.useState(2);
  const [idx, setIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [phase, setPhase] = React.useState('config'); // config | reading | quiz | done
  const [startTime, setStartTime] = React.useState(null);
  const [readSeconds, setReadSeconds] = React.useState(0);
  const [picked, setPicked] = React.useState({});
  const [qIdx, setQIdx] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);

  const interval = (60 / wpm) * 1000 * (mode === 'chunk' ? chunkSize : 1);

  // Auto-advance
  React.useEffect(() => {
    if (!playing || phase !== 'reading') return;
    const step = mode === 'chunk' ? chunkSize : 1;
    if (idx >= words.length) {
      setPlaying(false);
      setReadSeconds((Date.now() - startTime) / 1000);
      setPhase('quiz');
      return;
    }
    const t = setTimeout(() => setIdx(idx + step), interval);
    return () => clearTimeout(t);
  }, [idx, playing, interval, mode, chunkSize, words.length, phase]);

  const start = () => {
    setIdx(0);
    setStartTime(Date.now());
    setPlaying(true);
    setPhase('reading');
  };

  const togglePlay = () => {
    if (!playing && !startTime) setStartTime(Date.now());
    setPlaying(p => !p);
  };

  const handleAnswer = (qi, oi) => {
    if (feedback !== null) return;
    const correct = passage.questions[qi].correct === oi;
    setFeedback({ qi, oi, correct });
    setPicked({ ...picked, [qi]: oi });
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= passage.questions.length) {
        const totalCorrect = Object.entries({ ...picked, [qi]: oi })
          .filter(([k, v]) => passage.questions[+k].correct === v).length;
        onFinish({
          wpm,
          mode,
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

  // ---- CONFIG SCREEN ----
  if (phase === 'config') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Configura" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Lectura Focal</div>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', margin: '4px 0 0' }}>{passage.title}</h1>
            <p style={{ fontFamily: 'Lexend', fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>{words.length} palabras · ~{Math.round((words.length / wpm) * 60)}s</p>
          </div>

          {/* Mode selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Modo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { k: 'rsvp', l: 'RSVP', d: 'Palabra fija' },
                { k: 'guide', l: 'Guía', d: 'Highlight avanza' },
                { k: 'chunk', l: 'Chunks', d: '2-3 palabras' },
              ].map(m => (
                <button key={m.k} onClick={() => setMode(m.k)} style={{
                  padding: 10, border: 'none', borderRadius: 12,
                  background: mode === m.k ? accent : '#fff',
                  color: mode === m.k ? '#fff' : '#374151',
                  border: mode === m.k ? 'none' : '1px solid #E5E7EB',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 900 }}>{m.l}</div>
                  <div style={{ fontFamily: 'Lexend', fontSize: 10, opacity: 0.85, marginTop: 2 }}>{m.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* WPM slider */}
          <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>Velocidad</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: accent }}>{wpm}<span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>WPM</span></div>
            </div>
            <input type="range" min="150" max="800" step="10" value={wpm} onChange={e => setWpm(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Nunito', fontSize: 9, fontWeight: 700, color: '#9CA3AF', marginTop: 2 }}>
              <span>150 lento</span><span>400 medio</span><span>800 experto</span>
            </div>
          </div>

          {mode === 'chunk' && (
            <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, padding: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>Chunk</div>
              <div style={{ flex: 1 }} />
              {[2, 3].map(c => (
                <button key={c} onClick={() => setChunkSize(c)} style={{
                  padding: '6px 14px', borderRadius: 10, border: 'none',
                  background: chunkSize === c ? accent : '#F3F4F6',
                  color: chunkSize === c ? '#fff' : '#6B7280',
                  fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, cursor: 'pointer',
                }}>{c} pal</button>
              ))}
            </div>
          )}

          <div style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 14, padding: 12, fontFamily: 'Lexend', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
            <strong style={{ color: accent }}>Tip:</strong> después de leer, responderás {passage.questions.length} preguntas. La comprensión cuenta tanto como la velocidad.
          </div>
        </div>
        <div style={{ padding: '14px 20px 24px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={start} style={{
            width: '100%', padding: 14, background: accent, border: 'none', borderRadius: 14,
            fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            boxShadow: `0 6px 16px ${accent}50`,
          }}>Empezar lectura</button>
        </div>
      </div>
    );
  }

  // ---- READING SCREEN ----
  if (phase === 'reading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
        <ExerciseTopBar progress={idx / words.length} accent={accent} onQuit={onQuit} title={`${wpm} WPM · ${mode}`} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Display area */}
          <div style={{ flex: 1, display: 'flex', alignItems: mode === 'guide' ? 'stretch' : 'center', justifyContent: 'center', padding: mode === 'guide' ? '0 16px' : 20, position: 'relative', minHeight: 0 }}>
            {mode === 'rsvp' && <RSVPDisplay word={words[idx]} accent={accent} />}
            {mode === 'guide' && <GuideDisplay words={words} idx={idx} accent={accent} />}
            {mode === 'chunk' && <ChunkDisplay words={words} idx={idx} chunkSize={chunkSize} accent={accent} />}
          </div>

          {/* Controls */}
          <div style={{ padding: '14px 20px 24px', borderTop: '1px solid #F3F4F6', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <button onClick={() => setIdx(Math.max(0, idx - 5))} style={controlBtn}>−5</button>
              <button onClick={togglePlay} style={{ ...controlBtn, flex: 1, background: accent, color: '#fff', fontSize: 14 }}>
                {playing ? '❚❚ Pausa' : '▶ Reanudar'}
              </button>
              <button onClick={() => setIdx(Math.min(words.length - 1, idx + 5))} style={controlBtn}>+5</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', minWidth: 32 }}>{wpm}</span>
              <input type="range" min="150" max="800" step="10" value={wpm} onChange={e => setWpm(+e.target.value)} style={{ flex: 1, accentColor: accent }} />
              <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF' }}>WPM</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- QUIZ ----
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

const controlBtn = {
  padding: '12px 14px', background: '#F3F4F6', border: 'none', borderRadius: 12,
  fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: '#374151', cursor: 'pointer',
};

// RSVP word with ORP (optimal recognition point) — letter at ~⅓ position highlighted
function RSVPDisplay({ word, accent }) {
  if (!word) return <div />;
  const orpIdx = Math.max(0, Math.min(word.length - 1, Math.floor(word.length * 0.35)));
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      {/* Crosshair lines */}
      <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '20%', background: '#E5E7EB' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', width: 1, height: '20%', background: '#E5E7EB' }} />
      <div style={{ position: 'relative', fontFamily: 'Lexend', fontSize: 38, fontWeight: 600, color: '#111827', letterSpacing: 1, lineHeight: 1.4, padding: '10px 0' }}>
        <span>{word.slice(0, orpIdx)}</span>
        <span style={{ color: accent, fontWeight: 700 }}>{word[orpIdx]}</span>
        <span>{word.slice(orpIdx + 1)}</span>
        <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 12, height: 2, background: accent }} />
      </div>
    </div>
  );
}

// Guided reading: full passage flows top-to-bottom inside a scrollable column.
// A soft "pacer band" tracks behind the current line, the active word is boxed
// in the accent color, past text fades grey, future text stays full ink.
// Auto-scroll keeps the active word in the upper third (natural eye-position).
function GuideDisplay({ words, idx, accent }) {
  const containerRef = React.useRef(null);
  const activeRef = React.useRef(null);
  const [bandY, setBandY] = React.useState(null);
  const [bandH, setBandH] = React.useState(28);

  React.useEffect(() => {
    if (!activeRef.current || !containerRef.current) return;
    const c = containerRef.current;
    const a = activeRef.current;
    // Word position inside the scrollable content (not viewport)
    const aTop = a.offsetTop;
    const aH = a.offsetHeight;
    setBandY(aTop);
    setBandH(aH + 6);
    // Target: keep active line at ~30% from top of viewport
    const target = aTop - c.clientHeight * 0.30;
    const cur = c.scrollTop;
    const dist = Math.abs(target - cur);
    // Only animate when needed; jump instantly on first frame
    if (dist > 6) {
      c.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }, [idx]);

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%', maxWidth: 380, height: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      padding: '32px 22px 50vh',  // big bottom padding so last lines can scroll up
      boxSizing: 'border-box',
      scrollbarWidth: 'thin',
      background: 'transparent',
    }}>
      {/* Pacer band sits behind the active line */}
      {bandY != null && (
        <div style={{
          position: 'absolute',
          left: 8, right: 8,
          top: bandY - 3,
          height: bandH,
          background: `${accent}10`,
          borderLeft: `3px solid ${accent}`,
          borderRadius: 8,
          transition: 'top 220ms cubic-bezier(.4,.2,.2,1), height 220ms ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: 'Lexend', fontSize: 18, lineHeight: 1.85,
        color: '#111827', textAlign: 'left',
        textWrap: 'pretty',
      }}>
        {words.map((w, i) => {
          const isActive = i === idx;
          const isPast = i < idx;
          return (
            <React.Fragment key={i}>
              <span
                ref={isActive ? activeRef : null}
                style={{
                  color: isPast ? '#B4B0AA' : isActive ? '#fff' : '#1F2937',
                  background: isActive ? accent : 'transparent',
                  padding: isActive ? '2px 7px' : 0,
                  margin: isActive ? '0 -1px' : 0,
                  borderRadius: 7,
                  fontWeight: isActive ? 700 : 400,
                  boxShadow: isActive ? `0 6px 14px ${accent}55` : 'none',
                  transition: 'background 180ms, color 180ms, box-shadow 180ms, padding 180ms',
                  display: 'inline-block',
                }}
              >{w}</span>
              {i < words.length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ChunkDisplay({ words, idx, chunkSize, accent }) {
  const chunk = words.slice(idx, idx + chunkSize).join(' ');
  return (
    <div style={{ textAlign: 'center', fontFamily: 'Lexend', fontSize: 28, fontWeight: 600, color: '#111827', letterSpacing: 0.3 }}>
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 6 }}>{chunk}</div>
    </div>
  );
}

Object.assign(window, { FocalReadingExercise, RSVPDisplay, GuideDisplay, ChunkDisplay });
