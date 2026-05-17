// Rewards / Tienda — XP shop with deep catalog of unlockables.

const REWARDS = [
  // === THEMES ===
  { id: 'theme-green', cat: 'themes', type: 'theme', title: 'Esmeralda', desc: 'El clásico de Focus', cost: 0, value: '#22C55E', owned: true, equipped: true },
  { id: 'theme-blue', cat: 'themes', type: 'theme', title: 'Océano', desc: 'Calma azul profunda', cost: 400, value: '#3B82F6' },
  { id: 'theme-amber', cat: 'themes', type: 'theme', title: 'Ámbar', desc: 'Joy en estado puro', cost: 600, value: '#EAB308' },
  { id: 'theme-sunset', cat: 'themes', type: 'theme', title: 'Atardecer', desc: 'La energía de Swift', cost: 800, value: '#F97316' },
  { id: 'theme-violet', cat: 'themes', type: 'theme', title: 'Violeta', desc: 'Concentración cósmica', cost: 1200, value: '#8B5CF6' },
  { id: 'theme-rose', cat: 'themes', type: 'theme', title: 'Rosa', desc: 'Cálido y vibrante', cost: 1000, value: '#EC4899' },
  { id: 'theme-mint', cat: 'themes', type: 'theme', title: 'Menta', desc: 'Frescura serena', cost: 900, value: '#10B981' },
  { id: 'theme-night', cat: 'themes', type: 'theme', title: 'Modo Noche', desc: 'Para lectores nocturnos', cost: 2000, value: '#111827', locked: true, requires: 'Nivel 10' },

  // === MASCOT AVATARS ===
  { id: 'avatar-focus', cat: 'avatars', type: 'avatar', title: 'Focus', desc: 'El guía del enfoque', cost: 500, mascot: 'focus' },
  { id: 'avatar-calm', cat: 'avatars', type: 'avatar', title: 'Calm', desc: 'La tranquilidad', cost: 500, mascot: 'calm' },
  { id: 'avatar-joy', cat: 'avatars', type: 'avatar', title: 'Joy', desc: 'Alegría brillante', cost: 700, mascot: 'joy' },
  { id: 'avatar-swift', cat: 'avatars', type: 'avatar', title: 'Swift', desc: 'Velocidad pura', cost: 700, mascot: 'swift' },
  { id: 'avatar-memo', cat: 'avatars', type: 'avatar', title: 'Memo', desc: 'Memoria afilada', cost: 900, mascot: 'memo' },
  { id: 'avatar-loci', cat: 'avatars', type: 'avatar', title: 'Loci', desc: 'Cartógrafo mental', cost: 900, mascot: 'loci' },
  { id: 'avatar-boss', cat: 'avatars', type: 'avatar', title: 'Sombra', desc: 'El rival vencido', cost: 1500, mascot: 'boss', locked: true, requires: 'Derrota a un jefe' },

  // === POWER-UPS — consumibles ===
  { id: 'pw-streak', cat: 'powerups', type: 'powerup', title: 'Congelador de racha', desc: 'Protege tu racha 1 día sin practicar', cost: 350, icon: 'snowflake', color: '#3B82F6', consumable: true },
  { id: 'pw-xp2x', cat: 'powerups', type: 'powerup', title: 'XP x2', desc: 'Doble XP en tu próxima sesión', cost: 500, icon: 'bolt', color: '#EAB308', consumable: true },
  { id: 'pw-hint', cat: 'powerups', type: 'powerup', title: 'Pista de loci', desc: 'Revela 1 habitación durante el recall', cost: 200, icon: 'sparkle', color: '#8B5CF6', consumable: true },
  { id: 'pw-time', cat: 'powerups', type: 'powerup', title: '+10s extra', desc: 'Más tiempo en pruebas cronometradas', cost: 250, icon: 'clock', color: '#22C55E', consumable: true },
  { id: 'pw-skip', cat: 'powerups', type: 'powerup', title: 'Saltar pregunta', desc: 'Pasa una pregunta sin penalización', cost: 400, icon: 'arrowRight', color: '#F97316', consumable: true },

  // === BACKGROUNDS / VIBES ===
  { id: 'bg-cafe', cat: 'vibes', type: 'background', title: 'Café lluvioso', desc: 'Ambiente de cafetería con lluvia', cost: 600, color: '#92400E', icon: 'headphones' },
  { id: 'bg-library', cat: 'vibes', type: 'background', title: 'Biblioteca antigua', desc: 'Madera, polvo y silencio', cost: 600, color: '#78350F', icon: 'book' },
  { id: 'bg-forest', cat: 'vibes', type: 'background', title: 'Bosque al amanecer', desc: 'Pájaros y luz suave', cost: 800, color: '#16A34A', icon: 'feather' },
  { id: 'bg-space', cat: 'vibes', type: 'background', title: 'Cosmos silencioso', desc: 'Música ambiente espacial', cost: 1100, color: '#1E3A8A', icon: 'moon', locked: true, requires: 'Racha 14 días' },

  // === MILESTONES / READING ===
  { id: 'pkg-dyslexia', cat: 'reading', type: 'pack', title: 'Tipografía OpenDyslexic', desc: 'Activa la fuente accesible', cost: 0, icon: 'feather', color: '#8B5CF6' },
  { id: 'pkg-books-classic', cat: 'reading', type: 'pack', title: 'Pack: Clásicos breves', desc: '12 cuentos en biblioteca', cost: 900, icon: 'book', color: '#B45309' },
  { id: 'pkg-books-science', cat: 'reading', type: 'pack', title: 'Pack: Ciencia para leer rápido', desc: '8 ensayos cortos', cost: 900, icon: 'rocket', color: '#0EA5E9' },
  { id: 'pkg-coach', cat: 'reading', type: 'pack', title: 'Coach de hábitos', desc: 'Plan diario personalizado', cost: 1500, icon: 'target', color: '#22C55E', locked: true, requires: 'PRO' },

  // === BADGES (puramente cosméticos) ===
  { id: 'badge-explorer', cat: 'badges', type: 'badge', title: 'Explorador', desc: 'Insignia visible en tu perfil', cost: 300, icon: 'compass', color: '#3B82F6' },
  { id: 'badge-flame', cat: 'badges', type: 'badge', title: 'Llama eterna', desc: 'Tu racha brilla más', cost: 500, icon: 'flame', color: '#EF4444' },
  { id: 'badge-medal', cat: 'badges', type: 'badge', title: 'Medalla dorada', desc: 'Aura de campeón', cost: 800, icon: 'medal', color: '#EAB308' },
  { id: 'badge-crown', cat: 'badges', type: 'badge', title: 'Corona', desc: 'Solo para nivel 10+', cost: 1200, icon: 'crown', color: '#D97706', locked: true, requires: 'Nivel 10' },
];

