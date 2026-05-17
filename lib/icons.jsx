// Flat minimalist icons — tinted surface + accent stroke/fill
// No metallic shine, no gradients. Still rounded/modern.

function GIcon({ name, size = 28, accent = '#22C55E', dark = false }) {
  const tint = dark ? 'rgba(255,255,255,0.10)' : `${accent}14`;
  const stroke = dark ? 'rgba(255,255,255,0.25)' : `${accent}30`;
  const iconColor = accent;

  const Container = ({ children, radius = 8, showBg = true }) => (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'block' }}>
      {showBg && <rect x="2" y="2" width="28" height="28" rx={radius} fill={tint} stroke={stroke} strokeWidth="1" />}
      {children}
    </svg>
  );

  const sw = 1.8;

  const icons = {
    path: (
      <Container>
        <path d="M 16 8 L 10 24 L 16 21 L 22 24 Z" fill={iconColor} />
      </Container>
    ),
    chart: (
      <Container>
        <rect x="8" y="18" width="3.5" height="7" rx="1" fill={iconColor} opacity="0.5" />
        <rect x="14.25" y="13" width="3.5" height="12" rx="1" fill={iconColor} opacity="0.75" />
        <rect x="20.5" y="9" width="3.5" height="16" rx="1" fill={iconColor} />
      </Container>
    ),
    book: (
      <Container>
        <path d="M 9 9 Q 9 8 10 8 L 16 9 L 22 8 Q 23 8 23 9 L 23 23 Q 23 24 22 24 L 16 23 L 10 24 Q 9 24 9 23 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <line x1="16" y1="9" x2="16" y2="23" stroke={iconColor} strokeWidth={sw} />
      </Container>
    ),
    trophy: (
      <Container>
        <path d="M 11 9 L 21 9 L 20 16 Q 20 19 16 19 Q 12 19 12 16 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M 11 11 L 8 11 L 8 14 Q 8 16 11 16" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <path d="M 21 11 L 24 11 L 24 14 Q 24 16 21 16" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <line x1="16" y1="19" x2="16" y2="22" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <line x1="12" y1="23" x2="20" y2="23" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    user: (
      <Container>
        <circle cx="16" cy="13" r="3.5" fill="none" stroke={iconColor} strokeWidth={sw} />
        <path d="M 9 24 Q 9 18 16 18 Q 23 18 23 24" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    flame: (
      <Container>
        <path d="M 16 7 Q 20 12 20 16 Q 22 14 22 17 Q 22 24 16 25 Q 10 24 10 17 Q 10 14 12 16 Q 12 12 16 7 Z" fill={iconColor} />
      </Container>
    ),
    bolt: (
      <Container>
        <path d="M 18 6 L 10 18 L 15 18 L 13 26 L 22 13 L 17 13 Z" fill={iconColor} />
      </Container>
    ),
    target: (
      <Container>
        <circle cx="16" cy="16" r="7" fill="none" stroke={iconColor} strokeWidth={sw} />
        <circle cx="16" cy="16" r="3.5" fill="none" stroke={iconColor} strokeWidth={sw} opacity="0.6" />
        <circle cx="16" cy="16" r="1.3" fill={iconColor} />
      </Container>
    ),
    gauge: (
      <Container>
        <path d="M 7 20 Q 7 11 16 11 Q 25 11 25 20" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="16" cy="20" r="1.3" fill={iconColor} />
        <line x1="16" y1="20" x2="22" y2="13" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    brain: (
      <Container>
        <path d="M 10 12 Q 10 8 14 8 Q 16 7 16 10 L 16 22 Q 16 25 14 25 Q 10 25 10 21 Q 7 20 7 17 Q 7 15 9 14 Q 9 13 10 12 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M 22 12 Q 22 8 18 8 Q 16 7 16 10 L 16 22 Q 16 25 18 25 Q 22 25 22 21 Q 25 20 25 17 Q 25 15 23 14 Q 23 13 22 12 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
      </Container>
    ),
    clock: (
      <Container>
        <circle cx="16" cy="16" r="7" fill="none" stroke={iconColor} strokeWidth={sw} />
        <line x1="16" y1="16" x2="16" y2="11.5" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <line x1="16" y1="16" x2="19.5" y2="17.5" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    calendar: (
      <Container>
        <rect x="8" y="11" width="16" height="13" rx="2" fill="none" stroke={iconColor} strokeWidth={sw} />
        <line x1="8" y1="15" x2="24" y2="15" stroke={iconColor} strokeWidth={sw} />
        <line x1="12" y1="9" x2="12" y2="12" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <line x1="20" y1="9" x2="20" y2="12" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    settings: (
      <Container>
        <circle cx="16" cy="16" r="2.8" fill="none" stroke={iconColor} strokeWidth={sw} />
        <g stroke={iconColor} strokeWidth={sw} strokeLinecap="round">
          <line x1="16" y1="8" x2="16" y2="10.5" />
          <line x1="16" y1="21.5" x2="16" y2="24" />
          <line x1="8" y1="16" x2="10.5" y2="16" />
          <line x1="21.5" y1="16" x2="24" y2="16" />
          <line x1="10.3" y1="10.3" x2="12.1" y2="12.1" />
          <line x1="19.9" y1="19.9" x2="21.7" y2="21.7" />
          <line x1="21.7" y1="10.3" x2="19.9" y2="12.1" />
          <line x1="12.1" y1="19.9" x2="10.3" y2="21.7" />
        </g>
      </Container>
    ),
    search: (
      <Container>
        <circle cx="14" cy="14" r="5" fill="none" stroke={iconColor} strokeWidth={sw} />
        <line x1="18" y1="18" x2="22.5" y2="22.5" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" />
      </Container>
    ),
    bell: (
      <Container>
        <path d="M 10 20 L 22 20 Q 22 18 21 17 Q 20 16 20 13 Q 20 9 16 9 Q 12 9 12 13 Q 12 16 11 17 Q 10 18 10 20 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx="16" cy="22.5" r="1.3" fill={iconColor} />
      </Container>
    ),
    play: (
      <Container>
        <path d="M 12 9 L 22 16 L 12 23 Z" fill={iconColor} />
      </Container>
    ),
    plus: (
      <Container>
        <line x1="16" y1="9" x2="16" y2="23" stroke={iconColor} strokeWidth={sw + 0.4} strokeLinecap="round" />
        <line x1="9" y1="16" x2="23" y2="16" stroke={iconColor} strokeWidth={sw + 0.4} strokeLinecap="round" />
      </Container>
    ),
    lock: (
      <Container>
        <rect x="10" y="15" width="12" height="9" rx="1.5" fill="none" stroke={iconColor} strokeWidth={sw} />
        <path d="M 12.5 15 L 12.5 12 Q 12.5 8.5 16 8.5 Q 19.5 8.5 19.5 12 L 19.5 15" fill="none" stroke={iconColor} strokeWidth={sw} />
        <circle cx="16" cy="19" r="1.2" fill={iconColor} />
      </Container>
    ),
    check: (
      <Container>
        <path d="M 9 16.5 L 13.5 21 L 23 11.5" fill="none" stroke={iconColor} strokeWidth={sw + 0.6} strokeLinecap="round" strokeLinejoin="round" />
      </Container>
    ),
    bookmark: (
      <Container>
        <path d="M 11 8.5 L 21 8.5 L 21 24 L 16 20 L 11 24 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
      </Container>
    ),
    x: (
      <Container>
        <line x1="10.5" y1="10.5" x2="21.5" y2="21.5" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" />
        <line x1="21.5" y1="10.5" x2="10.5" y2="21.5" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" />
      </Container>
    ),
    arrowRight: (
      <Container>
        <line x1="9" y1="16" x2="22" y2="16" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" />
        <path d="M 17 11 L 22 16 L 17 21" fill="none" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" strokeLinejoin="round" />
      </Container>
    ),
    arrowLeft: (
      <Container>
        <line x1="23" y1="16" x2="10" y2="16" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" />
        <path d="M 15 11 L 10 16 L 15 21" fill="none" stroke={iconColor} strokeWidth={sw + 0.2} strokeLinecap="round" strokeLinejoin="round" />
      </Container>
    ),
    home: (
      <Container>
        <path d="M 8 16 L 16 9 L 24 16 L 24 24 L 19 24 L 19 18 L 13 18 L 13 24 L 8 24 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
      </Container>
    ),
    compass: (
      <Container>
        <circle cx="16" cy="16" r="7.5" fill="none" stroke={iconColor} strokeWidth={sw} />
        <path d="M 16 11 L 18.5 16 L 16 21 L 13.5 16 Z" fill={iconColor} />
      </Container>
    ),
    eye: (
      <Container>
        <path d="M 7 16 Q 11 10 16 10 Q 21 10 25 16 Q 21 22 16 22 Q 11 22 7 16 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx="16" cy="16" r="3" fill={iconColor} />
      </Container>
    ),
    sparkle: (
      <Container>
        <path d="M 16 7 L 17.5 14.5 L 25 16 L 17.5 17.5 L 16 25 L 14.5 17.5 L 7 16 L 14.5 14.5 Z" fill={iconColor} />
      </Container>
    ),
    medal: (
      <Container>
        <path d="M 11 7 L 13.5 13 M 21 7 L 18.5 13" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="16" cy="18" r="6" fill="none" stroke={iconColor} strokeWidth={sw} />
        <circle cx="16" cy="18" r="2.5" fill={iconColor} />
      </Container>
    ),
    crown: (
      <Container>
        <path d="M 8 12 L 11 18 L 16 11 L 21 18 L 24 12 L 23 23 L 9 23 Z" fill={iconColor} stroke={iconColor} strokeWidth="0.5" strokeLinejoin="round" />
        <circle cx="8" cy="11" r="1.2" fill={iconColor} />
        <circle cx="24" cy="11" r="1.2" fill={iconColor} />
        <circle cx="16" cy="10" r="1.2" fill={iconColor} />
      </Container>
    ),
    palace: (
      <Container>
        <path d="M 7 22 L 7 14 L 12 11 L 12 14 L 16 11 L 20 14 L 20 11 L 25 14 L 25 22 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <rect x="14" y="18" width="4" height="5" fill={iconColor} />
      </Container>
    ),
    rocket: (
      <Container>
        <path d="M 16 7 Q 21 11 21 17 L 21 21 L 16 23 L 11 21 L 11 17 Q 11 11 16 7 Z" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx="16" cy="14" r="1.8" fill={iconColor} />
        <path d="M 13 21 L 11 25 M 19 21 L 21 25" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    headphones: (
      <Container>
        <path d="M 8 18 Q 8 9 16 9 Q 24 9 24 18" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
        <rect x="7" y="17" width="4" height="7" rx="1.5" fill={iconColor} />
        <rect x="21" y="17" width="4" height="7" rx="1.5" fill={iconColor} />
      </Container>
    ),
    feather: (
      <Container>
        <path d="M 23 9 Q 9 13 9 23 L 11 23 Q 11 15 23 12 Z" fill={iconColor} />
        <line x1="11" y1="23" x2="16" y2="18" stroke={iconColor} strokeWidth={sw} strokeLinecap="round" />
      </Container>
    ),
    snowflake: (
      <Container>
        <g stroke={iconColor} strokeWidth={sw} strokeLinecap="round">
          <line x1="16" y1="8" x2="16" y2="24" />
          <line x1="9" y1="12" x2="23" y2="20" />
          <line x1="23" y1="12" x2="9" y2="20" />
          <line x1="14" y1="10" x2="16" y2="8" />
          <line x1="18" y1="10" x2="16" y2="8" />
          <line x1="14" y1="22" x2="16" y2="24" />
          <line x1="18" y1="22" x2="16" y2="24" />
        </g>
      </Container>
    ),
    gift: (
      <Container>
        <rect x="8" y="13" width="16" height="10" rx="1.5" fill="none" stroke={iconColor} strokeWidth={sw} />
        <line x1="16" y1="13" x2="16" y2="23" stroke={iconColor} strokeWidth={sw} />
        <path d="M 11 13 Q 9 9 13 9 Q 16 9 16 13 Q 16 9 19 9 Q 23 9 21 13" fill="none" stroke={iconColor} strokeWidth={sw} strokeLinejoin="round" />
      </Container>
    ),
    grid: (
      <Container>
        <rect x="8" y="8" width="6" height="6" rx="1" fill={iconColor} opacity="0.45" />
        <rect x="18" y="8" width="6" height="6" rx="1" fill={iconColor} />
        <rect x="8" y="18" width="6" height="6" rx="1" fill={iconColor} />
        <rect x="18" y="18" width="6" height="6" rx="1" fill={iconColor} opacity="0.45" />
      </Container>
    ),
    layers: (
      <Container>
        <path d="M 16 9 L 24 13 L 16 17 L 8 13 Z" fill={iconColor} opacity="0.55" />
        <path d="M 16 17 L 24 21 L 16 25 L 8 21 Z" fill={iconColor} />
      </Container>
    ),
    moon: (
      <Container>
        <path d="M 21 16 A 8 8 0 1 1 13 8 A 6 6 0 0 0 21 16 Z" fill={iconColor} />
      </Container>
    ),
    coin: (
      <Container>
        <circle cx="16" cy="16" r="7.5" fill={iconColor} />
        <text x="16" y="20" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="9" fontWeight="900" fill="#fff">XP</text>
      </Container>
    ),
  };

  return icons[name] || icons.path;
}

Object.assign(window, { GIcon });
