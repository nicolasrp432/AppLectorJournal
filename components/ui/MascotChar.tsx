/**
 * MascotChar — Premium Claymorphic 3D character design and procedurally animated vector component.
 * 
 * Architecture (100% Safe, Cross-Platform & Type-Safe):
 *  - Body & Volume: High-fidelity SVG render with <RadialGradient> volume and Specular Glass Highlight.
 *  - Face: Layered hardware-accelerated Animated.View elements with smooth spring-physics transitions.
 *  - Interactivity: Elastic squash, stretch & jump animation on touch.
 *  - Loops: Continuous subtle breathing and organic random double-blinking.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Path, Ellipse, Defs, RadialGradient, Stop
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────
type Shape = 'tallPill' | 'bean' | 'round' | 'spark' | 'cloud' | 'droplet' | 'hex' | 'arch';

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

const MASCOTS: Record<MascotKey, { shape: Shape; defaultExp: Expression }> = {
  focus: { shape: 'tallPill', defaultExp: 'calm' },
  calm:  { shape: 'bean',     defaultExp: 'calm' },
  joy:   { shape: 'round',    defaultExp: 'happy' },
  swift: { shape: 'spark',    defaultExp: 'wow' },
  memo:  { shape: 'cloud',    defaultExp: 'calm' },
  loci:  { shape: 'droplet',  defaultExp: 'wink' },
  boss:  { shape: 'hex',      defaultExp: 'serious' },
};

// spring stiffness and damping parameters
const SPRING_CONFIG = { damping: 13, stiffness: 110 };

interface CharShapeProps {
  which: MascotKey;
  expression: Expression;
  size: number;
  breathing: boolean;
  blinking: boolean;
}

export function CharShape({
  which,
  expression,
  size,
  breathing,
  blinking,
}: CharShapeProps) {
  const d = BODY_PATHS[MASCOTS[which]?.shape] ?? BODY_PATHS.round;
  const w = size;
  const h = size * 1.2;

  // ─── Face Container absolute metrics ───
  const faceW = w * 0.54;
  const faceH = h * 0.35;

  // ─── Reanimated Shared Values for Face elements ───
  const leftEyeOpenOpacity = useSharedValue(1);
  const leftEyeClosedOpacity = useSharedValue(0);
  const rightEyeOpenOpacity = useSharedValue(1);
  const rightEyeClosedOpacity = useSharedValue(0);

  const eyeScaleY = useSharedValue(1.0);
  const eyeScaleX = useSharedValue(1.0);

  const leftBrowY = useSharedValue(0);
  const leftBrowRotate = useSharedValue(0);
  const rightBrowY = useSharedValue(0);
  const rightBrowRotate = useSharedValue(0);

  const blushOpacity = useSharedValue(0.4);

  const mouthScaleY = useSharedValue(1.0);
  const mouthScaleX = useSharedValue(1.0);
  const mouthY = useSharedValue(0);

  const mouthSmileOpacity = useSharedValue(1);
  const mouthBigSmileOpacity = useSharedValue(0);
  const mouthOpenOpacity = useSharedValue(0);
  const mouthFlatOpacity = useSharedValue(0);

  // Blink scaling Shared Value (applied to open eyes)
  const blinkScaleY = useSharedValue(1.0);

  // Body Squash, Stretch & Jump parameters
  const bodyScaleX = useSharedValue(1.0);
  const bodyScaleY = useSharedValue(1.0);
  const bodyTranslateY = useSharedValue(0);
  const shadowScaleX = useSharedValue(1.0);

  // ─── Continuous Breathing Loop ───
  useEffect(() => {
    if (!breathing) {
      bodyScaleY.value = 1.0;
      bodyScaleX.value = 1.0;
      shadowScaleX.value = 1.0;
      return;
    }

    bodyScaleY.value = withRepeat(
      withSequence(
        withTiming(0.982, { duration: 1800 }),
        withTiming(1.0,    { duration: 1800 }),
      ),
      -1,
      false,
    );

    bodyScaleX.value = withRepeat(
      withSequence(
        withTiming(1.018, { duration: 1800 }),
        withTiming(1.0,    { duration: 1800 }),
      ),
      -1,
      false,
    );

    shadowScaleX.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1800 }),
        withTiming(1.0,   { duration: 1800 }),
      ),
      -1,
      false,
    );
  }, [breathing]);

  // ─── Random Natural Blinking ───
  useEffect(() => {
    if (!blinking) {
      blinkScaleY.value = 1.0;
      return;
    }

    const runBlink = () => {
      const delay = 3500 + Math.random() * 2500;
      return setTimeout(() => {
        blinkScaleY.value = withSequence(
          withTiming(0.08, { duration: 80 }),
          withTiming(1.0,  { duration: 110 }),
          ...(Math.random() > 0.7 ? [
            withTiming(0.08, { duration: 60 }),
            withTiming(1.0,  { duration: 90 }),
          ] : [])
        );
        timerRef.current = runBlink();
      }, delay);
    };

    const timerRef = { current: runBlink() };
    return () => clearTimeout(timerRef.current);
  }, [blinking]);

  // ─── Reactive Expression Smooth Transitions ───
  useEffect(() => {
    let targetLeftEyeOpen = 1;
    let targetLeftEyeClosed = 0;
    let targetRightEyeOpen = 1;
    let targetRightEyeClosed = 0;

    let targetEyeScaleY = 1.0;
    let targetEyeScaleX = 1.0;

    let targetLeftBrowY = 0;
    let targetLeftBrowRot = 0;
    let targetRightBrowY = 0;
    let targetRightBrowRot = 0;

    let targetBlush = 0.4;

    let targetMouthScaleY = 1.0;
    let targetMouthScaleX = 1.0;
    let targetMouthY = 0;

    let targetSmileOp = 0;
    let targetBigSmileOp = 0;
    let targetOpenOp = 0;
    let targetFlatOp = 0;

    switch (expression) {
      case 'calm':
        targetSmileOp = 1;
        targetEyeScaleY = 0.85;
        targetBlush = 0.35;
        break;

      case 'happy':
        targetLeftEyeOpen = 0;
        targetLeftEyeClosed = 1;
        targetRightEyeOpen = 0;
        targetRightEyeClosed = 1;
        targetBigSmileOp = 1;
        targetLeftBrowY = -3;
        targetRightBrowY = -3;
        targetBlush = 0.85;
        break;

      case 'wow':
        targetEyeScaleX = 1.35;
        targetEyeScaleY = 1.35;
        targetOpenOp = 1;
        targetMouthScaleY = 1.3;
        targetLeftBrowY = -4.5;
        targetRightBrowY = -4.5;
        targetLeftBrowRot = 7;
        targetRightBrowRot = -7;
        targetBlush = 0.55;
        break;

      case 'sleepy':
        targetLeftEyeOpen = 0;
        targetLeftEyeClosed = 1;
        targetRightEyeOpen = 0;
        targetRightEyeClosed = 1;
        targetSmileOp = 0.9;
        targetMouthScaleX = 0.6;
        targetMouthScaleY = 0.5;
        targetLeftBrowY = 2;
        targetRightBrowY = 2;
        targetLeftBrowRot = -5;
        targetRightBrowRot = 5;
        targetBlush = 0.15;
        break;

      case 'wink':
        targetLeftEyeOpen = 0;
        targetLeftEyeClosed = 1;
        targetRightEyeOpen = 1;
        targetRightEyeClosed = 0;
        targetSmileOp = 1;
        targetMouthScaleX = 0.95;
        targetLeftBrowY = -1;
        targetRightBrowY = -3.5;
        targetRightBrowRot = -6;
        targetBlush = 0.65;
        break;

      case 'fast':
        targetEyeScaleX = 0.85;
        targetEyeScaleY = 1.0;
        targetOpenOp = 1;
        targetMouthScaleY = 0.8;
        targetLeftBrowY = 1;
        targetRightBrowY = 1;
        targetBlush = 0.2;
        break;

      case 'serious':
        targetSmileOp = 0;
        targetFlatOp = 1;
        targetEyeScaleY = 0.9;
        targetLeftBrowRot = -10;
        targetRightBrowRot = 10;
        targetLeftBrowY = 2;
        targetRightBrowY = 2;
        targetBlush = 0.0;
        break;

      case 'angry':
        targetFlatOp = 1;
        targetEyeScaleY = 1.1;
        targetLeftBrowRot = -16;
        targetRightBrowRot = 16;
        targetLeftBrowY = 3.5;
        targetRightBrowY = 3.5;
        targetBlush = 0.0;
        break;

      case 'defeated':
        targetLeftEyeOpen = 0;
        targetLeftEyeClosed = 1;
        targetRightEyeOpen = 0;
        targetRightEyeClosed = 1;
        targetFlatOp = 1;
        targetLeftBrowY = 2.5;
        targetRightBrowY = 2.5;
        targetLeftBrowRot = 8;
        targetRightBrowRot = -8;
        targetBlush = 0.0;
        break;
    }

    leftEyeOpenOpacity.value = withSpring(targetLeftEyeOpen, SPRING_CONFIG);
    leftEyeClosedOpacity.value = withSpring(targetLeftEyeClosed, SPRING_CONFIG);
    rightEyeOpenOpacity.value = withSpring(targetRightEyeOpen, SPRING_CONFIG);
    rightEyeClosedOpacity.value = withSpring(targetRightEyeClosed, SPRING_CONFIG);

    eyeScaleX.value = withSpring(targetEyeScaleX, SPRING_CONFIG);
    eyeScaleY.value = withSpring(targetEyeScaleY, SPRING_CONFIG);

    leftBrowY.value = withSpring(targetLeftBrowY, SPRING_CONFIG);
    leftBrowRotate.value = withSpring(targetLeftBrowRot, SPRING_CONFIG);
    rightBrowY.value = withSpring(targetRightBrowY, SPRING_CONFIG);
    rightBrowRotate.value = withSpring(targetRightBrowRot, SPRING_CONFIG);

    blushOpacity.value = withSpring(targetBlush, SPRING_CONFIG);

    mouthScaleX.value = withSpring(targetMouthScaleX, SPRING_CONFIG);
    mouthScaleY.value = withSpring(targetMouthScaleY, SPRING_CONFIG);
    mouthY.value = withSpring(targetMouthY, SPRING_CONFIG);

    mouthSmileOpacity.value = withSpring(targetSmileOp, SPRING_CONFIG);
    mouthBigSmileOpacity.value = withSpring(targetBigSmileOp, SPRING_CONFIG);
    mouthOpenOpacity.value = withSpring(targetOpenOp, SPRING_CONFIG);
    mouthFlatOpacity.value = withSpring(targetFlatOp, SPRING_CONFIG);
  }, [expression]);

  // ─── Touch Jump Animation ───
  const handlePress = () => {
    bodyScaleX.value = withSequence(
      withTiming(1.15, { duration: 90 }),
      withSpring(1.0, { damping: 9, stiffness: 120 }),
    );
    bodyScaleY.value = withSequence(
      withTiming(0.81, { duration: 90 }),
      withSpring(1.0, { damping: 9, stiffness: 120 }),
    );
    shadowScaleX.value = withSequence(
      withTiming(1.22, { duration: 90 }),
      withSpring(1.0, { damping: 10 }),
    );
    bodyTranslateY.value = withSequence(
      withTiming(5, { duration: 90 }),
      withSpring(-22, { damping: 7, stiffness: 80 }),
      withSpring(0, { damping: 11, stiffness: 110 }),
    );
  };

  // ─── Animated Styles ────────────────────────────────────────────────────────
  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bodyTranslateY.value },
      { scaleX: bodyScaleX.value },
      { scaleY: bodyScaleY.value },
    ],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: shadowScaleX.value },
      { scaleY: 1.0 - (bodyTranslateY.value / -44) },
    ],
    opacity: 0.08 * (1.0 - (bodyTranslateY.value / -32)),
  }));

  // Facial elements style wrappers (type-safe standard View styles)
  const leftEyeStyle = useAnimatedStyle(() => ({
    opacity: leftEyeOpenOpacity.value,
    transform: [
      { scaleX: eyeScaleX.value },
      { scaleY: eyeScaleY.value * blinkScaleY.value },
    ],
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    opacity: rightEyeOpenOpacity.value,
    transform: [
      { scaleX: eyeScaleX.value },
      { scaleY: eyeScaleY.value * blinkScaleY.value },
    ],
  }));

  const leftClosedEyeStyle = useAnimatedStyle(() => ({
    opacity: leftEyeClosedOpacity.value,
    transform: [{ scaleY: blinkScaleY.value }],
  }));

  const rightClosedEyeStyle = useAnimatedStyle(() => ({
    opacity: rightEyeClosedOpacity.value,
    transform: [{ scaleY: blinkScaleY.value }],
  }));

  const leftBrowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: leftBrowY.value },
      { rotate: `${leftBrowRotate.value}deg` },
    ],
  }));

  const rightBrowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: rightBrowY.value },
      { rotate: `${rightBrowRotate.value}deg` },
    ],
  }));

  const blushLeftStyle = useAnimatedStyle(() => ({
    opacity: blushOpacity.value,
  }));

  const blushRightStyle = useAnimatedStyle(() => ({
    opacity: blushOpacity.value,
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: mouthScaleX.value },
      { scaleY: mouthScaleY.value },
      { translateY: mouthY.value },
    ],
  }));

  const smileMouthStyle = useAnimatedStyle(() => ({ opacity: mouthSmileOpacity.value }));
  const bigSmileMouthStyle = useAnimatedStyle(() => ({ opacity: mouthBigSmileOpacity.value }));
  const openMouthStyle = useAnimatedStyle(() => ({ opacity: mouthOpenOpacity.value }));
  const flatMouthStyle = useAnimatedStyle(() => ({ opacity: mouthFlatOpacity.value }));

  return (
    <Pressable onPress={handlePress} style={{ width: w, height: h }}>
      <View style={{ width: w, height: h, position: 'relative' }}>
        
        {/* Shadow absolute (at bottom of character) */}
        <Animated.View style={[styles.shadowContainer, shadowAnimatedStyle, { width: w }]}>
          <Svg width="100%" height="12" viewBox="0 0 100 12" preserveAspectRatio="none">
            <Ellipse cx="50" cy="6" rx="32" ry="3.5" fill="#000" />
          </Svg>
        </Animated.View>

        {/* 3D Claymorphic Body (SVG) */}
        <Animated.View style={[{ width: w, height: h }, bodyAnimatedStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 120">
            <Defs>
              <RadialGradient id="grad_focus" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#86EFAC" />
                <Stop offset="55%" stopColor="#22C55E" />
                <Stop offset="100%" stopColor="#15803D" />
              </RadialGradient>
              <RadialGradient id="grad_calm" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#93C5FD" />
                <Stop offset="55%" stopColor="#3B82F6" />
                <Stop offset="100%" stopColor="#1D4ED8" />
              </RadialGradient>
              <RadialGradient id="grad_joy" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#FEF08A" />
                <Stop offset="55%" stopColor="#FACC15" />
                <Stop offset="100%" stopColor="#CA8A04" />
              </RadialGradient>
              <RadialGradient id="grad_swift" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#FED7AA" />
                <Stop offset="55%" stopColor="#F97316" />
                <Stop offset="100%" stopColor="#C2410C" />
              </RadialGradient>
              <RadialGradient id="grad_memo" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#FBCFE8" />
                <Stop offset="55%" stopColor="#EC4899" />
                <Stop offset="100%" stopColor="#9D174D" />
              </RadialGradient>
              <RadialGradient id="grad_loci" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#C084FC" />
                <Stop offset="55%" stopColor="#8B5CF6" />
                <Stop offset="100%" stopColor="#5B21B6" />
              </RadialGradient>
              <RadialGradient id="grad_boss" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
                <Stop offset="0%" stopColor="#FECACA" />
                <Stop offset="55%" stopColor="#DC2626" />
                <Stop offset="100%" stopColor="#991B1B" />
              </RadialGradient>
            </Defs>
            {/* Underlay shadow */}
            <Path d={d} fill="#000" opacity="0.12" y="2.5" />
            {/* Primary body */}
            <Path d={d} fill={`url(#grad_${which})`} />
            {/* Glass highlight */}
            <Ellipse cx="35" cy="27" rx="14" ry="7.5" fill="#fff" opacity="0.22" />
          </Svg>

          {/* ─── absolute face overlay ─── */}
          <View style={[styles.faceContainer, { width: faceW, height: faceH, left: w * 0.23, top: h * 0.36 }]}>
            
            {/* Eyebrows */}
            <Animated.View style={[styles.brow, { left: '10%' }, leftBrowStyle]}>
              <View style={styles.browLine} />
            </Animated.View>
            <Animated.View style={[styles.brow, { right: '10%' }, rightBrowStyle]}>
              <View style={styles.browLine} />
            </Animated.View>

            {/* Left Eye Open (Dot) */}
            <Animated.View style={[styles.eyeOpen, { left: '20%' }, leftEyeStyle]} />
            {/* Left Eye Closed (Curve) */}
            <Animated.View style={[styles.eyeClosed, { left: '16%' }, leftClosedEyeStyle]}>
              <Svg width="12" height="8" viewBox="0 0 12 8">
                <Path d="M1 7 Q6 1 11 7" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </Svg>
            </Animated.View>

            {/* Right Eye Open (Dot) */}
            <Animated.View style={[styles.eyeOpen, { right: '20%' }, rightEyeStyle]} />
            {/* Right Eye Closed (Curve) */}
            <Animated.View style={[styles.eyeClosed, { right: '16%' }, rightClosedEyeStyle]}>
              <Svg width="12" height="8" viewBox="0 0 12 8">
                <Path d="M1 7 Q6 1 11 7" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </Svg>
            </Animated.View>

            {/* Cheeks Blush */}
            <Animated.View style={[styles.blush, { left: '2%' }, blushLeftStyle]} />
            <Animated.View style={[styles.blush, { right: '2%' }, blushRightStyle]} />

            {/* Mouth */}
            <Animated.View style={[styles.mouthContainer, mouthStyle]}>
              {/* Smile / Small smile curve */}
              <Animated.View style={[styles.mouthAbsolute, smileMouthStyle]}>
                <Svg width="16" height="10" viewBox="0 0 16 10">
                  <Path d="M2 2 Q8 8 14 2" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </Svg>
              </Animated.View>

              {/* Big Crescent Smile */}
              <Animated.View style={[styles.mouthAbsolute, bigSmileMouthStyle]}>
                <Svg width="20" height="14" viewBox="0 0 20 14">
                  <Path d="M2 2 Q10 12 18 2 Z" fill="#1a1a1a" />
                </Svg>
              </Animated.View>

              {/* Open / Oh mouth (pill) */}
              <Animated.View style={[styles.mouthAbsolute, openMouthStyle]}>
                <View style={styles.mouthOhPill} />
              </Animated.View>

              {/* Flat line mouth */}
              <Animated.View style={[styles.mouthAbsolute, flatMouthStyle]}>
                <View style={styles.mouthFlatLine} />
              </Animated.View>
            </Animated.View>

          </View>
        </Animated.View>

      </View>
    </Pressable>
  );
}

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

  return (
    <CharShape
      which={which}
      expression={exp}
      size={size}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    bottom: 0,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceContainer: {
    position: 'absolute',
  },
  brow: {
    position: 'absolute',
    top: '15%',
    width: '32%',
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browLine: {
    width: '100%',
    height: 2.5,
    borderRadius: 1.2,
    backgroundColor: '#1a1a1a',
  },
  eyeOpen: {
    position: 'absolute',
    top: '32%',
    width: '11%',
    height: '24%',
    borderRadius: 99,
    backgroundColor: '#1a1a1a',
  },
  eyeClosed: {
    position: 'absolute',
    top: '34%',
    width: '20%',
    height: '18%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blush: {
    position: 'absolute',
    top: '56%',
    width: '16%',
    height: '11%',
    borderRadius: 99,
    backgroundColor: '#F87171',
  },
  mouthContainer: {
    position: 'absolute',
    left: '35%',
    top: '53%',
    width: '30%',
    height: '28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouthAbsolute: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouthOhPill: {
    width: '56%',
    height: '76%',
    borderRadius: 99,
    backgroundColor: '#1a1a1a',
  },
  mouthFlatLine: {
    width: '76%',
    height: 2.5,
    borderRadius: 1.2,
    backgroundColor: '#1a1a1a',
  },
});
