// Profile v2 — full, editable, with goals, prefs, accessibility, plan

function ProfileScreen({ onNav, theme }) {
  const primary = theme?.primary || '#22C55E';
  const db = useDB();
  const profile = db.profile.get();
  const prefs = db.prefs.get();
  const sessions = db.sessions.list();
  const progress = db.progress.all();

  const [editing, setEditing] = React.useState(false);
  const [openSheet, setOpenSheet] = React.useState(null); // 'goals' | 'prefs' | 'a11y' | 'plan' | 'about'

  // Computed stats
  const totalMinutes = Math.round(sessions.reduce((s, x) => s + (x.time_seconds || 0), 0) / 60);
  const wpmSessions = sessions.filter(s => s.wpm).map(s => s.wpm);
  const maxWpm = wpmSessions.length ? Math.round(Math.max(...wpmSessions)) : 0;
  const booksFinished = db.library.list().filter(b => b.progress >= 1).length;
  const masteryAvg = Object.values(progress).reduce((s, p) => s + p.mastery, 0) / Object.values(progress).length;

  const stats = [
    { label: 'Minutos', value: totalMinutes, icon: 'clock', accent: '#F97316' },
    { label: 'WPM máx', value: maxWpm, icon: 'gauge', accent: '#22C55E' },
    { label: 'Libros', value: booksFinished, icon: 'book', accent: '#3B82F6' },
    { label: 'Maestría', value: Math.round(masteryAvg * 100) + '%', icon: 'brain', accent: '#8B5CF6' },
  ];

  const xpToNext = 500 - (profile.xp % 500);
  const levelProgress = (profile.xp % 500) / 500;

  const achievements = [
    { id: 'streak7',  icon: 'flame',    title: 'Racha 7',         color: '#EF4444', cond: profile.streak >= 7 },
    { id: 'first',    icon: 'book',     title: 'Primer libro',    color: '#3B82F6', cond: booksFinished >= 1 },
    { id: 'wpm300',   icon: 'bolt',     title: '300 WPM',         color: '#F97316', cond: maxWpm >= 300 },
    { id: 'loci',     icon: 'palace',   title: 'Maestro Loci',    color: '#8B5CF6', cond: progress.loci?.mastery >= 0.8 },
    { id: 'comp90',   icon: 'target',   title: '90% comprensión', color: '#22C55E', cond: progress.comprehension?.best_score >= 0.9 },
    { id: 'lvl10',    icon: 'crown',    title: 'Nivel 10',        color: '#D97706', cond: profile.level >= 10 },
    { id: 'sessions', icon: 'medal',    title: '50 sesiones',     color: '#EAB308', cond: sessions.length >= 50 },
    { id: 'schulte',  icon: 'grid',     title: 'Schulte 7×7',     color: '#16A34A', cond: progress.schulte?.current_level >= 5 },
    { id: 'speed',    icon: 'rocket',   title: '500 WPM',         color: '#DC2626', cond: maxWpm >= 500 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      {/* Hero */}
      <div style={{ padding: '52px 20px 18px', background: `linear-gradient(160deg, ${primary}10, #fff 60%)`, borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Perfil</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setEditing(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
            <GIcon name="settings" size={32} accent="#6B7280" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AvatarCircle avatar={profile.avatar} primary={primary} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: -0.3 }}>{profile.name}</h1>
            <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#6B7280', marginTop: 2 }}>nivel {profile.level} · {profile.bio}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${levelProgress * 100}%`, height: '100%', background: primary, borderRadius: 3, transition: 'width 600ms' }} />
              </div>
              <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: primary }}>{xpToNext} XP al lvl {profile.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 140px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
              <GIcon name={s.icon} size={32} accent={s.accent} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, border: '1px solid #F3F4F6', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <GIcon name="trophy" size={22} accent="#EAB308" />
            <span style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 800, color: '#111827' }}>Logros</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF' }}>{achievements.filter(a => a.cond).length}/{achievements.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {achievements.map(a => {
              const unlocked = a.cond;
              return (
                <div key={a.id} style={{
                  padding: '12px 6px 10px', textAlign: 'center',
                  background: unlocked ? `${a.color}10` : '#F9FAFB',
                  border: unlocked ? `1px solid ${a.color}30` : '1px solid #F3F4F6',
                  borderRadius: 14,
                  opacity: unlocked ? 1 : 0.5,
                  position: 'relative',
                }}>
                  <div style={{
                    width: 38, height: 38, margin: '0 auto 6px',
                    borderRadius: '50%',
                    background: unlocked ? `${a.color}20` : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <GIcon name={unlocked ? a.icon : 'lock'} size={26} accent={unlocked ? a.color : '#9CA3AF'} />
                  </div>
                  <div style={{
                    fontFamily: 'Nunito', fontSize: 9, fontWeight: 900,
                    color: unlocked ? '#111827' : '#9CA3AF',
                    lineHeight: 1.2, letterSpacing: 0.2,
                  }}>{a.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings rows */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', overflow: 'hidden', marginBottom: 12 }}>
          <SettingRow icon="target" label="Meta diaria" value={`${prefs.daily_goal.minutes} min · ${prefs.daily_goal.xp} XP`} accent="#22C55E" onClick={() => setOpenSheet('goals')} />
          <SettingRow icon="gauge" label="WPM por defecto" value={prefs.wpm_default} accent="#F97316" onClick={() => setOpenSheet('prefs')} />
          <SettingRow icon="bell" label="Notificaciones" value={prefs.notifications.enabled ? prefs.notifications.time : 'Off'} accent="#3B82F6" onClick={() => setOpenSheet('prefs')} />
          <SettingRow icon="brain" label="Accesibilidad" value={Object.values(prefs.accessibility).filter(Boolean).length ? 'Personalizado' : 'Estándar'} accent="#8B5CF6" onClick={() => setOpenSheet('a11y')} last />
        </div>

        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6', overflow: 'hidden', marginBottom: 12 }}>
          <SettingRow icon="trophy" label="Plan" value="Gratuito" accent="#EAB308" badge="PRO" onClick={() => setOpenSheet('plan')} />
          <SettingRow icon="book" label="Acerca de" value="v1.0" accent="#6B7280" onClick={() => setOpenSheet('about')} last />
        </div>

        <button onClick={() => onNav('welcome')} style={{
          width: '100%', padding: 13, background: '#fff', border: '1.5px solid #FECACA', borderRadius: 14,
          fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: '#EF4444',
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Cerrar sesión</button>
      </div>

      {editing && <EditProfileSheet profile={profile} onClose={() => setEditing(false)} onSave={(p) => { db.profile.update(p); setEditing(false); }} accent={primary} />}
      {openSheet === 'goals' && <GoalsSheet prefs={prefs} onClose={() => setOpenSheet(null)} onSave={(g) => { db.prefs.update({ daily_goal: g }); setOpenSheet(null); }} accent={primary} />}
      {openSheet === 'prefs' && <PrefsSheet prefs={prefs} onClose={() => setOpenSheet(null)} onSave={(p) => { db.prefs.update(p); setOpenSheet(null); }} accent={primary} />}
      {openSheet === 'a11y' && <A11ySheet prefs={prefs} onClose={() => setOpenSheet(null)} onSave={(a) => { db.prefs.update({ accessibility: a }); setOpenSheet(null); }} accent={primary} />}
      {openSheet === 'plan' && <PlanSheet onClose={() => setOpenSheet(null)} accent={primary} />}
      {openSheet === 'about' && <AboutSheet onClose={() => setOpenSheet(null)} onReset={() => { db.reset(); setOpenSheet(null); }} accent={primary} />}

      <GlassNavbar current="profile" onNav={onNav} accent={primary} />
    </div>
  );
}

function AvatarCircle({ avatar, primary }) {
  const Char = avatar === 'calm' ? Calm : avatar === 'joy' ? Joy : avatar === 'swift' ? Swift : Focus;
  return (
    <div style={{
      width: 72, height: 72, borderRadius: 24,
      background: '#fff', border: `3px solid ${primary}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 6px 16px ${primary}30`,
    }}>
      <Char size={58} />
    </div>
  );
}

function SettingRow({ icon, label, value, accent, onClick, last, badge }) {
  return (
    <div onClick={onClick} style={{
      padding: 14, display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : '1px solid #F3F4F6', cursor: 'pointer',
    }}>
      <GIcon name={icon} size={30} accent={accent} />
      <span style={{ fontFamily: 'Lexend', fontSize: 14, color: '#111827', fontWeight: 500, flex: 1 }}>{label}</span>
      {badge && <span style={{ background: '#FEF3C7', color: '#B45309', fontFamily: 'Nunito', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6, letterSpacing: 0.5 }}>{badge}</span>}
      {value && <span style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 800, color: '#6B7280' }}>{value}</span>}
      <span style={{ color: '#D1D5DB', fontSize: 18 }}>›</span>
    </div>
  );
}

function EditProfileSheet({ profile, onClose, onSave, accent }) {
  const [name, setName] = React.useState(profile.name);
  const [bio, setBio] = React.useState(profile.bio);
  const [avatar, setAvatar] = React.useState(profile.avatar);
  const avatars = [
    { k: 'focus', C: Focus }, { k: 'calm', C: Calm },
    { k: 'joy', C: Joy }, { k: 'swift', C: Swift },
  ];
  return (
    <Sheet onClose={onClose} title="Editar perfil">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>Avatar</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            {avatars.map(a => (
              <button key={a.k} onClick={() => setAvatar(a.k)} style={{
                width: 56, height: 56, borderRadius: 18, background: '#fff',
                border: avatar === a.k ? `2.5px solid ${accent}` : '2px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}><a.C size={42} /></button>
            ))}
          </div>
        </div>
        <div><Label>Nombre</Label><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div>
        <div><Label>Bio</Label><input value={bio} onChange={e => setBio(e.target.value)} style={inputStyle} placeholder="Tu objetivo personal" /></div>
        <button onClick={() => onSave({ name, bio, avatar })} style={primaryBtn(accent)}>Guardar</button>
      </div>
    </Sheet>
  );
}

function GoalsSheet({ prefs, onClose, onSave, accent }) {
  const [g, setG] = React.useState(prefs.daily_goal);
  return (
    <Sheet onClose={onClose} title="Meta diaria">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SliderRow label="Minutos al día" value={g.minutes} min={5} max={60} step={5} onChange={(v) => setG({ ...g, minutes: v })} accent={accent} suffix="min" />
        <SliderRow label="XP al día" value={g.xp} min={50} max={500} step={50} onChange={(v) => setG({ ...g, xp: v })} accent={accent} suffix="XP" />
        <SliderRow label="Ejercicios al día" value={g.exercises} min={1} max={10} step={1} onChange={(v) => setG({ ...g, exercises: v })} accent={accent} suffix="" />
        <button onClick={() => onSave(g)} style={primaryBtn(accent)}>Guardar meta</button>
      </div>
    </Sheet>
  );
}

function PrefsSheet({ prefs, onClose, onSave, accent }) {
  const [wpm, setWpm] = React.useState(prefs.wpm_default);
  const [font, setFont] = React.useState(prefs.font_family);
  const [size, setSize] = React.useState(prefs.font_size);
  const [notif, setNotif] = React.useState(prefs.notifications);
  return (
    <Sheet onClose={onClose} title="Preferencias">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SliderRow label="WPM por defecto" value={wpm} min={150} max={800} step={10} onChange={setWpm} accent={accent} suffix="WPM" />
        <div>
          <Label>Tipografía</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Lexend', 'Nunito', 'Georgia'].map(f => (
              <button key={f} onClick={() => setFont(f)} style={{
                flex: 1, padding: 10, border: 'none', borderRadius: 10,
                background: font === f ? accent : '#F3F4F6',
                color: font === f ? '#fff' : '#374151',
                fontFamily: f, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <SliderRow label="Tamaño de fuente" value={size} min={12} max={22} step={1} onChange={setSize} accent={accent} suffix="px" />
        <ToggleRow label="Notificaciones" value={notif.enabled} onChange={v => setNotif({ ...notif, enabled: v })} accent={accent} />
        {notif.enabled && (
          <div>
            <Label>Hora de recordatorio</Label>
            <input type="time" value={notif.time} onChange={e => setNotif({ ...notif, time: e.target.value })} style={inputStyle} />
          </div>
        )}
        <button onClick={() => onSave({ wpm_default: wpm, font_family: font, font_size: size, notifications: notif })} style={primaryBtn(accent)}>Guardar</button>
      </div>
    </Sheet>
  );
}

function A11ySheet({ prefs, onClose, onSave, accent }) {
  const [a, setA] = React.useState(prefs.accessibility);
  return (
    <Sheet onClose={onClose} title="Accesibilidad">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ToggleRow label="Tipografía dislexia (OpenDyslexic)" value={a.dyslexia} onChange={v => setA({ ...a, dyslexia: v })} accent={accent} />
        <ToggleRow label="Alto contraste" value={a.contrast} onChange={v => setA({ ...a, contrast: v })} accent={accent} />
        <ToggleRow label="Reducir movimiento" value={a.reduce_motion} onChange={v => setA({ ...a, reduce_motion: v })} accent={accent} />
        <button onClick={() => onSave(a)} style={{ ...primaryBtn(accent), marginTop: 10 }}>Aplicar</button>
      </div>
    </Sheet>
  );
}

function PlanSheet({ onClose, accent }) {
  return (
    <Sheet onClose={onClose} title="LectorApp PRO">
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        borderRadius: 18, padding: 18, color: '#fff', marginBottom: 14,
      }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>Plan PRO</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 26, fontWeight: 900, marginTop: 4 }}>$4.99 <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>/mes</span></div>
        <div style={{ fontFamily: 'Lexend', fontSize: 12, marginTop: 6, opacity: 0.95 }}>Desbloquea todo tu potencial.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[
          'Ejercicios ilimitados',
          'Análisis avanzado de WPM y comprensión',
          'Catálogo completo (200+ libros)',
          'Modo offline',
          'Sin anuncios',
        ].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: accent + '15', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>✓</div>
            <span style={{ fontFamily: 'Lexend', fontSize: 13, color: '#374151' }}>{f}</span>
          </div>
        ))}
      </div>
      <button style={{ ...primaryBtn(accent) }}>Probar 7 días gratis</button>
    </Sheet>
  );
}

function AboutSheet({ onClose, onReset, accent }) {
  return (
    <Sheet onClose={onClose} title="Acerca de LectorApp">
      <div style={{ fontFamily: 'Lexend', fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px' }}>LectorApp es tu coach de lectura personalizado, diseñado con base en investigación de neurociencia cognitiva.</p>
        <p style={{ margin: '0 0 8px' }}><strong>Versión:</strong> 1.0.0</p>
        <p style={{ margin: 0 }}><strong>Datos:</strong> sincronizados localmente. Conectaremos a Supabase cuando publiquemos.</p>
      </div>
      <button onClick={() => { if (confirm('¿Resetear todos los datos?')) onReset(); }} style={{
        width: '100%', padding: 12, background: '#fff', border: '1.5px solid #FECACA', borderRadius: 12,
        fontFamily: 'Nunito', fontSize: 12, fontWeight: 900, color: '#EF4444', cursor: 'pointer',
      }}>Resetear datos del prototipo</button>
    </Sheet>
  );
}

// Reusable form bits
function Label({ children }) {
  return <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{children}</div>;
}
function SliderRow({ label, value, min, max, step, onChange, accent, suffix }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Label>{label}</Label>
        <span style={{ fontFamily: 'Nunito', fontSize: 16, fontWeight: 900, color: accent }}>{value}<span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 3 }}>{suffix}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
    </div>
  );
}
function ToggleRow({ label, value, onChange, accent }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', cursor: 'pointer' }}>
      <span style={{ flex: 1, fontFamily: 'Lexend', fontSize: 13, color: '#111827' }}>{label}</span>
      <div style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? accent : '#E5E7EB',
        position: 'relative', transition: 'background 200ms',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20,
          background: '#fff', borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)', transition: 'left 200ms',
        }} />
      </div>
    </div>
  );
}

function primaryBtn(accent) {
  return {
    width: '100%', marginTop: 6, padding: 14,
    background: accent, border: 'none', borderRadius: 12,
    fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#fff',
    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
    boxShadow: `0 6px 14px ${accent}40`,
  };
}

Object.assign(window, { ProfileScreen, EditProfileSheet, GoalsSheet, PrefsSheet, A11ySheet, PlanSheet, AboutSheet, AvatarCircle, SettingRow, Label, SliderRow, ToggleRow });
