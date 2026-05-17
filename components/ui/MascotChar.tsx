/**
 * MascotChar — blob characters converted from the web prototype.
 * Breathing animation runs on the wrapping Animated.View (no CSS).
 * Blinking is simulated via opacity toggle on the eye group.
 */
import React, { useEffect, useState } from 'react';
import Svg, {
  Path, Circle, Ellipse, G, Line,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

type Shape  = 'tallPill' | 'bean' | 'round' | 'spark' | 'cloud' | 'droplet' | 'hex' | 'arch';
type Eyes   = 'happy' | 'dots' | 'wow' | 'sleepy' | 'wink';
type Mouth  = 'smile' | 'bigSmile' | 'flat' | 'small' | 'open' | 'oh' | 'cheeky';
type Brow   = 'raised' | 'angry' | 'concerned';

export type MascotKey = 'focus' | 'calm' | 'joy' | 'swift' | 'memo' | 'loci' | 'boss';
export type Expression = 'calm' | 'happy' | 'wow' | 'sleepy' | 'wink' | 'fast' | 'serious' | 'angry' | 'defeated';

// ─── Body paths (viewBox 0 0 100 120) ────────────────────────────────────────

const BODY_PATHS: Record<Shape, string> = {
  tallPill: 'M50 8 C 70 8, 84 24, 84 46 L 84 90 C 84 104, 72 112, 50 112 C 28 112, 16 104, 16 90 L 16 46 C 16 24, 30 8, 50 8 Z',
  round:    'M50 10 C 76 10, 90 28, 90 56 C 90 90, 72 110, 50 110 C 28 110, 10 90, 10 56 C 10 28, 24 10, 50 10 Z',
  bean:     'M28 30 C 28 14, 44 8, 56 14 C 70 8, 88 18, 88 38 C 88 58, 80 80, 68 96 C 56 110, 36 112, 24 100 C 12 84, 14 60, 22 44 C 24 38, 26 34, 28 30 Z',
  droplet:  'M50 8 C 64 8, 76 22, 78 42 C 80 60, 90 80, 80 96 C 70 110, 30 110, 20 96 C 10 80, 20 60, 22 42 C 24 22, 36 8, 50 8 Z',
  spark:    'M50 6 C 60 6, 66 16, 74 30 L 90 84 C 94 96, 86 110, 72 110 L 28 110 C 14 110, 6 96, 10 84 L 26 30 C 34 16, 40 6, 50 6 Z',
  arch:     'M50 8 C 76 8, 92 26, 92 56 L 92 96 C 92 106, 86 110, 76 110 L 24 110 C 14 110, 8 106, 8 96 L 8 56 C 8 26, 24 8, 50 8 Z',
  hex:      'M50 6 L 86 28 L 86 92 L 50 114 L 14 92 L 14 28 Z',
  cloud:    'M22 36 C 22 22, 36 16, 50 22 C 60 12, 80 18, 82 36 C 92 38, 96 56, 86 64 C 92 78, 80 92, 66 88 C 60 102, 38 102, 32 88 C 18 92, 8 78, 14 64 C 6 56, 12 40, 22 36 Z',
};

// ─── Face renderer (static SVG elements, no animation) ────────────────────────

interface FaceProps {
  eyes: Eyes;
  mouth: Mouth;
  brow?: Brow;
  blink: boolean;   // controlled by parent timer
  cx?: number;
  cy?: number;
}

function Face({ eyes, mouth, brow, blink, cx = 50, cy = 50 }: FaceProps) {
  const eyeY = cy;
  const dx   = 10;

  // Eyes
  const eyeOpacity = blink ? 0 : 1;

  let leftEye: React.ReactNode;
  let rightEye: React.ReactNode;

  if (eyes === 'happy') {
    leftEye  = <Path d={`M${cx-dx-4} ${eyeY+2} Q${cx-dx} ${eyeY-3} ${cx-dx+4} ${eyeY+2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    rightEye = <Path d={`M${cx+dx-4} ${eyeY+2} Q${cx+dx} ${eyeY-3} ${cx+dx+4} ${eyeY+2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (eyes === 'dots') {
    leftEye  = <Circle cx={cx-dx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
    rightEye = <Circle cx={cx+dx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
  } else if (eyes === 'wow') {
    leftEye  = <Circle cx={cx-dx} cy={eyeY} r="3.6" fill="#1a1a1a" />;
    rightEye = <Circle cx={cx+dx} cy={eyeY} r="3.6" fill="#1a1a1a" />;
  } else if (eyes === 'sleepy') {
    leftEye  = <Line x1={cx-dx-4} y1={eyeY} x2={cx-dx+4} y2={eyeY} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />;
    rightEye = <Line x1={cx+dx-4} y1={eyeY} x2={cx+dx+4} y2={eyeY} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />;
  } else if (eyes === 'wink') {
    leftEye  = <Path d={`M${cx-dx-4} ${eyeY+2} Q${cx-dx} ${eyeY-3} ${cx-dx+4} ${eyeY+2}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    rightEye = <Circle cx={cx+dx} cy={eyeY} r="2.6" fill="#1a1a1a" />;
  } else {
    leftEye  = <Circle cx={cx-dx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
    rightEye = <Circle cx={cx+dx} cy={eyeY} r="2.4" fill="#1a1a1a" />;
  }

  // Mouth
  const my = cy + 12;
  let mouthEl: React.ReactNode = null;
  if (mouth === 'smile') {
    mouthEl = <Path d={`M${cx-7} ${my-1} Q${cx} ${my+5} ${cx+7} ${my-1}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (mouth === 'bigSmile') {
    mouthEl = <Path d={`M${cx-11} ${my-2} Q${cx} ${my+9} ${cx+11} ${my-2} Z`} fill="#1a1a1a" />;
  } else if (mouth === 'flat') {
    mouthEl = <Line x1={cx-6} y1={my} x2={cx+6} y2={my} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />;
  } else if (mouth === 'small') {
    mouthEl = <Path d={`M${cx-3} ${my} Q${cx} ${my+2} ${cx+3} ${my}`} stroke="#1a1a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  } else if (mouth === 'open') {
    mouthEl = <Ellipse cx={cx} cy={my+1} rx="4" ry="5" fill="#1a1a1a" />;
  } else if (mouth === 'oh') {
    mouthEl = <Ellipse cx={cx} cy={my+1} rx="3" ry="4" fill="#1a1a1a" />;
  } else if (mouth === 'cheeky') {
    mouthEl = <Path d={`M${cx-6} ${my} Q${cx} ${my+5} ${cx+6} ${my} L${cx+4} ${my+2} Q${cx} ${my+4} ${cx-4} ${my+2} Z`} fill="#1a1a1a" />;
  }

  // Eyebrows
  let browEl: React.ReactNode = null;
  if (brow === 'raised') {
    browEl = (
      <G>
        <Path d={`M${cx-dx-5} ${eyeY-9} Q${cx-dx} ${eyeY-12} ${cx-dx+5} ${eyeY-9}`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d={`M${cx+dx-5} ${eyeY-9} Q${cx+dx} ${eyeY-12} ${cx+dx+5} ${eyeY-9}`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
    );
  } else if (brow === 'angry') {
    browEl = (
      <G>
        <Line x1={cx-dx-6} y1={eyeY-6} x2={cx-dx+4} y2={eyeY-10} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
        <Line x1={cx+dx+6} y1={eyeY-6} x2={cx+dx-4} y2={eyeY-10} stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
      </G>
    );
  } else if (brow === 'concerned') {
    browEl = (
      <G>
        <Line x1={cx-dx-4} y1={eyeY-10} x2={cx-dx+6} y2={eyeY-7} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <Line x1={cx+dx+4} y1={eyeY-10} x2={cx+dx-6} y2={eyeY-7} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      </G>
    );
  }

  return (
    <G>
      {browEl}
      <G opacity={eyeOpacity}>
        {leftEye}
        {rightEye}
      </G>
      {mouthEl}
    </G>
  );
}

// ─── Core character shape ─────────────────────────────────────────────────────

interface CharShapeProps {
  shape: Shape;
  color: string;
  accent?: string;
  size?: number;
  eyes?: Eyes;
  mouth?: Mouth;
  brow?: Brow;
  cheeks?: boolean;
  breathing?: boolean;
  blinking?: boolean;
}

export function CharShape({
  shape,
  color,
  accent,
  size = 80,
  eyes = 'happy',
  mouth = 'smile',
  brow,
  cheeks = true,
  breathing = true,
  blinking = true,
}: CharShapeProps) {
  const d = BODY_PATHS[shape] ?? BODY_PATHS.round;
  const w = size;
  const h = size * 1.2;

  // Blinking: toggle eye-closed state every ~4s
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!blinking) return;
    const schedule = () => {
      const delay = 3500 + Math.random() * 2000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          timerRef.current = schedule();
        }, 150);
      }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, [blinking]);

  // Breathing: subtle translate-Y oscillation on Animated.View
  const breathY = useSharedValue(0);
  useEffect(() => {
    if (!breathing) return;
    breathY.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 1800 }),
        withTiming(0,    { duration: 1800 }),
      ),
      -1,
      false,
    );
  }, [breathing]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: breathY.value }],
  }));

  return (
    <Animated.View style={[{ width: w, height: h }, breathStyle]}>
      <Svg width={w} height={h} viewBox="0 0 100 120">
        {/* Drop shadow */}
        <Ellipse cx="50" cy="115" rx="32" ry="3.5" fill="#000" opacity="0.07" />
        {/* Body shadow */}
        <Path d={d} fill="#000" opacity="0.16" y="3" />
        {/* Body */}
        <Path d={d} fill={color} />
        {/* Highlight gloss */}
        <Ellipse cx="32" cy="28" rx="14" ry="9" fill="#fff" opacity="0.18" />
        {/* Side accent */}
        {accent && (
          <Path d={d} fill={accent} opacity="0.22" />
        )}
        {/* Cheek blush */}
        {cheeks && (
          <>
            <Ellipse cx="28" cy="64" rx="6" ry="3.2" fill="#F87171" opacity="0.45" />
            <Ellipse cx="72" cy="64" rx="6" ry="3.2" fill="#F87171" opacity="0.45" />
          </>
        )}
        <Face eyes={eyes} mouth={mouth} brow={brow} blink={blink} />
      </Svg>
    </Animated.View>
  );
}

