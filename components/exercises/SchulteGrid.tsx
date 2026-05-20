import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, withRepeat, interpolateColor,
} from 'react-native-reanimated';
import { ExerciseTopBar } from './ExerciseTopBar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import * as haptics from '../../lib/haptics';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  size?: number;
  accent?: string;
  onFinish: (result: { time: number; errors: number; size: number }) => void;
  onQuit: () => void;
}

export function SchulteGrid({ size = 5, accent = COLORS.focus, onFinish, onQuit }: Props) {
  const total = size * size;
  const [numbers] = useState(() => shuffle([...Array(total)].map((_, i) => i + 1)));
  const [next, setNext] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const startTime = useRef(Date.now());

  // Fever Mode Tracking
  const lastCorrectTaps = useRef<number[]>([]);
  const [feverActive, setFeverActive] = useState(false);

  // Reanimated values for general game effects
  const bgAnim = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const gridShake = useSharedValue(0);
  const feverScale = useSharedValue(0);
  const feverRotation = useSharedValue(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startTime.current) / 1000), 100);
    return () => clearInterval(t);
  }, []);

  // Background breathing animation
  useEffect(() => {
    bgAnim.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1,
      true
    );
  }, []);

  // Fever Mode monitor (deactivates if no correct tap in 1.2s)
  useEffect(() => {
    if (!feverActive) return;
    const interval = setInterval(() => {
      const lastTap = lastCorrectTaps.current[lastCorrectTaps.current.length - 1];
      if (lastTap && Date.now() - lastTap > 1200) {
        setFeverActive(false);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [feverActive]);

  // Fever Badge scaling and rotation animations
  useEffect(() => {
    if (feverActive) {
      feverScale.value = withSpring(1, { damping: 10, stiffness: 120 });
      feverRotation.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 90 }),
          withTiming(6, { duration: 90 })
        ),
        -1,
        true
      );
    } else {
      feverScale.value = withTiming(0, { duration: 150 });
      feverRotation.value = withTiming(0, { duration: 150 });
    }
  }, [feverActive]);

  const handleTap = (n: number) => {
    if (n === next) {
      const now = Date.now();
      const newTaps = [...lastCorrectTaps.current, now].slice(-3);
      lastCorrectTaps.current = newTaps;

      // Check if 3 taps made in less than 1.2s
      if (newTaps.length === 3 && now - newTaps[0] <= 1200) {
        if (!feverActive) {
          haptics.success(); // Extra punchy feel
        }
        setFeverActive(true);
      }

      if (next === total) {
        onFinish({ time: (Date.now() - startTime.current) / 1000, errors, size });
      } else {
        haptics.tap();
        setNext(next + 1);
      }
    } else {
      haptics.error();
      setErrors(e => e + 1);
      setShakeId(n);
      setFeverActive(false); // Break fever mode
      lastCorrectTaps.current = []; // Clear fever history

      // Error effects: whole grid shakes + red flash
      gridShake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-7, { duration: 60 }),
        withTiming(7, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );

      flashOpacity.value = withSequence(
        withTiming(0.18, { duration: 80 }),
        withTiming(0, { duration: 250 })
      );

      setTimeout(() => setShakeId(null), 300);
    }
  };

  const cellSize = size === 3 ? 96 : size === 4 ? 78 : size === 5 ? 62 : size === 6 ? 52 : 44;
  const fontSize = size === 3 ? 34 : size === 4 ? 28 : size === 5 ? 24 : size === 6 ? 20 : 16;

  // Background styling
  const animatedBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgAnim.value,
      [0, 1],
      ['#FAF9FF', '#F0F7FF'] // Breathe between soft violet and soft blue
    );
    return { backgroundColor };
  });

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const animatedGridStyle = useAnimatedStyle(() => {
    const scale = feverActive ? withSpring(1.03, { damping: 10 }) : withSpring(1, { damping: 10 });
    return {
      transform: [{ translateX: gridShake.value }, { scale }],
      borderColor: feverActive ? '#EC4899' : COLORS.border,
      borderWidth: feverActive ? 2 : 0,
      shadowColor: feverActive ? '#EC4899' : '#000',
      shadowOpacity: feverActive ? 0.25 : 0.04,
      shadowRadius: feverActive ? 25 : 20,
    };
  });

  const feverBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: feverScale.value }, { rotate: `${feverRotation.value}deg` }],
    opacity: feverScale.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedBgStyle]}>
      {/* Red screen flash for incorrect inputs */}
      <Animated.View style={[styles.flashOverlay, animatedFlashStyle]} pointerEvents="none" />

      <ExerciseTopBar progress={(next - 1) / total} accent={accent} onQuit={onQuit} title="Schulte Grid" />

      <View style={styles.statsRow}>
        <StatPill value={elapsed.toFixed(1) + 's'} label="Tiempo" color="#3B82F6" />
        <StatPill value={`${next - 1}/${total}`} label="Progreso" color={accent} />
        <StatPill value={String(errors)} label="Errores" color="#EF4444" />
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Busca</Text>
        <View style={styles.targetNumberWrapper}>
          <Text style={[styles.targetNumber, { color: accent }]}>{next}</Text>
          <Animated.View style={[styles.feverBadge, feverBadgeStyle]}>
            <Text style={styles.feverBadgeText}>🔥 FEVER</Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.gridWrapper}>
        <Animated.View style={[styles.gridCard, { gap: 8 }, animatedGridStyle]}>
          {Array.from({ length: size }, (_, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 8 }}>
              {numbers.slice(row * size, (row + 1) * size).map((n) => (
                <GridCell
                  key={n}
                  n={n}
                  done={n < next}
                  shaking={shakeId === n}
                  size={cellSize}
                  fontSize={fontSize}
                  accent={accent}
                  onPress={() => handleTap(n)}
                  feverActive={feverActive}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function GridCell({ n, done, shaking, size, fontSize, accent, onPress, feverActive }: {
  n: number; done: boolean; shaking: boolean; size: number; fontSize: number; accent: string; onPress: () => void; feverActive: boolean;
}) {
  const tx = useSharedValue(0);
  const scale = useSharedValue(1);

  // Shockwave radial ripple Reanimated values
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  // Particle explosion Reanimated values
  const p1x = useSharedValue(0); const p1y = useSharedValue(0);
  const p2x = useSharedValue(0); const p2y = useSharedValue(0);
  const p3x = useSharedValue(0); const p3y = useSharedValue(0);
  const p4x = useSharedValue(0); const p4y = useSharedValue(0);
  const pOpacity = useSharedValue(0);

  // Dynamic cell border color rotation in Fever Mode
  const borderPulse = useSharedValue(0);

  useEffect(() => {
    if (shaking) {
      tx.value = withSequence(
        withTiming(-6, { duration: 75 }),
        withTiming(6, { duration: 75 }),
        withTiming(-4, { duration: 75 }),
        withTiming(0, { duration: 75 }),
      );
    }
  }, [shaking]);

  useEffect(() => {
    if (feverActive) {
      borderPulse.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      );
    } else {
      borderPulse.value = withTiming(0, { duration: 200 });
    }
  }, [feverActive]);

  const triggerTapEffects = () => {
    // Elastic scale bounce
    scale.value = withSequence(
      withSpring(0.85, { damping: 9, stiffness: 350 }),
      withSpring(1, { damping: 7, stiffness: 220 })
    );

    // Shockwave ripple
    rippleScale.value = 0.3;
    rippleOpacity.value = 0.8;
    rippleScale.value = withTiming(1.8, { duration: 380 });
    rippleOpacity.value = withTiming(0, { duration: 380 });

    // Shoot particle stars
    pOpacity.value = 1;
    p1x.value = 0; p1y.value = 0;
    p2x.value = 0; p2y.value = 0;
    p3x.value = 0; p3y.value = 0;
    p4x.value = 0; p4y.value = 0;

    const dist = size * 0.7;
    p1x.value = withSpring(-dist, { damping: 10 });
    p1y.value = withSpring(-dist, { damping: 10 });
    p2x.value = withSpring(dist, { damping: 10 });
    p2y.value = withSpring(-dist, { damping: 10 });
    p3x.value = withSpring(-dist, { damping: 10 });
    p3y.value = withSpring(dist, { damping: 10 });
    p4x.value = withSpring(dist, { damping: 10 });
    p4y.value = withSpring(dist, { damping: 10 });

    pOpacity.value = withTiming(0, { duration: 380 });
  };

  useEffect(() => {
    if (done) {
      triggerTapEffects();
    }
  }, [done]);

  const animatedCellProps = useAnimatedStyle(() => {
    const bColor = feverActive
      ? interpolateColor(borderPulse.value, [0, 1], ['#06B6D4', '#EC4899']) // Cyan to Pink
      : shaking 
        ? '#EF4444' 
        : 'transparent';

    return {
      transform: [{ translateX: tx.value }, { scale: scale.value }],
      borderColor: bColor,
      borderWidth: (feverActive || shaking) ? 2 : 0,
      shadowColor: feverActive ? '#06B6D4' : 'transparent',
      shadowOpacity: feverActive ? 0.3 : 0,
      shadowRadius: feverActive ? 8 : 0,
    };
  });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // Particles positioning and styling
  const pStyle1 = useAnimatedStyle(() => ({ transform: [{ translateX: p1x.value }, { translateY: p1y.value }], opacity: pOpacity.value }));
  const pStyle2 = useAnimatedStyle(() => ({ transform: [{ translateX: p2x.value }, { translateY: p2y.value }], opacity: pOpacity.value }));
  const pStyle3 = useAnimatedStyle(() => ({ transform: [{ translateX: p3x.value }, { translateY: p3y.value }], opacity: pOpacity.value }));
  const pStyle4 = useAnimatedStyle(() => ({ transform: [{ translateX: p4x.value }, { translateY: p4y.value }], opacity: pOpacity.value }));

  return (
    <Animated.View style={[styles.cellWrapper, animatedCellProps]}>
      {/* Dynamic shockwave background overlay */}
      <Animated.View
        style={[
          styles.cellRipple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: feverActive ? 'rgba(236,72,153,0.3)' : `${accent}35`,
          },
          rippleStyle,
        ]}
        pointerEvents="none"
      />

      {/* Explosive radial particles */}
      <Animated.View style={[styles.starParticle, pStyle1, { backgroundColor: feverActive ? '#EC4899' : accent }]} pointerEvents="none" />
      <Animated.View style={[styles.starParticle, pStyle2, { backgroundColor: feverActive ? '#06B6D4' : accent }]} pointerEvents="none" />
      <Animated.View style={[styles.starParticle, pStyle3, { backgroundColor: feverActive ? '#3B82F6' : accent }]} pointerEvents="none" />
      <Animated.View style={[styles.starParticle, pStyle4, { backgroundColor: feverActive ? '#EC4899' : accent }]} pointerEvents="none" />

      <Pressable
        onPress={onPress}
        disabled={done}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: 12,
            backgroundColor: done ? `${accent}15` : COLORS.white,
          },
        ]}
      >
        <Text
          style={[
            styles.cellText,
            {
              fontSize,
              color: done 
                ? `${accent}60` 
                : feverActive 
                  ? '#4B5563' 
                  : COLORS.ink,
            },
          ]}
        >
          {n}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.canvas },
  flashOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: '#EF4444', zIndex: 9999 },
  statsRow:    { flexDirection: 'row', gap: 8, padding: 14 },
  pill:        { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.surface, alignItems: 'center' },
  pillValue:   { fontFamily: FONTS.heading, fontSize: 16, lineHeight: 20 },
  pillLabel:   { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  targetRow:   { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  targetLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  targetNumberWrapper: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  targetNumber:{ fontFamily: FONTS.heading, fontSize: 56, lineHeight: 64 },
  feverBadge:  { position: 'absolute', right: -70, top: 12, backgroundColor: '#EC4899', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, transform: [{ rotate: '5deg' }] },
  feverBadgeText: { fontFamily: FONTS.heading, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  gridWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gridCard:    { backgroundColor: COLORS.white, borderRadius: 24, padding: 14 },
  cellWrapper: { borderRadius: 12, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cell:        { alignItems: 'center', justifyContent: 'center' },
  cellRipple:  { position: 'absolute', zIndex: 1 },
  starParticle:{ position: 'absolute', width: 6, height: 6, borderRadius: 3, zIndex: 2 },
  cellText:    { fontFamily: FONTS.heading },
});
