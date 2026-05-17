// Characters v3 — bold expressive blob characters inspired by check-in mood icons.
// Each character is a UNIQUE silhouette (no arms/legs) with a strong personality.
// Faces use simple geometric eyes/mouths with breathing/blinking animation.

function CharShape({ shape, color, size = 80, eyes = 'happy', mouth = 'smile', breathing = true, blinking = true, accent, cheeks = true, brow }) {
  // viewBox 100×120 to allow tall pill silhouettes
  // shapes are PATHS (filled) – each one distinct in proportion and feeling
  const paths = {
    // Tall rounded pill (calm, focus)
    tallPill: 'M50 8 C 70 8, 84 24, 84 46 L 84 90 C 84 104, 72 112, 50 112 C 28 112, 16 104, 16 90 L 16 46 C 16 24, 30 8, 50 8 Z',
    // Soft round blob (joy, friendly)
    round: 'M50 10 C 76 10, 90 28, 90 56 C 90 90, 72 110, 50 110 C 28 110, 10 90, 10 56 C 10 28, 24 10, 50 10 Z',
    // Wide bean shape (calm/sensitive)
    bean: 'M28 30 C 28 14, 44 8, 56 14 C 70 8, 88 18, 88 38 C 88 58, 80 80, 68 96 C 56 110, 36 112, 24 100 C 12 84, 14 60, 22 44 C 24 38, 26 34, 28 30 Z',
    // Tall droplet (focus, sharp)
    droplet: 'M50 8 C 64 8, 76 22, 78 42 C 80 60, 90 80, 80 96 C 70 110, 30 110, 20 96 C 10 80, 20 60, 22 42 C 24 22, 36 8, 50 8 Z',
    // Triangle-ish (swift, fast)
    spark: 'M50 6 C 60 6, 66 16, 74 30 L 90 84 C 94 96, 86 110, 72 110 L 28 110 C 14 110, 6 96, 10 84 L 26 30 C 34 16, 40 6, 50 6 Z',
    // Wide arch (steady)
    arch: 'M50 8 C 76 8, 92 26, 92 56 L 92 96 C 92 106, 86 110, 76 110 L 24 110 C 14 110, 8 106, 8 96 L 8 56 C 8 26, 24 8, 50 8 Z',
    // Hexagonal (boss, structured)
    hex: 'M50 6 L 86 28 L 86 92 L 50 114 L 14 92 L 14 28 Z',
    // Cloud-ish stack (memory)
    cloud: 'M22 36 C 22 22, 36 16, 50 22 C 60 12, 80 18, 82 36 C 92 38, 96 56, 86 64 C 92 78, 80 92, 66 88 C 60 102, 38 102, 32 88 C 18 92, 8 78, 14 64 C 6 56, 12 40, 22 36 Z',
  };

  const dur = breathing ? '3.4s' : '0s';

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" style={{ display: 'block', overflow: 'visible' }}>
      <g style={{ transformOrigin: '50px 60px', animation: `charBreathe ${dur} ease-in-out infinite` }}>
        {/* Soft drop shadow (subtle) */}
        <ellipse cx="50" cy="115" rx="32" ry="3.5" fill="#000" opacity="0.08" />
        {/* Body shadow under */}
        <path d={paths[shape] || paths.round} fill="#000" opacity="0.18" transform="translate(0, 3)" />
        <path d={paths[shape] || paths.round} fill={color} />
        {/* Highlight (subtle gloss top-left) */}
        <ellipse cx="32" cy="28" rx="14" ry="9" fill="#fff" opacity="0.18" />
        {/* Side accent shadows */}
        {accent && (
          <path d={paths[shape] || paths.round} fill={accent} opacity="0.25" style={{ mixBlendMode: 'multiply', transformOrigin: '50px 60px' }} transform="translate(2, 4) scale(0.96)" />
        )}
        {/* Cheek blush */}
        {cheeks && (
          <>
            <ellipse cx="28" cy="64" rx="6" ry="3.2" fill="#F87171" opacity="0.45" />
            <ellipse cx="72" cy="64" rx="6" ry="3.2" fill="#F87171" opacity="0.45" />
          </>
        )}
        <Face eyes={eyes} mouth={mouth} blinking={blinking} brow={brow} />
      </g>
    </svg>
  );
}

