// Dashboard PRO — full progress analytics with trends, comparatives, best scores

function DashboardScreen({ onNav, theme, onLaunchExercise }) {
  const primary = theme?.primary || '#22C55E';
  const db = useDB();
  const profile = db.profile.get();
  const sessions = db.sessions.list();
  const progress = db.progress.all();
  const [tab, setTab] = React.useState('overview'); // overview | exercises | history

  // Compute KPIs
  const last7d = sessions.filter(s => s.finished_at >= Date.now() - 7 * 86400000);
  const prev7d = sessions.filter(s => s.finished_at >= Date.now() - 14 * 86400000 && s.finished_at < Date.now() - 7 * 86400000);
  const totalMin = Math.round(last7d.reduce((s, x) => s + (x.time_seconds || 0), 0) / 60);
  const prevMin = Math.round(prev7d.reduce((s, x) => s + (x.time_seconds || 0), 0) / 60);
  const minDelta = totalMin - prevMin;

  const wpmRecent = sessions.filter(s => s.wpm).slice(0, 14).map(s => s.wpm);
  const avgWpm = wpmRecent.length ? Math.round(wpmRecent.reduce((a, b) => a + b, 0) / wpmRecent.length) : 0;
  const maxWpm = wpmRecent.length ? Math.round(Math.max(...wpmRecent)) : 0;

  const compRecent = sessions.filter(s => s.comprehension).slice(0, 14).map(s => s.comprehension);
  const avgComp = compRecent.length ? Math.round((compRecent.reduce((a, b) => a + b, 0) / compRecent.length) * 100) : 0;

  // Heatmap — last 28 days
  const heatmap = Array.from({ length: 28 }).map((_, i) => {
    const dayStart = Date.now() - (27 - i) * 86400000;
    const count = sessions.filter(s => s.finished_at >= dayStart && s.finished_at < dayStart + 86400000).length;
    return count;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 12px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Tu progreso</div>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#111827', margin: '2px 0 0', letterSpacing: -0.3 }}>Dashboard</h1>
          </div>
          <div style={{ flex: 1 }} />
          <Joy size={42} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'exercises', label: 'Ejercicios' },
            { id: 'history', label: 'Historial' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '8px 0', border: 'none',
              background: tab === t.id ? '#111827' : '#F3F4F6',
              color: tab === t.id ? '#fff' : '#6B7280',
              fontFamily: 'Nunito', fontSize: 11, fontWeight: 800,
              borderRadius: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 140px' }}>
        {tab === 'overview' && <OverviewTab kpis={{ totalMin, minDelta, avgWpm, maxWpm, avgComp, streak: profile.streak }} heatmap={heatmap} sessions={sessions} primary={primary} />}
        {tab === 'exercises' && <ExercisesTab progress={progress} sessions={sessions} primary={primary} onLaunchExercise={onLaunchExercise} />}
        {tab === 'history' && <HistoryTab sessions={sessions} primary={primary} />}
      </div>

      <GlassNavbar current="dashboard" onNav={onNav} accent={primary} />
    </div>
  );
}

function OverviewTab({ kpis, heatmap, sessions, primary }) {
  return (
    <>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <KpiCard icon="clock" label="Minutos / 7d" value={kpis.totalMin} delta={kpis.minDelta} accent="#F97316" />
        <KpiCard icon="flame" label="Racha" value={kpis.streak} unit="d" accent="#EF4444" />
        <KpiCard icon="gauge" label="WPM medio" value={kpis.avgWpm} accent="#22C55E" />
        <KpiCard icon="brain" label="Comprensión" value={kpis.avgComp} unit="%" accent="#8B5CF6" />
      </div>

      {/* WPM trend mini-chart */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Tendencia WPM</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', marginTop: 2 }}>{kpis.avgWpm} <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF' }}>medio · max {kpis.maxWpm}</span></div>
          </div>
          <div style={{ flex: 1 }} />
        </div>
        <SparkChart data={sessions.filter(s => s.wpm).slice(0, 12).reverse().map(s => s.wpm)} accent="#F97316" />
      </Card>

      {/* Heatmap */}
      <Card>
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Actividad · 4 sem</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {heatmap.map((c, i) => {
            const intensity = c === 0 ? 0 : Math.min(1, c / 4);
            const bg = c === 0 ? '#F3F4F6' : `rgba(34, 197, 94, ${0.15 + intensity * 0.85})`;
            return <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: 5, background: bg }} />;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Nunito', fontSize: 9, fontWeight: 700, color: '#9CA3AF' }}>
          <span>hace 4 sem</span><span>hoy</span>
        </div>
      </Card>

      {/* Quick comparative */}
      <Card>
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Esta semana vs anterior</div>
        <CompareBar label="Minutos" thisVal={kpis.totalMin} prevVal={Math.max(1, kpis.totalMin - kpis.minDelta)} accent="#F97316" />
      </Card>
    </>
  );
}

function ExercisesTab({ progress, sessions, primary, onLaunchExercise }) {
  const ids = ['schulte', 'reading', 'wordspan', 'loci', 'comprehension', 'boss'];
  const meta = {
    schulte:       { name: 'Tabla Schulte',  color: '#22C55E', icon: 'target',  desc: 'Visión periférica' },
    reading:       { name: 'Lectura Focal',  color: '#F97316', icon: 'gauge',   desc: 'WPM + comprensión' },
    wordspan:      { name: 'Word Span',      color: '#3B82F6', icon: 'brain',   desc: 'Memoria de trabajo' },
    loci:          { name: 'Método Loci',    color: '#8B5CF6', icon: 'compass', desc: 'Memoria espacial' },
    comprehension: { name: 'Comprensión',    color: '#EAB308', icon: 'book',    desc: 'Lectura + Q&A' },
    boss:          { name: 'Jefes',          color: '#DC2626', icon: 'trophy',  desc: 'Combate de zona' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#9CA3AF', marginBottom: 2, padding: '0 2px' }}>
        Toca una tarjeta para practicar directamente.
      </div>
      {ids.map(id => {
        const p = progress[id] || { current_level: 1, best_score: 0, total_sessions: 0, mastery: 0 };
        const m = meta[id];
        const launchable = !!onLaunchExercise;
        return (
          <button
            key={id}
            onClick={() => launchable && onLaunchExercise(id)}
            disabled={!launchable}
            style={{
              all: 'unset',
              display: 'block', cursor: launchable ? 'pointer' : 'default',
              background: '#fff', borderRadius: 18, padding: 14,
              border: '1px solid #F3F4F6',
              transition: 'transform 140ms ease, box-shadow 200ms ease, border-color 200ms',
              boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
              width: '100%', boxSizing: 'border-box',
            }}
            onMouseDown={(e) => launchable && (e.currentTarget.style.transform = 'scale(0.985)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${m.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GIcon name={m.icon} size={28} accent={m.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#111827' }}>{m.name}</div>
                <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  {m.desc} · Nv. {p.current_level} · {p.total_sessions || 0} ses.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Nunito', fontSize: 17, fontWeight: 900, color: m.color }}>{Math.round((p.mastery || 0) * 100)}%</div>
                <div style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>maestría</div>
              </div>
            </div>
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(p.mastery || 0) * 100}%`, background: m.color, borderRadius: 3, transition: 'width 600ms' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 12, fontFamily: 'Nunito', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                <span>Mejor <strong style={{ color: '#111827' }}>{Math.round((p.best_score || 0) * 100)}%</strong></span>
                <span>Última <strong style={{ color: '#111827' }}>{Math.round((p.last_score || 0) * 100)}%</strong></span>
              </div>
              {launchable && (
                <div style={{
                  fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, letterSpacing: 0.6,
                  color: m.color, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  Practicar <span style={{ fontSize: 13 }}>›</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function HistoryTab({ sessions, primary }) {
  const meta = {
    schulte: { name: 'Schulte', color: '#22C55E' },
    reading: { name: 'Lectura', color: '#F97316' },
    wordspan: { name: 'Word Span', color: '#3B82F6' },
    loci: { name: 'Loci', color: '#8B5CF6' },
    comprehension: { name: 'Comprensión', color: '#EAB308' },
    boss: { name: 'Jefe', color: '#DC2626' },
  };

  if (!sessions.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontFamily: 'Lexend', fontSize: 13 }}>Aún no hay sesiones registradas.</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
      {sessions.slice(0, 30).map((s, i, arr) => {
        const m = meta[s.exercise_id] || { name: s.exercise_id, color: '#6B7280' };
        const date = new Date(s.finished_at);
        const daysAgo = Math.floor((Date.now() - s.finished_at) / 86400000);
        const dateLabel = daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo}d`;
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: m.color, borderRadius: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 800, color: '#111827' }}>{m.name} <span style={{ fontWeight: 700, color: '#9CA3AF', fontSize: 10 }}>· nivel {s.level}</span></div>
              <div style={{ fontFamily: 'Lexend', fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{dateLabel} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: m.color }}>{Math.round(s.score * 100)}%</div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon, label, value, unit, delta, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <GIcon name={icon} size={24} accent={accent} />
        <span style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 3, fontWeight: 700 }}>{unit}</span>}
      </div>
      {delta !== undefined && (
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: delta >= 0 ? '#22C55E' : '#EF4444', marginTop: 4 }}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} vs anterior
        </div>
      )}
    </div>
  );
}

function Card({ children }) {
  return <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid #F3F4F6', marginBottom: 10 }}>{children}</div>;
}

function SparkChart({ data, accent }) {
  if (!data || data.length < 2) {
    return <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#9CA3AF', padding: '16px 0' }}>Datos insuficientes</div>;
  }
  const w = 280, h = 64;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sparkGrad)" />
      <path d={path} stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={accent} stroke="#fff" strokeWidth="2" />)}
    </svg>
  );
}

function CompareBar({ label, thisVal, prevVal, accent }) {
  const max = Math.max(thisVal, prevVal, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <BarRow label={`Esta sem · ${label}`} value={thisVal} pct={thisVal / max} accent={accent} />
      <BarRow label={`Anterior · ${label}`} value={prevVal} pct={prevVal / max} accent="#9CA3AF" />
    </div>
  );
}
function BarRow({ label, value, pct, accent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Nunito', fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: '#111827', fontWeight: 900 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(2, pct * 100)}%`, background: accent, borderRadius: 4, transition: 'width 600ms' }} />
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
