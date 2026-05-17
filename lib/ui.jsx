// Reusable UI primitives for Neuro-Journey
// Duolingo-inspired pushable buttons with solid shadow-below accent

function PushButton({ children, color = '#22C55E', textColor = '#fff', onClick, style = {}, full = true, size = 'lg' }) {
  const sizes = {
    sm: { padY: 8, padX: 18, fs: 14, br: 14, shd: 3 },
    md: { padY: 12, padX: 22, fs: 15, br: 16, shd: 4 },
    lg: { padY: 16, padX: 26, fs: 16, br: 18, shd: 5 },
  };
  const s = sizes[size];
  const [pressed, setPressed] = React.useState(false);
  const shadeColor = darken(color, 0.18);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: full ? '100%' : 'auto',
        padding: `${s.padY}px ${s.padX}px`,
        fontSize: s.fs,
        fontWeight: 800,
        fontFamily: 'Nunito, Lexend, sans-serif',
        color: textColor,
        background: color,
        border: 'none',
        borderRadius: s.br,
        boxShadow: pressed ? `0 0 0 ${shadeColor}` : `0 ${s.shd}px 0 ${shadeColor}`,
        transform: pressed ? `translateY(${s.shd}px)` : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        cursor: 'pointer',
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, color = '#E5E7EB', textColor = '#111827', full = true, style = {} }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: full ? '100%' : 'auto',
        padding: '14px 22px',
        fontSize: 15,
        fontWeight: 800,
        fontFamily: 'Nunito, Lexend, sans-serif',
        color: textColor,
        background: '#fff',
        border: `2px solid ${color}`,
        borderRadius: 16,
        boxShadow: pressed ? `0 0 0 ${color}` : `0 4px 0 ${color}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        cursor: 'pointer',
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function StatBadge({ icon, value, color = '#22C55E', label }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px 6px 10px',
      background: '#fff',
      border: `2px solid ${color}`,
      borderRadius: 999,
      boxShadow: `0 3px 0 ${color}`,
      fontFamily: 'Nunito, sans-serif',
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 900, color, fontSize: 14 }}>{value}</span>
      {label && <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>}
    </div>
  );
}

function ProgressEco({ value = 0, color = '#22C55E', height = 10 }) {
  return (
    <div style={{
      width: '100%',
      height,
      background: '#F3F4F6',
      borderRadius: 999,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: color,
        borderRadius: 999,
        transition: 'width 400ms ease',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: 4, right: 4,
          height: Math.max(2, height / 3),
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

// CognitiveCard — white card with soft shadow, rounded 2xl
function CognitiveCard({ children, onClick, color, style = {}, pushable = false }) {
  const [pressed, setPressed] = React.useState(false);
  const border = color || '#E5E7EB';
  return (
    <div
      onClick={onClick}
      onMouseDown={() => pushable && setPressed(true)}
      onMouseUp={() => pushable && setPressed(false)}
      onMouseLeave={() => pushable && setPressed(false)}
      style={{
        background: '#fff',
        borderRadius: 24,
        border: `2px solid ${border}`,
        boxShadow: pressed ? `0 0 0 ${border}` : `0 4px 0 ${border}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// helper
function darken(hex, amt = 0.2) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amt)));
  g = Math.max(0, Math.floor(g * (1 - amt)));
  b = Math.max(0, Math.floor(b * (1 - amt)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Streak fire badge
function StreakBadge({ count = 0, active = true }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px 6px 8px',
      background: active ? '#FFF7ED' : '#F3F4F6',
      border: `2px solid ${active ? '#F97316' : '#E5E7EB'}`,
      borderRadius: 999,
      boxShadow: `0 3px 0 ${active ? '#F97316' : '#E5E7EB'}`,
    }}>
      <span style={{ fontSize: 18, filter: active ? 'none' : 'grayscale(1)' }}>🔥</span>
      <span style={{ fontWeight: 900, color: active ? '#F97316' : '#9CA3AF', fontSize: 14, fontFamily: 'Nunito' }}>{count}</span>
    </div>
  );
}

// XP badge
function XPBadge({ value = 0 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px 6px 8px',
      background: '#FEFCE8',
      border: `2px solid #EAB308`,
      borderRadius: 999,
      boxShadow: `0 3px 0 #EAB308`,
    }}>
      <span style={{ fontSize: 16 }}>⚡</span>
      <span style={{ fontWeight: 900, color: '#A16207', fontSize: 14, fontFamily: 'Nunito' }}>{value}</span>
    </div>
  );
}

// Bottom navigation
function BottomNav({ current, onNav }) {
  const items = [
    { id: 'path', icon: '🗺️', label: 'Ruta' },
    { id: 'library', icon: '📚', label: 'Biblioteca' },
    { id: 'rewards', icon: '🏆', label: 'Tienda' },
    { id: 'profile', icon: '👤', label: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#fff',
      borderTop: '1px solid #F3F4F6',
      padding: '10px 16px 26px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 50,
    }}>
      {items.map(item => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              background: active ? '#F0FDF4' : 'transparent',
              border: 'none',
              borderRadius: 14,
              padding: '8px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
          >
            <span style={{ fontSize: 22, filter: active ? 'none' : 'grayscale(0.6) opacity(0.5)' }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: active ? '#16A34A' : '#9CA3AF', fontFamily: 'Nunito', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { PushButton, OutlineButton, StatBadge, ProgressEco, CognitiveCard, StreakBadge, XPBadge, BottomNav });