// ============ FACE ============
function Face({ eyes = 'happy', mouth = 'smile', blinking = true, cx = 50, cy = 50, brow }) {
  const eyeY = cy;
  const eyeDx = 10;
  // Eye style by name
  let leftEye, rightEye;
  if (eyes === 'happy') {
    // closed smile-arc eyes
    leftEye = <path d={`M${cx - eyeDx - 4} ${eyeY + 2} Q ${cx - eyeDx} ${eyeY - 3}, ${cx - eyeDx + 4} ${eyeY + 2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    rightEye = <path d={`M${cx + eyeDx - 4} ${eyeY + 2} Q ${cx + eyeDx} ${eyeY - 3}, ${cx + eyeDx + 4} ${eyeY + 2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (eyes === 'dots') {
    leftEye = <circle cx={cx - eyeDx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
    rightEye = <circle cx={cx + eyeDx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
  } else if (eyes === 'wow') {
    leftEye = <circle cx={cx - eyeDx} cy={eyeY} r="3.6" fill="#1a1a1a" />;
    rightEye = <circle cx={cx + eyeDx} cy={eyeY} r="3.6" fill="#1a1a1a" />;
  } else if (eyes === 'sleepy') {
    leftEye = <path d={`M${cx - eyeDx - 4} ${eyeY} L ${cx - eyeDx + 4} ${eyeY}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    rightEye = <path d={`M${cx + eyeDx - 4} ${eyeY} L ${cx + eyeDx + 4} ${eyeY}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (eyes === 'wink') {
    leftEye = <path d={`M${cx - eyeDx - 4} ${eyeY + 2} Q ${cx - eyeDx} ${eyeY - 3}, ${cx - eyeDx + 4} ${eyeY + 2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    rightEye = <circle cx={cx + eyeDx} cy={eyeY} r="2.6" fill="#1a1a1a" />;
  } else {
    leftEye = <circle cx={cx - eyeDx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
    rightEye = <circle cx={cx + eyeDx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
  }

  // Mouth
  const my = cy + 12;
  let mouthEl = null;
  if (mouth === 'smile') {
    mouthEl = <path d={`M ${cx - 7} ${my - 1} Q ${cx} ${my + 5}, ${cx + 7} ${my - 1}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (mouth === 'bigSmile') {
    mouthEl = <path d={`M ${cx - 11} ${my - 2} Q ${cx} ${my + 9}, ${cx + 11} ${my - 2} Z`} fill="#1a1a1a" />;
  } else if (mouth === 'flat') {
    mouthEl = <line x1={cx - 6} y1={my} x2={cx + 6} y2={my} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />;
  } else if (mouth === 'small') {
    mouthEl = <path d={`M ${cx - 3} ${my} Q ${cx} ${my + 2}, ${cx + 3} ${my}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (mouth === 'open') {
    mouthEl = <ellipse cx={cx} cy={my + 1} rx="4" ry="5" fill="#1a1a1a" />;
  } else if (mouth === 'oh') {
    mouthEl = <ellipse cx={cx} cy={my + 1} rx="3" ry="4" fill="#1a1a1a" />;
  } else if (mouth === 'cheeky') {
    mouthEl = <path d={`M ${cx - 6} ${my} Q ${cx} ${my + 5}, ${cx + 6} ${my} L ${cx + 4} ${my + 2} Q ${cx} ${my + 4}, ${cx - 4} ${my + 2} Z`} fill="#1a1a1a" />;
  }

  // Eyebrows for extra expression
  let browEl = null;
  if (brow === 'raised') {
    browEl = (
      <g>
        <path d={`M ${cx - eyeDx - 5} ${eyeY - 9} Q ${cx - eyeDx} ${eyeY - 12}, ${cx - eyeDx + 5} ${eyeY - 9}`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M ${cx + eyeDx - 5} ${eyeY - 9} Q ${cx + eyeDx} ${eyeY - 12}, ${cx + eyeDx + 5} ${eyeY - 9}`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  } else if (brow === 'angry') {
    browEl = (
      <g>
        <line x1={cx - eyeDx - 6} y1={eyeY - 6} x2={cx - eyeDx + 4} y2={eyeY - 10} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
        <line x1={cx + eyeDx + 6} y1={eyeY - 6} x2={cx + eyeDx - 4} y2={eyeY - 10} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  } else if (brow === 'concerned') {
    browEl = (
      <g>
        <line x1={cx - eyeDx - 4} y1={eyeY - 10} x2={cx - eyeDx + 6} y2={eyeY - 7} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <line x1={cx + eyeDx + 4} y1={eyeY - 10} x2={cx + eyeDx - 6} y2={eyeY - 7} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      {browEl}
      <g style={blinking ? { transformOrigin: `${cx}px ${eyeY}px`, animation: 'charBlink 4.2s ease-in-out infinite' } : {}}>
        {leftEye}
        {rightEye}
      </g>
      {mouthEl}
    </g>
  );
}

// =========== MASCOT PRESETS ===========
// Focus — green tall pill, calm focused vibe
function Focus({ size = 80, expression = 'calm', bouncing }) {
  const map = {
    calm:  { eyes: 'happy', mouth: 'smile' },
    happy: { eyes: 'happy', mouth: 'bigSmile' },
    wow:   { eyes: 'wow',   mouth: 'oh' },
    sleepy:{ eyes: 'sleepy',mouth: 'small' },
  };
  const exp = map[expression] || map.calm;
  return <CharShape shape="tallPill" color="#22C55E" size={size} {...exp} accent="#16A34A" />;
}

// Calm — blue bean, sensitive/reflective
function Calm({ size = 80, expression = 'calm', bouncing }) {
  const map = {
    calm:  { eyes: 'sleepy', mouth: 'small' },
    happy: { eyes: 'happy', mouth: 'smile' },
    wow:   { eyes: 'wow',   mouth: 'oh' },
  };
  const exp = map[expression] || map.calm;
  return <CharShape shape="bean" color="#3B82F6" size={size} {...exp} accent="#2563EB" />;
}

// Joy — yellow round blob, bright/cheery
function Joy({ size = 80, expression = 'happy', bouncing }) {
  const map = {
    calm:  { eyes: 'happy', mouth: 'smile' },
    happy: { eyes: 'happy', mouth: 'bigSmile' },
    wink:  { eyes: 'wink', mouth: 'cheeky' },
    wow:   { eyes: 'wow',  mouth: 'oh' },
  };
  const exp = map[expression] || map.happy;
  return <CharShape shape="round" color="#FACC15" size={size} {...exp} accent="#EAB308" />;
}

// Swift — orange spark/triangle, energetic
function Swift({ size = 80, expression = 'wow', bouncing }) {
  const map = {
    calm:  { eyes: 'dots',  mouth: 'smile' },
    happy: { eyes: 'happy', mouth: 'bigSmile' },
    wow:   { eyes: 'wow',   mouth: 'oh' },
    fast:  { eyes: 'dots',  mouth: 'open' },
  };
  const exp = map[expression] || map.wow;
  return (
    <div style={{ display: 'inline-block', animation: bouncing ? 'charBounce 1.6s ease-in-out infinite' : 'none' }}>
      <CharShape shape="spark" color="#F97316" size={size} {...exp} accent="#EA580C" />
    </div>
  );
}

// Memory — pink cloud
function Memo({ size = 80, expression = 'calm' }) {
  const map = {
    calm:  { eyes: 'happy', mouth: 'smile' },
    happy: { eyes: 'happy', mouth: 'bigSmile' },
    wow:   { eyes: 'wow',   mouth: 'oh' },
  };
  const exp = map[expression] || map.calm;
  return <CharShape shape="cloud" color="#EC4899" size={size} {...exp} accent="#DB2777" />;
}

// Loci — purple droplet
function Loci({ size = 80, expression = 'wink' }) {
  const map = {
    calm:  { eyes: 'sleepy', mouth: 'small' },
    happy: { eyes: 'happy',  mouth: 'smile' },
    wink:  { eyes: 'wink',   mouth: 'cheeky' },
  };
  const exp = map[expression] || map.wink;
  return <CharShape shape="droplet" color="#8B5CF6" size={size} {...exp} accent="#7C3AED" />;
}

// Boss mascot — red hex
function BossMascot({ size = 80, expression = 'serious' }) {
  const map = {
    serious: { eyes: 'wow', mouth: 'flat' },
    angry:   { eyes: 'wow', mouth: 'open' },
    defeated:{ eyes: 'sleepy', mouth: 'small' },
  };
  const exp = map[expression] || map.serious;
  return <CharShape shape="hex" color="#DC2626" size={size} {...exp} accent="#B91C1C" />;
}

// MiniMascot — pick by name, used inside path nodes & shells
function MiniMascot({ which = 'focus', size = 60, expression }) {
  switch (which) {
    case 'focus': return <Focus size={size} expression={expression} />;
    case 'calm': return <Calm size={size} expression={expression} />;
    case 'joy': return <Joy size={size} expression={expression} />;
    case 'swift': return <Swift size={size} expression={expression} />;
    case 'memo': return <Memo size={size} expression={expression} />;
    case 'loci': return <Loci size={size} expression={expression} />;
    case 'boss': return <BossMascot size={size} expression={expression} />;
    default: return <Focus size={size} expression={expression} />;
  }
}

// Group display — characters lined up (used in welcome screen)
function CharGroup({ size = 70 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: -6, position: 'relative' }}>
      <div style={{ transform: 'translateX(14px) translateY(8px)' }}><Memo size={size * 0.85} /></div>
      <div style={{ transform: 'translateX(8px)' }}><Swift size={size} /></div>
      <div style={{ zIndex: 2 }}><Loci size={size * 1.1} expression="calm" /></div>
      <div style={{ transform: 'translateX(-8px)' }}><Focus size={size} expression="happy" /></div>
      <div style={{ transform: 'translateX(-14px) translateY(10px)' }}><Joy size={size * 0.85} /></div>
    </div>
  );
}

// Inject animations
(function ensureCharAnim() {
  if (document.getElementById('__char-anim')) return;
  const s = document.createElement('style');
  s.id = '__char-anim';
  s.textContent = `
    @keyframes charBreathe {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-1.5px) scale(1.015, 0.985); }
    }
    @keyframes charBlink {
      0%, 92%, 100% { transform: scaleY(1); }
      94%, 96% { transform: scaleY(0.1); }
    }
    @keyframes charBounce {
      0%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px) scale(1.04, 0.96); }
      60% { transform: translateY(0) scale(0.97, 1.03); }
    }
  `;
  document.head.appendChild(s);
})();

Object.assign(window, { CharShape, Face, Focus, Calm, Joy, Swift, Memo, Loci, BossMascot, MiniMascot, CharGroup });
