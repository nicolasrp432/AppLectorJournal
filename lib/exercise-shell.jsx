// Exercise shell — intro screen + result screen
// Used by all exercises for consistent pre/post framing.

function ExerciseIntro({ exercise, onStart, onBack, theme, fromDashboard, intensity, setIntensity }) {
  const primary = theme?.primary || '#22C55E';
  const c = exercise.color || primary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '52px 20px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ border: 'none', background: '#fff', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #F3F4F6' }}>
          <GIcon name="arrowLeft" size={28} accent="#374151" />
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ padding: '6px 10px', background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <GIcon name="bolt" size={18} accent={c} />
          <span style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: c }}>+{exercise.xp} XP</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: c, textTransform: 'uppercase', letterSpacing: 1.5 }}>{exercise.category}</div>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 900, color: '#111827', margin: '4px 0 0', letterSpacing: -0.4 }}>{exercise.title}</h1>
        </div>

        {/* ANIMATED DEMO — replaces static "Cómo funciona" steps */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 4, height: 14, background: c, borderRadius: 2 }} />
            <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>Cómo funciona</div>
          </div>
          {typeof ExerciseDemo !== 'undefined' ? (
            <ExerciseDemo kind={exercise.demo || exercise.id} accent={c} />
          ) : (
            <div style={{ height: 170, borderRadius: 18, background: `${c}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MiniMascot which={exercise.mascot} size={70} />
            </div>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <MetaChip icon="clock" label="Duración" value={exercise.duration} accent="#3B82F6" />
          <MetaChip icon="target" label="Dificultad" value={exercise.difficulty} accent="#F97316" />
          <MetaChip icon="brain" label="Mejora" value={exercise.improves} accent="#8B5CF6" />
        </div>

        {/* INTENSITY controls — only when launched from dashboard */}
        {fromDashboard && intensity && (
          <IntensityCard exercise={exercise} intensity={intensity} setIntensity={setIntensity} accent={c} />
        )}

        {/* Why effective — textual rationale (the user wants this part as text) */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 16, border: '1px solid #F3F4F6', marginBottom: 14, display: 'flex', gap: 12 }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            borderRadius: 10, background: `${c}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GIcon name="brain" size={22} accent={c} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: c, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Por qué es efectivo</div>
            <div style={{ fontFamily: 'Lexend', fontSize: 13, color: '#374151', lineHeight: 1.55, textWrap: 'pretty' }}>
              {exercise.whyEffective || exercise.description}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ padding: '14px 20px 24px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
        <button onClick={onStart} style={{
          width: '100%', padding: '15px 20px',
          background: c, border: 'none',
          borderRadius: 16,
          fontFamily: 'Nunito', fontSize: 15, fontWeight: 900, color: '#fff',
          letterSpacing: 0.5, textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: `0 8px 20px ${c}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span>Empezar ejercicio</span>
          <GIcon name="arrowRight" size={22} accent="#fff" dark />
        </button>
      </div>
    </div>
  );
}

// Intensity controls — dashboard-only fine-tuning before launch
function IntensityCard({ exercise, intensity, setIntensity, accent }) {
  // Different controls per exercise type
  const id = exercise.id;
  const setOne = (k, v) => setIntensity({ ...intensity, [k]: v });

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 16, border: '1px solid #F3F4F6', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <GIcon name="settings" size={20} accent={accent} />
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: 1 }}>Intensidad personalizada</div>
      </div>

      {id === 'schulte' && (
        <SegRow
          label="Tamaño de la tabla"
          options={[
            { v: 3, l: '3×3', s: 'Fácil' },
            { v: 4, l: '4×4', s: 'Medio' },
            { v: 5, l: '5×5', s: 'Estándar' },
            { v: 6, l: '6×6', s: 'Difícil' },
            { v: 7, l: '7×7', s: 'Experto' },
          ]}
          value={intensity.size || 5} onChange={(v) => setOne('size', v)} accent={accent}
        />
      )}

      {id === 'wordspan' && (
        <>
          <IntensitySlider
            label="Cantidad de palabras"
            min={3} max={10} step={1}
            value={intensity.level || 6}
            onChange={(v) => setOne('level', v)}
            accent={accent} suffix=" palabras"
          />
          <IntensitySlider
            label="Velocidad de exposición"
            min={500} max={2000} step={100}
            value={intensity.showMs || 1100}
            onChange={(v) => setOne('showMs', v)}
            accent={accent} suffix=" ms"
          />
          <SegRow
            label="Distractores"
            options={[
              { v: 2, l: 'Pocos', s: 'Tutorial' },
              { v: 4, l: 'Medio', s: 'Estándar' },
              { v: 7, l: 'Muchos', s: 'Difícil' },
            ]}
            value={intensity.distractors || 4}
            onChange={(v) => setOne('distractors', v)}
            accent={accent}
          />
        </>
      )}

      {id === 'loci' && (
        <>
          <IntensitySlider
            label="Objetos a memorizar"
            min={3} max={8} step={1}
            value={intensity.count || 5}
            onChange={(v) => setOne('count', v)}
            accent={accent} suffix=" objetos"
          />
          <SegRow
            label="Tiempo de estudio por objeto"
            options={[
              { v: 2500, l: 'Rápido', s: '2.5s' },
              { v: 4000, l: 'Medio', s: '4s' },
              { v: 6000, l: 'Lento', s: '6s' },
            ]}
            value={intensity.studyMs || 4000}
            onChange={(v) => setOne('studyMs', v)}
            accent={accent}
          />
        </>
      )}

      {id === 'reading' && (
        <>
          <IntensitySlider
            label="Velocidad objetivo"
            min={150} max={800} step={10}
            value={intensity.wpm || 320}
            onChange={(v) => setOne('wpm', v)}
            accent={accent} suffix=" WPM"
          />
          <SegRow
            label="Modo de lectura"
            options={[
              { v: 'rsvp', l: 'RSVP', s: '1 palabra' },
              { v: 'guide', l: 'Guía', s: 'Highlight' },
              { v: 'chunk', l: 'Chunks', s: '2-3 pal.' },
            ]}
            value={intensity.mode || 'rsvp'}
            onChange={(v) => setOne('mode', v)}
            accent={accent}
          />
        </>
      )}

      {id === 'comprehension' && (
        <SegRow
          label="Longitud del pasaje"
          options={[
            { v: 'short', l: 'Corto', s: '~80 pal' },
            { v: 'medium', l: 'Medio', s: '~150' },
            { v: 'long', l: 'Largo', s: '~250+' },
          ]}
          value={intensity.length || 'medium'}
          onChange={(v) => setOne('length', v)}
          accent={accent}
        />
      )}

      {id === 'boss' && (
        <SegRow
          label="Dificultad del jefe"
          options={[
            { v: 'easy', l: 'Aprendiz', s: 'Práctica' },
            { v: 'normal', l: 'Estándar', s: 'Normal' },
            { v: 'hard', l: 'Pesadilla', s: 'Difícil' },
          ]}
          value={intensity.bossLevel || 'normal'}
          onChange={(v) => setOne('bossLevel', v)}
          accent={accent}
        />
      )}
    </div>
  );
}

function IntensitySlider({ label, value, min, max, step, onChange, accent, suffix }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
        <span style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: accent }}>{value}<span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700 }}>{suffix}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
    </div>
  );
}

function SegRow({ label, options, value, onChange, accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4, background: '#F3F4F6', padding: 4, borderRadius: 12 }}>
        {options.map(opt => {
          const active = value === opt.v;
          return (
            <button key={opt.v} onClick={() => onChange(opt.v)} style={{
              padding: '6px 0', border: 'none',
              background: active ? '#fff' : 'transparent',
              borderRadius: 8,
              fontFamily: 'Nunito',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: active ? accent : '#9CA3AF', lineHeight: 1.1 }}>{opt.l}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', marginTop: 2 }}>{opt.s}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetaChip({ icon, label, value, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: 10, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <GIcon name={icon} size={22} accent={accent} />
      </div>
      <div style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: '#111827', marginTop: 1 }}>{value}</div>
    </div>
  );
}

function ExerciseResult({ result, exercise, onContinue, onRetry, theme }) {
  const primary = theme?.primary || '#22C55E';
  const c = exercise.color || primary;
  const passed = result.passed;
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 20px 20px' }}>
        {/* Hero with celebration */}
        <div style={{
          textAlign: 'center', marginBottom: 24,
          transform: revealed ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: revealed ? 1 : 0,
          transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{
            width: 130, height: 130, margin: '0 auto 16px',
            borderRadius: '50%',
            background: passed ? `linear-gradient(145deg, ${c}, ${c}CC)` : 'linear-gradient(145deg, #9CA3AF, #6B7280)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: passed ? `0 20px 50px ${c}50` : '0 15px 40px rgba(0,0,0,0.15)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '3px dashed rgba(255,255,255,0.4)', animation: 'pulseHalo 3s ease-in-out infinite' }} />
            <div style={{ fontSize: 70 }}>{passed ? '🎉' : '💪'}</div>
          </div>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: c, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            {passed ? '¡Completado!' : 'Sigue intentando'}
          </div>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: -0.5 }}>
            {passed ? (result.headline || '¡Bien hecho!') : 'Casi, inténtalo de nuevo'}
          </h1>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {result.stats.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: 14,
              border: '1px solid #F3F4F6',
              transform: revealed ? 'translateY(0)' : 'translateY(15px)',
              opacity: revealed ? 1 : 0,
              transition: `all 400ms ease-out ${200 + i * 80}ms`,
            }}>
              <GIcon name={s.icon} size={26} accent={s.color || c} />
              <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1, marginTop: 8, letterSpacing: -0.5 }}>
                {s.value}<span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginLeft: 3 }}>{s.unit}</span>
              </div>
              <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP earned */}
        {passed && (
          <div style={{
            background: `linear-gradient(135deg, #FEF3C7, #FDE68A)`,
            border: '1px solid #FCD34D',
            borderRadius: 18, padding: 16,
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
            transform: revealed ? 'translateY(0)' : 'translateY(15px)',
            opacity: revealed ? 1 : 0,
            transition: 'all 500ms ease-out 500ms',
          }}>
            <GIcon name="bolt" size={44} accent="#D97706" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1 }}>Recompensa</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 900, color: '#78350F' }}>+{result.xpEarned} XP</div>
            </div>
            <Joy size={56} />
          </div>
        )}

        {/* Insight */}
        {result.insight && (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 16, border: '1px solid #F3F4F6',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            transform: revealed ? 'translateY(0)' : 'translateY(15px)',
            opacity: revealed ? 1 : 0,
            transition: 'all 500ms ease-out 600ms',
          }}>
            <MiniMascot which={exercise.mascot} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: c, textTransform: 'uppercase', letterSpacing: 1 }}>Tip de {exercise.mascot}</div>
              <div style={{ fontFamily: 'Lexend', fontSize: 13, color: '#374151', lineHeight: 1.5, marginTop: 3 }}>{result.insight}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 20px 24px', background: '#fff', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={{
          padding: '14px 18px', background: '#fff', color: '#374151',
          border: '1.5px solid #E5E7EB', borderRadius: 14,
          fontFamily: 'Nunito', fontSize: 13, fontWeight: 900,
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Repetir</button>
        <button onClick={onContinue} style={{
          flex: 1, padding: '14px 20px',
          background: c, border: 'none', borderRadius: 14,
          fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
          boxShadow: `0 6px 16px ${c}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          Continuar ruta
          <GIcon name="arrowRight" size={22} accent="#fff" dark />
        </button>
      </div>
    </div>
  );
}

function ExerciseTopBar({ title, progress, onQuit, accent }) {
  return (
    <div style={{ padding: '52px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
      <button onClick={onQuit} style={{ border: 'none', background: 'transparent', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <GIcon name="x" size={30} accent="#6B7280" />
      </button>
      <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: accent, borderRadius: 4, transition: 'width 400ms ease-out' }} />
      </div>
      {title && <div style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>}
    </div>
  );
}

Object.assign(window, { ExerciseIntro, ExerciseResult, ExerciseTopBar, MetaChip, IntensityCard, IntensitySlider, SegRow });