function RewardsScreen({ onNav, theme, setTheme }) {
  const db = useDB();
  const profile = db.profile.get();
  const [filter, setFilter] = React.useState('all');
  const [owned, setOwned] = React.useState(['theme-green', 'pkg-dyslexia']);
  const [equipped, setEquipped] = React.useState({ theme: 'theme-green', avatar: profile.avatar });
  const [toast, setToast] = React.useState(null);

  const xp = profile.xp;
  const primary = theme?.primary || '#22C55E';

  const filters = [
    { id: 'all', label: 'Todo', icon: 'sparkle' },
    { id: 'themes', label: 'Temas', icon: 'sparkle' },
    { id: 'avatars', label: 'Personajes', icon: 'user' },
    { id: 'powerups', label: 'Power-ups', icon: 'bolt' },
    { id: 'vibes', label: 'Ambientes', icon: 'headphones' },
    { id: 'reading', label: 'Lectura', icon: 'book' },
    { id: 'badges', label: 'Insignias', icon: 'medal' },
  ];

  const list = REWARDS.filter(r => filter === 'all' || r.cat === filter);
  const featured = REWARDS.find(r => !owned.includes(r.id) && !r.locked && r.cost > 0 && r.cost <= xp);

  const handleBuy = (r) => {
    if (r.locked) {
      setToast({ msg: `Requiere: ${r.requires}`, kind: 'lock' });
      setTimeout(() => setToast(null), 1800);
      return;
    }
    if (owned.includes(r.id) && !r.consumable) {
      // Equip
      if (r.type === 'theme') {
        setEquipped(e => ({ ...e, theme: r.id }));
        setTheme({ primary: r.value });
        setToast({ msg: 'Tema aplicado', kind: 'ok' });
      } else if (r.type === 'avatar') {
        setEquipped(e => ({ ...e, avatar: r.id }));
        db.profile.update({ avatar: r.mascot });
        setToast({ msg: 'Personaje equipado', kind: 'ok' });
      } else {
        setToast({ msg: 'Ya lo tienes', kind: 'ok' });
      }
      setTimeout(() => setToast(null), 1400);
      return;
    }
    if (xp < r.cost) {
      setToast({ msg: `Te faltan ${r.cost - xp} XP`, kind: 'err' });
      setTimeout(() => setToast(null), 1800);
      return;
    }
    db.profile.addXP(-r.cost);
    if (!r.consumable) setOwned(o => [...o, r.id]);
    if (r.type === 'theme') {
      setEquipped(e => ({ ...e, theme: r.id }));
      setTheme({ primary: r.value });
    } else if (r.type === 'avatar') {
      setEquipped(e => ({ ...e, avatar: r.id }));
      db.profile.update({ avatar: r.mascot });
    }
    setToast({ msg: r.consumable ? `${r.title} listo para usar` : `¡${r.title} desbloqueado!`, kind: 'ok' });
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9' }}>
      {/* Header — NO Joy mascot covering XP */}
      <div style={{
        padding: '52px 20px 16px', background: '#fff',
        borderBottom: '1px solid #F3F4F6', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <button onClick={() => onNav('path')} style={{
            border: 'none', background: '#F3F4F6', width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <GIcon name="arrowLeft" size={26} accent="#374151" />
          </button>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            border: '1.5px solid #FCD34D',
            borderRadius: 999,
            boxShadow: '0 3px 0 #D97706',
          }}>
            <GIcon name="bolt" size={22} accent="#D97706" />
            <CountUp from={Math.max(0, xp - 50)} to={xp} style={{ fontFamily: 'Nunito', fontSize: 15, fontWeight: 900, color: '#78350F' }} />
            <span style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: '#92400E', letterSpacing: 0.5 }}>XP</span>
          </div>
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Tienda</div>
        <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 24, color: '#111827', margin: '2px 0 0', letterSpacing: -0.3 }}>Tu colección</h1>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 4, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '7px 12px',
              display: 'flex', alignItems: 'center', gap: 5,
              border: 'none',
              background: filter === f.id ? '#111827' : '#F3F4F6',
              color: filter === f.id ? '#fff' : '#6B7280',
              fontFamily: 'Nunito', fontSize: 11, fontWeight: 800,
              borderRadius: 999, cursor: 'pointer',
              whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.4,
              flexShrink: 0,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 140px' }}>
        {/* Featured item */}
        {filter === 'all' && featured && (
          <FeaturedCard r={featured} onBuy={() => handleBuy(featured)} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {list.map(r => (
            <RewardCard
              key={r.id}
              r={r}
              owned={owned.includes(r.id)}
              equipped={equipped.theme === r.id || equipped.avatar === r.id}
              canAfford={xp >= r.cost}
              onBuy={() => handleBuy(r)}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', left: 20, right: 20, bottom: 96,
          padding: '12px 16px',
          background: toast.kind === 'err' ? '#FEE2E2' : toast.kind === 'lock' ? '#F3F4F6' : '#DCFCE7',
          border: `1.5px solid ${toast.kind === 'err' ? '#FCA5A5' : toast.kind === 'lock' ? '#D1D5DB' : '#86EFAC'}`,
          color: toast.kind === 'err' ? '#991B1B' : toast.kind === 'lock' ? '#374151' : '#166534',
          fontFamily: 'Nunito', fontSize: 13, fontWeight: 800,
          borderRadius: 14, textAlign: 'center', zIndex: 60,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          animation: 'fadeSlide 220ms',
        }}>{toast.msg}</div>
      )}

      <GlassNavbar current="rewards" onNav={onNav} accent={primary} />
    </div>
  );
}