// ─── Mascot presets ───────────────────────────────────────────────────────────

type ExpMap = Partial<Record<Expression, { eyes: Eyes; mouth: Mouth; brow?: Brow; cheeks?: boolean }>>;

const MASCOTS: Record<MascotKey, {
  shape: Shape;
  color: string;
  accent: string;
  expressions: ExpMap;
  defaultExp: Expression;
}> = {
  focus: {
    shape: 'tallPill', color: '#22C55E', accent: '#16A34A',
    defaultExp: 'calm',
    expressions: {
      calm:   { eyes: 'happy',  mouth: 'smile' },
      happy:  { eyes: 'happy',  mouth: 'bigSmile' },
      wow:    { eyes: 'wow',    mouth: 'oh' },
      sleepy: { eyes: 'sleepy', mouth: 'small' },
    },
  },
  calm: {
    shape: 'bean', color: '#3B82F6', accent: '#2563EB',
    defaultExp: 'calm',
    expressions: {
      calm:   { eyes: 'sleepy', mouth: 'small' },
      happy:  { eyes: 'happy',  mouth: 'smile' },
      wow:    { eyes: 'wow',    mouth: 'oh' },
    },
  },
  joy: {
    shape: 'round', color: '#FACC15', accent: '#EAB308',
    defaultExp: 'happy',
    expressions: {
      calm:   { eyes: 'happy', mouth: 'smile' },
      happy:  { eyes: 'happy', mouth: 'bigSmile' },
      wink:   { eyes: 'wink',  mouth: 'cheeky' },
      wow:    { eyes: 'wow',   mouth: 'oh' },
    },
  },
  swift: {
    shape: 'spark', color: '#F97316', accent: '#EA580C',
    defaultExp: 'wow',
    expressions: {
      calm:   { eyes: 'dots',  mouth: 'smile' },
      happy:  { eyes: 'happy', mouth: 'bigSmile' },
      wow:    { eyes: 'wow',   mouth: 'oh' },
      fast:   { eyes: 'dots',  mouth: 'open' },
    },
  },
  memo: {
    shape: 'cloud', color: '#EC4899', accent: '#DB2777',
    defaultExp: 'calm',
    expressions: {
      calm:   { eyes: 'happy', mouth: 'smile' },
      happy:  { eyes: 'happy', mouth: 'bigSmile' },
      wow:    { eyes: 'wow',   mouth: 'oh' },
    },
  },
  loci: {
    shape: 'droplet', color: '#8B5CF6', accent: '#7C3AED',
    defaultExp: 'wink',
    expressions: {
      calm:   { eyes: 'sleepy', mouth: 'small' },
      happy:  { eyes: 'happy',  mouth: 'smile' },
      wink:   { eyes: 'wink',   mouth: 'cheeky' },
    },
  },
  boss: {
    shape: 'hex', color: '#DC2626', accent: '#B91C1C',
    defaultExp: 'serious',
    expressions: {
      serious:  { eyes: 'wow',    mouth: 'flat',  brow: 'angry', cheeks: false },
      angry:    { eyes: 'wow',    mouth: 'open',  brow: 'angry', cheeks: false },
      defeated: { eyes: 'sleepy', mouth: 'small', cheeks: false },
    },
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

interface MascotCharProps {
  which?: MascotKey;
  expression?: Expression;
  size?: number;
  breathing?: boolean;
  blinking?: boolean;
}

export function MascotChar({
  which = 'focus',
  expression,
  size = 80,
  breathing = true,
  blinking = true,
}: MascotCharProps) {
  const preset = MASCOTS[which] ?? MASCOTS.focus;
  const exp    = expression ?? preset.defaultExp;
  const face   = preset.expressions[exp] ?? Object.values(preset.expressions)[0];

  return (
    <CharShape
      shape={preset.shape}
      color={preset.color}
      accent={preset.accent}
      size={size}
      eyes={face.eyes}
      mouth={face.mouth}
      brow={face.brow}
      cheeks={face.cheeks ?? true}
      breathing={breathing}
      blinking={blinking}
    />
  );
}

/** Five mascots side-by-side for the welcome screen hero */
export function CharGroup({ size = 70 }: { size?: number }) {
  return (
    <Animated.View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Animated.View style={{ transform: [{ translateX: 14 }, { translateY: 8 }] }}>
        <MascotChar which="memo" size={size * 0.85} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: 8 }] }}>
        <MascotChar which="swift" size={size} />
      </Animated.View>
      <MascotChar which="loci" size={size * 1.1} expression="calm" />
      <Animated.View style={{ transform: [{ translateX: -8 }] }}>
        <MascotChar which="focus" size={size} expression="happy" />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: -14 }, { translateY: 10 }] }}>
        <MascotChar which="joy" size={size * 0.85} />
      </Animated.View>
    </Animated.View>
  );
}
