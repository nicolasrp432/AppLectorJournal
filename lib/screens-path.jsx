// Path screen — 3 zones with a continuous winding trail connecting all nodes.
// Each zone draws a single SVG path that snakes through every node position.
// Chests open with a sparkle animation when tapped (if available/done).

function PathScreen({ onNav, onLaunchExercise, theme }) {
  const primary = theme?.primary || '#22C55E';
  const db = useDB();
  const profile = db.profile.get();
  const [chestOpen, setChestOpen] = React.useState(null); // { reward }

  const prog = db.progress.all();
  const totalMastery = Object.values(prog).reduce((s, p) => s + (p.mastery || 0), 0);
  const focusDone = (prog.schulte?.total_sessions || 0) + (prog.reading?.total_sessions || 0) + (prog.comprehension?.total_sessions || 0);

  const zones = [
    {
      id: 'focus', name: 'Zona de Enfoque', color: '#22C55E', mascot: 'focus',
      subtitle: 'Atención sostenida y campo visual',
      done: Math.min(7, focusDone), total: 7,
      nodes: [
        { id: 'f1', type: 'lesson', label: 'Intro al foco', exerciseId: null, status: 'done', side: 'center' },
        { id: 'f2', type: 'exercise', label: 'Schulte 3×3', exerciseId: 'schulte', status: 'done', side: 'right', mascot: 'focus' },
        { id: 'f3', type: 'chest', label: 'Cofre · 50 XP', status: 'done', side: 'left', reward: { kind: 'xp', value: 50 } },
        { id: 'f4', type: 'exercise', label: 'Schulte 5×5', exerciseId: 'schulte', status: 'done', side: 'center', mascot: 'focus' },
        { id: 'f5', type: 'exercise', label: 'Lectura focal', exerciseId: 'reading', status: 'current', side: 'right', mascot: 'swift' },
        { id: 'f6', type: 'exercise', label: 'Comprensión', exerciseId: 'comprehension', status: 'available', side: 'left', mascot: 'joy' },
        { id: 'f7', type: 'boss', label: 'Jefe de Enfoque', exerciseId: 'boss', status: 'available', side: 'center' },
      ],
    },
    {
      id: 'memory', name: 'Zona de Memoria', color: '#3B82F6', mascot: 'calm',
      subtitle: 'Memoria corta y espacial',
      done: (prog.wordspan?.total_sessions || 0) + (prog.loci?.total_sessions || 0), total: 6,
      nodes: [
        { id: 'm1', type: 'lesson', label: 'Intro memoria', status: 'done', side: 'center' },
        { id: 'm2', type: 'exercise', label: 'Word Span', exerciseId: 'wordspan', status: 'current', side: 'right', mascot: 'calm' },
        { id: 'm3', type: 'chest', label: 'Cofre · gema', status: 'available', side: 'left', reward: { kind: 'item', value: 'gema' } },
        { id: 'm4', type: 'exercise', label: 'Word Span +', exerciseId: 'wordspan', status: 'available', side: 'right', mascot: 'calm' },
        { id: 'm5', type: 'exercise', label: 'Método Loci', exerciseId: 'loci', status: 'available', side: 'left', mascot: 'loci' },
        { id: 'm6', type: 'boss', label: 'Jefe Memoria', exerciseId: 'boss', status: 'available', side: 'center' },
      ],
    },
    {
      id: 'speed', name: 'Zona de Velocidad', color: '#F97316', mascot: 'swift',
      subtitle: 'Lectura rápida avanzada',
      done: 0, total: 5,
      locked: totalMastery < 2.0,
      nodes: [
        { id: 's1', type: 'lesson', label: 'Expansión visual', status: 'done', side: 'center' },
        { id: 's2', type: 'exercise', label: 'Focal 400 WPM', exerciseId: 'reading', status: 'current', side: 'right', mascot: 'swift' },
        { id: 's3', type: 'chest', label: 'Cofre dorado', status: 'available', side: 'left', reward: { kind: 'xp', value: 150 } },
        { id: 's4', type: 'exercise', label: 'Focal 600 WPM', exerciseId: 'reading', status: 'available', side: 'right', mascot: 'swift' },
        { id: 's5', type: 'boss', label: 'Jefe Velocidad', exerciseId: 'boss', status: 'available', side: 'center' },
      ],
    },
  ];

  const handleNode = (node) => {
    if (node.status === 'locked') return;
    if (node.type === 'chest' && node.status !== 'opened') {
      setChestOpen(node);
      return;
    }
    if (node.exerciseId) onLaunchExercise(node.exerciseId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Tu ruta</div>
          <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#111827', margin: '2px 0 0', letterSpacing: -0.3 }}>Neuro-Journey</h1>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
          <GIcon name="flame" size={22} accent="#F97316" />
          <span style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#F97316' }}>{profile.streak}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#FEFCE8', borderRadius: 12, border: '1px solid #FEF08A' }}>
          <GIcon name="bolt" size={22} accent="#EAB308" />
          <CountUp from={profile.xp - 50} to={profile.xp} style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#CA8A04' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0 140px' }}>
        {zones.map((zone, zi) => (
          <ZoneSection key={zone.id} zone={zone} zi={zi} onNode={handleNode} />
        ))}
      </div>

      {chestOpen && <ChestReward node={chestOpen} onClose={() => {
        if (chestOpen.reward?.kind === 'xp') supa.profile.addXP(chestOpen.reward.value);
        setChestOpen(null);
      }} />}

      <GlassNavbar current="path" onNav={onNav} accent={primary} />
    </div>
  );
}

// One zone = banner + a single SVG trail with nodes positioned along it
function ZoneSection({ zone, zi, onNode }) {
  const c = zone.color;
  const locked = zone.locked;

  // Layout: zone width is 340, each node is ~110px tall, side = left/center/right
  const W = 340;
  const ROW = 116;
  const HALF = W / 2;
  const SIDE_X = { left: HALF - 78, center: HALF, right: HALF + 78 };
  const nodes = zone.nodes;
  const H = nodes.length * ROW + 30;

  // Build a curved path that snakes through each node center
  const pts = nodes.map((n, i) => ({ x: SIDE_X[n.side], y: 26 + i * ROW }));
  // Smooth curved path through points (using quadratic midpoints)
  let trail = '';
  pts.forEach((p, i) => {
    if (i === 0) {
      trail += `M ${p.x} ${p.y}`;
    } else {
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      const cy = (prev.y + p.y) / 2;
      trail += ` Q ${prev.x} ${cy}, ${cx} ${cy} T ${p.x} ${p.y}`;
    }
  });
  // Compute "progress" length — how far along trail is "done"
  const doneCount = nodes.filter(n => n.status === 'done').length;
  const progressFrac = doneCount / nodes.length;

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Zone banner */}
      <div style={{
        margin: '0 20px', padding: 16,
        background: locked ? '#F3F4F6' : `linear-gradient(135deg, ${c}, ${c}CC)`,
        borderRadius: 22,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: locked ? 'none' : `0 10px 30px ${c}40`,
        position: 'relative', overflow: 'hidden',
        opacity: locked ? 0.7 : 1,
      }}>
        {!locked && <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />}
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          background: locked ? '#fff' : 'rgba(255,255,255,0.2)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4,
        }}>
          {locked ? <GIcon name="lock" size={28} accent="#9CA3AF" /> : <MiniMascot which={zone.mascot} size={40} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
          <p style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, color: locked ? '#9CA3AF' : 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Zona {zi + 1}</p>
          <h3 style={{ fontFamily: 'Nunito', fontSize: 17, fontWeight: 900, color: locked ? '#4B5563' : '#fff', margin: '2px 0' }}>{zone.name}</h3>
          {!locked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(zone.done / zone.total) * 100}%`, height: '100%', background: '#fff', borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#fff' }}>{zone.done}/{zone.total}</span>
            </div>
          ) : (
            <p style={{ fontFamily: 'Lexend', fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Completa la zona anterior</p>
          )}
        </div>
      </div>

      {/* Nodes + connecting trail */}
      {!locked && (
        <div style={{ position: 'relative', width: W, height: H, margin: '14px auto 0' }}>
          {/* Background trail */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <linearGradient id={`grad-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} />
                <stop offset="100%" stopColor={c} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Dashed grey base */}
            <path d={trail} stroke="#E5E7EB" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="3 10" />
            {/* Solid progress overlay (clipped to %) — uses pathLength so dasharray works in % */}
            <path
              d={trail}
              stroke={`url(#grad-${zone.id})`}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${progressFrac * 100} 100`}
              style={{ transition: 'stroke-dasharray 800ms ease-out' }}
            />
          </svg>
          {/* Nodes positioned absolutely along trail */}
          {nodes.map((node, idx) => {
            const p = pts[idx];
            return (
              <div key={node.id} style={{
                position: 'absolute',
                left: p.x, top: p.y,
                transform: 'translate(-50%, -50%)',
              }}>
                <PathNode node={node} zoneColor={c} onClick={() => onNode(node)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PathNode({ node, zoneColor, onClick }) {
  const locked = node.status === 'locked';
  const current = node.status === 'current';
  const size = node.type === 'boss' ? 92 : node.type === 'chest' ? 74 : 74;

  return (
    <div onClick={() => !locked && onClick && onClick()} style={{
      cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'center', position: 'relative',
    }}>
      {current && <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: zoneColor, opacity: 0.18, animation: 'pulseHalo 1.8s ease-in-out infinite' }} />}
      <NodeBody node={node} size={size} zoneColor={zoneColor} />
      {current && (
        <div style={{
          position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 10px', background: '#111827', color: '#fff',
          fontFamily: 'Nunito', fontSize: 10, fontWeight: 900, borderRadius: 8,
          whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5,
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        }}>
          Empezar
          <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 8, height: 8, background: '#111827' }} />
        </div>
      )}
      <div style={{
        position: 'absolute', top: size + 6, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: locked ? '#9CA3AF' : '#374151',
        whiteSpace: 'nowrap',
      }}>{node.label}</div>
    </div>
  );
}

function NodeBody({ node, size = 80, zoneColor }) {
  const locked = node.status === 'locked';
  const done = node.status === 'done';
  const current = node.status === 'current';
  const mascotColors = { focus: '#22C55E', calm: '#3B82F6', joy: '#EAB308', swift: '#F97316', loci: '#8B5CF6' };

  if (node.type === 'boss') {
    return (
      <div style={{
        width: size, height: size, borderRadius: 22,
        background: locked ? '#F3F4F6' : `linear-gradient(145deg, #1F2937, #111827)`,
        border: locked ? '2px solid #E5E7EB' : `3px solid #DC2626`,
        boxShadow: locked ? 'none' : '0 12px 28px rgba(220,38,38,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: locked ? 0.6 : 1,
        position: 'relative',
        animation: current ? 'bounceNode 1.6s ease-in-out infinite' : 'none',
      }}>
        {locked ? <GIcon name="lock" size={size * 0.45} accent="#9CA3AF" />
          : <BossMascot size={size * 0.75} expression={done ? 'defeated' : 'serious'} />}
        <div style={{
          position: 'absolute', top: -10, padding: '2px 8px',
          background: '#DC2626', color: '#fff',
          fontFamily: 'Nunito', fontSize: 8, fontWeight: 900, borderRadius: 6,
          textTransform: 'uppercase', letterSpacing: 0.8,
        }}>JEFE</div>
      </div>
    );
  }
  if (node.type === 'chest') {
    return (
      <div style={{
        width: size, height: size, borderRadius: 18,
        background: locked ? '#F3F4F6' : 'linear-gradient(160deg, #FEF3C7, #FBBF24)',
        border: locked ? '2px solid #E5E7EB' : '2px solid #D97706',
        boxShadow: locked ? 'none' : '0 10px 22px rgba(217,119,6,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: locked ? 0.6 : 1,
        animation: done ? 'wiggle 3s ease-in-out infinite' : 'none',
        position: 'relative',
      }}>
        {locked ? (
          <GIcon name="lock" size={size * 0.45} accent="#9CA3AF" />
        ) : (
          <ChestSVG size={size * 0.7} opened={done} />
        )}
      </div>
    );
  }
  if (node.type === 'lesson') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: done ? `linear-gradient(145deg, ${zoneColor}DD, ${zoneColor}AA)` : '#fff',
        border: done ? 'none' : `2.5px solid ${zoneColor}`,
        boxShadow: `0 10px 24px ${zoneColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <GIcon name="bookmark" size={size * 0.5} accent={done ? '#fff' : zoneColor} dark={done} />
        {done && (
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
            <GIcon name="check" size={18} accent="#22C55E" />
          </div>
        )}
      </div>
    );
  }
  const c = mascotColors[node.mascot] || zoneColor;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: locked ? '#F3F4F6' : done ? `linear-gradient(145deg, ${c}DD, ${c}AA)` : `linear-gradient(145deg, #fff, ${c}15)`,
      border: locked ? '2px solid #E5E7EB' : done ? 'none' : `2.5px solid ${c}`,
      boxShadow: locked ? 'none' : done ? `0 10px 24px ${c}40` : `0 12px 28px ${c}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      opacity: locked ? 0.6 : 1,
      animation: current ? 'bounceNode 1.6s ease-in-out infinite' : 'none',
    }}>
      {locked ? <GIcon name="lock" size={size * 0.45} accent="#9CA3AF" /> : <MiniMascot which={node.mascot} size={size * 0.7} />}
      {done && (
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
          <GIcon name="check" size={18} accent="#22C55E" />
        </div>
      )}
    </div>
  );
}

// Inline SVG chest (closed / open)
function ChestSVG({ size = 48, opened = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      {/* Bottom box */}
      <rect x="6" y="20" width="36" height="22" rx="3" fill="#92400E" />
      <rect x="6" y="20" width="36" height="4" fill="#78350F" />
      {/* Lid */}
      <g style={{ transformOrigin: '24px 20px', transform: opened ? 'rotate(-45deg)' : 'rotate(0)', transition: 'transform 400ms cubic-bezier(0.34,1.56,0.64,1)' }}>
        <path d="M 6 20 Q 6 8 24 8 Q 42 8 42 20 Z" fill="#B45309" />
        <path d="M 6 20 Q 6 8 24 8 Q 42 8 42 20 Z" fill="none" stroke="#78350F" strokeWidth="1.5" />
      </g>
      {/* Lock */}
      <rect x="21" y="22" width="6" height="6" rx="1" fill="#FBBF24" />
      <circle cx="24" cy="25" r="1" fill="#78350F" />
      {/* Bands */}
      <line x1="10" y1="32" x2="38" y2="32" stroke="#78350F" strokeWidth="1.2" />
    </svg>
  );
}

// Chest reward modal — appears when an available chest is tapped
function ChestReward({ node, onClose }) {
  const [stage, setStage] = React.useState('opening'); // opening | revealed
  React.useEffect(() => {
    const t = setTimeout(() => setStage('revealed'), 600);
    return () => clearTimeout(t);
  }, []);
  const reward = node.reward || { kind: 'xp', value: 50 };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 250, animation: 'fadeSlide 200ms',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 280, padding: '30px 22px 22px', background: '#fff',
        borderRadius: 24, textAlign: 'center',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Sparkle bursts */}
        {stage === 'revealed' && <SparkleBurst />}

        <div style={{
          width: 110, height: 110, margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, #FCD34D55, transparent 65%)',
            animation: 'haloPulse 1.6s ease-in-out infinite',
          }} />
          <ChestSVG size={100} opened={stage === 'revealed'} />
        </div>

        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 900, color: '#D97706', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          ¡Cofre abierto!
        </div>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 14px' }}>
          {reward.kind === 'xp' ? `+${reward.value} XP` : reward.value}
        </h2>

        <button onClick={onClose} style={{
          width: '100%', padding: 12, background: '#D97706', color: '#fff',
          border: 'none', borderRadius: 12,
          fontFamily: 'Nunito', fontSize: 13, fontWeight: 900,
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.8,
          boxShadow: '0 6px 14px rgba(217,119,6,0.4)',
        }}>Reclamar</button>
      </div>
      <style>{`
        @keyframes haloPulse { 0%,100%{transform:scale(0.92);opacity:0.85} 50%{transform:scale(1.1);opacity:0.45} }
      `}</style>
    </div>
  );
}

function SparkleBurst() {
  // 10 sparkles flying out from center
  const sparkles = Array.from({ length: 10 });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {sparkles.map((_, i) => {
        const a = (i / sparkles.length) * Math.PI * 2;
        const dx = Math.cos(a) * 110;
        const dy = Math.sin(a) * 110;
        const colors = ['#FCD34D', '#FBBF24', '#F97316', '#22C55E'];
        const color = colors[i % colors.length];
        return (
          <div key={i} style={{
            position: 'absolute', top: '38%', left: '50%',
            width: 10, height: 10,
            transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${a}rad) scale(0.6)`,
            animation: `sparkleFly 1100ms cubic-bezier(0.22,1,0.36,1) ${i * 30}ms forwards`,
            opacity: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path d="M 8 0 L 9.5 6.5 L 16 8 L 9.5 9.5 L 8 16 L 6.5 9.5 L 0 8 L 6.5 6.5 Z" fill={color} />
            </svg>
          </div>
        );
      })}
      <style>{`
        @keyframes sparkleFly {
          0% { opacity: 0; transform: translate(-50%, -50%) translate(0, 0) scale(0); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { PathScreen, ZoneSection, PathNode, NodeBody, ChestSVG, ChestReward, SparkleBurst });