function FeaturedCard({ r, onBuy }) {
  const color = r.value && r.value.startsWith('#') ? r.value : (r.color || '#EAB308');
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}, ${darkenHex(color, 0.2)})`,
      borderRadius: 22, padding: 16, marginBottom: 14,
      color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 10px 28px ${color}55`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
      <div style={{
        width: 70, height: 70, borderRadius: 18,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, zIndex: 1,
      }}>
        {r.type === 'avatar' ? <MiniMascot which={r.mascot} size={56} />
          : r.icon ? <GIcon name={r.icon} size={42} accent="#fff" dark />
          : <GIcon name="sparkle" size={42} accent="#fff" dark />}
      </div>
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 900, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1.2 }}>Destacado para ti</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 900, marginTop: 2 }}>{r.title}</div>
        <div style={{ fontFamily: 'Lexend', fontSize: 11, opacity: 0.9, marginTop: 2 }}>{r.desc}</div>
      </div>
      <button onClick={onBuy} style={{
        padding: '8px 14px', background: '#fff', color: '#111827',
        border: 'none', borderRadius: 10,
        fontFamily: 'Nunito', fontSize: 12, fontWeight: 900,
        cursor: 'pointer', zIndex: 1, whiteSpace: 'nowrap',
      }}>{r.cost} XP</button>
    </div>
  );
}

