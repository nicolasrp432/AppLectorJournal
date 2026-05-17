// XP banner — slides up from bottom on XP gain, with counter animation
function XPBanner({ amount, onDone, accent = '#EAB308' }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 2400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 90,
      transform: visible ? 'translateY(0)' : 'translateY(140%)',
      transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      background: 'linear-gradient(135deg, #FBBF24, #D97706)',
      borderRadius: 18, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 12px 30px rgba(217,119,6,0.4)',
      zIndex: 50,
    }}>
      <GIcon name="bolt" size={32} accent="#fff" dark />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1 }}>XP ganado</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 20, fontWeight: 900, color: '#fff' }}>+{amount}</div>
      </div>
    </div>
  );
}

// Counting number — animates from `from` to `to`
function CountUp({ from, to, duration = 800, style }) {
  const [val, setVal] = React.useState(from);
  React.useEffect(() => {
    if (from === to) return;
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (t >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [from, to]);
  return <span style={style}>{val.toLocaleString()}</span>;
}

Object.assign(window, { XPBanner, CountUp });
