// Data layer — Supabase-shaped adapter, persisted in localStorage
// When ready to connect real Supabase, swap implementations preserving API.
//
// Tables:
//   profiles      { id, name, email, avatar, bio, level, xp, streak, created_at }
//   sessions      { id, user_id, exercise_id, level, started_at, finished_at, score, errors, time_seconds, wpm, comprehension }
//   exercise_progress { user_id, exercise_id, current_level, best_score, total_sessions, mastery }
//   library_items { id, user_id, kind ('book'|'text'), title, author, content, words, progress, last_read_at, source }
//   user_prefs    { user_id, wpm_default, font_family, font_size, theme, accessibility {dyslexia, contrast, reduce_motion}, daily_goal {xp, minutes, exercises}, notifications {enabled, time, reminder} }

const STORAGE_KEY = 'lectorapp_db_v1';

const SEED = () => ({
  profile: {
    id: 'u_demo',
    name: 'Sofía',
    email: 'sofia@lectorapp.com',
    avatar: 'focus',
    bio: 'Aprendiendo a leer mejor cada día',
    level: 4,
    xp: 1240,
    streak: 7,
    created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  exercise_progress: {
    schulte: { current_level: 3, best_score: 0.92, total_sessions: 18, mastery: 0.78, last_score: 0.85 },
    reading: { current_level: 4, best_score: 0.88, total_sessions: 22, mastery: 0.82, last_score: 0.81 },
    wordspan: { current_level: 2, best_score: 0.80, total_sessions: 12, mastery: 0.55, last_score: 0.66 },
    loci: { current_level: 1, best_score: 1.00, total_sessions: 6, mastery: 0.45, last_score: 1.00 },
    comprehension: { current_level: 3, best_score: 1.00, total_sessions: 14, mastery: 0.70, last_score: 0.66 },
    boss: { current_level: 1, best_score: 0.85, total_sessions: 2, mastery: 0.40, last_score: 0.85 },
  },
  prefs: {
    wpm_default: 280,
    font_family: 'Lexend',
    font_size: 16,
    accessibility: { dyslexia: false, contrast: false, reduce_motion: false },
    daily_goal: { xp: 200, minutes: 15, exercises: 3 },
    notifications: { enabled: true, time: '20:00', reminder: true },
  },
  sessions: generateMockSessions(),
  library: [
    { id: 'l1', kind: 'book', title: 'El cerebro lector', author: 'S. Dehaene', words: 95000, progress: 0.34, last_read_at: Date.now() - 2 * 86400000, cover_color: '#3B82F6' },
    { id: 'l2', kind: 'book', title: 'Atomic Habits', author: 'J. Clear', words: 70000, progress: 0.78, last_read_at: Date.now() - 86400000, cover_color: '#22C55E' },
    { id: 'l3', kind: 'book', title: 'Sapiens', author: 'Y. N. Harari', words: 130000, progress: 0.12, last_read_at: Date.now() - 7 * 86400000, cover_color: '#F97316' },
    { id: 'l4', kind: 'text', title: 'Ensayo: Atención sostenida', author: 'Investigación 2024', words: 850, progress: 0, last_read_at: null, cover_color: '#8B5CF6' },
  ],
});

function generateMockSessions() {
  const out = [];
  const now = Date.now();
  const exs = ['schulte', 'reading', 'wordspan', 'loci', 'comprehension'];
  for (let d = 28; d >= 0; d--) {
    const day = now - d * 86400000;
    const count = Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const ex = exs[Math.floor(Math.random() * exs.length)];
      out.push({
        id: 's_' + day + '_' + i,
        exercise_id: ex,
        level: 1 + Math.floor(Math.random() * 4),
        finished_at: day + i * 600000,
        score: 0.5 + Math.random() * 0.5,
        time_seconds: 60 + Math.random() * 200,
        wpm: ex === 'reading' ? 200 + Math.random() * 250 : null,
        comprehension: ex === 'comprehension' || ex === 'reading' ? 0.6 + Math.random() * 0.4 : null,
      });
    }
  }
  return out;
}

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = SEED();
  saveDB(fresh);
  return fresh;
}
function saveDB(db) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch {}
}