function RewardCard({ r, owned, equipped, canAfford, onBuy }) {
  const isLocked = r.locked;
  const stateColor = equipped ? '#22C55E' : owned ? '#111827' : isLocked ? '#9CA3AF' : canAfford ? '#EAB308' : '#E5E7EB';
  const stateText = equipped ? 'EN USO' : owned ? (r.consumable ? 'X' + (Math.floor(Math.random() * 3) + 1) : 'USAR') : isLocked ? 'BLOQUEADO' : `${r.cost} XP`;
  const stateTextColor = !isLocked && (canAfford || owned) ? '#fff' : '#9CA3AF';
  const itemColor = r.value && r.value.startsWith && r.value.startsWith('#') ? r.value : (r.color || '#6B7280');

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: equipped ? `2px solid #22C55E` : '1.5px solid #F3F4F6',
      padding: 12,
      opacity: isLocked ? 0.7 : 1,
      position: 'relative',
      transition: 'transform 140ms',
    }}>
      {r.consumable && !isLocked && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          padding: '2px 6px', background: '#FEF3C7',
          color: '#D97706', borderRadius: 6,
          fontFamily: 'Nunito', fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
        }}>USO ÚNICO</div>
      )}

      {/* Preview */}
      <div style={{
        aspectRatio: '1 / 1',
        background: r.type === 'theme'
          ? `linear-gradient(135deg, ${r.value}, ${darkenHex(r.value, 0.25)})`
          : '#FAFAF9',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10, position: 'relative', overflow: 'hidden',
      }}>
        {r.type === 'theme' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}>
              <GIcon name="sparkle" size={28} accent={r.value} />
            </div>
          </div>
        )}
        {r.type === 'avatar' && <MiniMascot which={r.mascot} size={70} />}
        {(r.type === 'powerup' || r.type === 'badge' || r.type === 'background' || r.type === 'pack') && (
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `${itemColor}15`,
            border: `1.5px solid ${itemColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GIcon name={r.icon || 'sparkle'} size={42} accent={itemColor} />
          </div>
        )}
        {isLocked && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.55)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            backdropFilter: 'blur(2px)',
          }}>
            <GIcon name="lock" size={28} accent="#fff" dark />
            <span style={{ fontFamily: 'Nunito', fontSize: 9, fontWeight: 900, color: '#fff', textAlign: 'center', padding: '0 8px', letterSpacing: 0.4 }}>{r.requires}</span>
          </div>
        )}
        {equipped && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 24, height: 24, borderRadius: '50%', background: '#22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            <GIcon name="check" size={18} accent="#fff" dark />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 900, color: '#111827', lineHeight: 1.15 }}>{r.title}</div>
      <div style={{ fontFamily: 'Lexend', fontSize: 10.5, color: '#9CA3AF', lineHeight: 1.35, marginTop: 3, height: 28, overflow: 'hidden', textWrap: 'pretty' }}>{r.desc}</div>

      <button
        onClick={onBuy}
        disabled={isLocked || (!owned && !canAfford && !equipped)}
        style={{
          width: '100%', marginTop: 8,
          padding: '8px 0',
          fontFamily: 'Nunito', fontSize: 11, fontWeight: 900,
          color: stateTextColor,
          background: stateColor,
          border: 'none', borderRadius: 10,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {!isLocked && !owned && !equipped && <GIcon name="bolt" size={14} accent="#fff" dark />}
        {stateText}
      </button>
    </div>
  );
}

function darkenHex(hex, amt = 0.2) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#6B7280';
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amt)));
  g = Math.max(0, Math.floor(g * (1 - amt)));
  b = Math.max(0, Math.floor(b * (1 - amt)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

Object.assign(window, { RewardsScreen, REWARDS, RewardCard });
