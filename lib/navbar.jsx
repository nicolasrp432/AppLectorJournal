// New Navbar — glassmorphism with active indicator pill

function GlassNavbar({ current, onNav, accent = '#22C55E' }) {
  const items = [
    { id: 'path', icon: 'path', label: 'Ruta' },
    { id: 'dashboard', icon: 'chart', label: 'Progreso' },
    { id: 'library', icon: 'book', label: 'Libros' },
    { id: 'rewards', icon: 'trophy', label: 'Tienda' },
    { id: 'profile', icon: 'user', label: 'Perfil' },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, right: 12,
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(17,24,39,0.08)',
      borderRadius: 24,
      padding: '10px 8px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 50,
      boxShadow: '0 10px 30px rgba(17,24,39,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
    }}>
      {items.map(item => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              background: active ? accent : 'transparent',
              border: 'none',
              borderRadius: 16,
              padding: active ? '8px 14px' : '8px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer',
              transition: 'all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: active ? `0 4px 12px ${accent}66` : 'none',
            }}
          >
            <GIcon name={item.icon} size={24} accent={active ? '#fff' : '#111827'} dark={active} />
            {active && (
              <span style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800,
                color: '#fff', letterSpacing: 0.3,
              }}>{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { GlassNavbar });