// Supabase-shaped client (.from('table').select() / .insert() / .update())
function createClient() {
  let db = loadDB();
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => fn(db));

  return {
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    db: () => db,
    refresh: () => { db = loadDB(); notify(); },
    reset: () => { db = SEED(); saveDB(db); notify(); },

    profile: {
      get: () => db.profile,
      update: (patch) => { db.profile = { ...db.profile, ...patch }; saveDB(db); notify(); return db.profile; },
      addXP: (amount) => {
        db.profile.xp += amount;
        // level threshold
        const newLevel = Math.floor(db.profile.xp / 500) + 1;
        if (newLevel > db.profile.level) db.profile.level = newLevel;
        saveDB(db); notify();
        return { newXP: db.profile.xp, newLevel: db.profile.level };
      },
    },

    progress: {
      all: () => db.exercise_progress,
      get: (exId) => db.exercise_progress[exId] || { current_level: 1, best_score: 0, total_sessions: 0, mastery: 0, last_score: 0 },
      update: (exId, patch) => {
        db.exercise_progress[exId] = { ...db.exercise_progress[exId], ...patch };
        saveDB(db); notify();
      },
    },

    sessions: {
      list: (filter) => {
        let s = db.sessions || [];
        if (filter?.exercise_id) s = s.filter(x => x.exercise_id === filter.exercise_id);
        if (filter?.since) s = s.filter(x => x.finished_at >= filter.since);
        return s.sort((a, b) => b.finished_at - a.finished_at);
      },
      insert: (sess) => {
        const row = { id: 's_' + Date.now(), finished_at: Date.now(), ...sess };
        db.sessions.unshift(row);
        if (db.sessions.length > 200) db.sessions.length = 200;
        saveDB(db); notify();
        return row;
      },
    },

    prefs: {
      get: () => db.prefs,
      update: (patch) => { db.prefs = { ...db.prefs, ...patch }; saveDB(db); notify(); return db.prefs; },
    },

    library: {
      list: () => db.library || [],
      get: (id) => (db.library || []).find(b => b.id === id),
      insert: (item) => {
        const row = { id: 'l_' + Date.now(), progress: 0, last_read_at: null, cover_color: '#22C55E', ...item };
        db.library.unshift(row);
        saveDB(db); notify();
        return row;
      },
      update: (id, patch) => {
        db.library = db.library.map(b => b.id === id ? { ...b, ...patch } : b);
        saveDB(db); notify();
      },
      remove: (id) => {
        db.library = db.library.filter(b => b.id !== id);
        saveDB(db); notify();
      },
    },
  };
}

const supa = createClient();

// React hook for live data
function useDB() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => supa.on(() => force()), []);
  return supa;
}

// ---------- Difficulty engine ----------
// Levels per exercise (data-driven, easy to extend)
const DIFFICULTY = {
  schulte: [
    { level: 1, label: '3×3 Fácil', size: 3, target_time: 12 },
    { level: 2, label: '4×4 Medio', size: 4, target_time: 25 },
    { level: 3, label: '5×5 Estándar', size: 5, target_time: 50 },
    { level: 4, label: '6×6 Difícil', size: 6, target_time: 80 },
    { level: 5, label: '7×7 Experto', size: 7, target_time: 130 },
  ],
  wordspan: [
    { level: 1, label: '4 palabras', count: 4, show_ms: 1300 },
    { level: 2, label: '5 palabras', count: 5, show_ms: 1200 },
    { level: 3, label: '6 palabras', count: 6, show_ms: 1100 },
    { level: 4, label: '7 palabras rápido', count: 7, show_ms: 900 },
    { level: 5, label: '9 palabras experto', count: 9, show_ms: 800 },
  ],
  loci: [
    { level: 1, label: '5 objetos', count: 5 },
    { level: 2, label: '6 objetos', count: 6 },
    { level: 3, label: '7 objetos', count: 7 },
    { level: 4, label: '8 objetos', count: 8 },
  ],
  comprehension: [
    { level: 1, label: 'Pasaje corto', length: 'short', q_count: 3 },
    { level: 2, label: 'Pasaje medio', length: 'medium', q_count: 4 },
    { level: 3, label: 'Pasaje largo', length: 'long', q_count: 5 },
  ],
  reading: [
    { level: 1, label: '200 WPM', wpm: 200 },
    { level: 2, label: '250 WPM', wpm: 250 },
    { level: 3, label: '300 WPM', wpm: 300 },
    { level: 4, label: '400 WPM', wpm: 400 },
    { level: 5, label: '500+ WPM', wpm: 500 },
  ],
  boss: [
    { level: 1, label: 'Jefe Enfoque', zone: 'focus' },
    { level: 2, label: 'Jefe Memoria', zone: 'memory' },
    { level: 3, label: 'Jefe Velocidad', zone: 'speed' },
  ],
};

function getLevel(exId, level) {
  const list = DIFFICULTY[exId] || [];
  return list[Math.min(list.length - 1, Math.max(0, level - 1))] || list[0];
}

// Adaptive: returns next recommended level after a session
// score in [0,1]. >0.85 → up, <0.55 → down, else hold. Micro-adjusts via mastery.
function adaptLevel(exId, score, currentLevel, mastery = 0) {
  const max = (DIFFICULTY[exId] || []).length;
  if (score >= 0.85 && currentLevel < max) {
    return { newLevel: currentLevel + 1, masteryDelta: +0.15, reason: 'up' };
  }
  if (score < 0.55 && currentLevel > 1) {
    return { newLevel: currentLevel - 1, masteryDelta: -0.10, reason: 'down' };
  }
  return { newLevel: currentLevel, masteryDelta: score >= 0.7 ? +0.05 : 0, reason: 'hold' };
}

Object.assign(window, { supa, useDB, DIFFICULTY, getLevel, adaptLevel });
