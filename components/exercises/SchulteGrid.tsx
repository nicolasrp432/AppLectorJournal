import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { ExerciseTopBar } from './ExerciseTopBar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import * as haptics from '../../lib/haptics';
import { CircularTimer } from './shared/CircularTimer';

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
  inverse?: boolean;
  showQuadrantHint?: boolean;
  onFinish: (result: { time: number; errors: number; size: number }) => void;
  onQuit: () => void;
}

export function SchulteGrid({
  size = 5,
  accent = COLORS.focus,
  inverse = false,
  showQuadrantHint = false,
  onFinish,
  onQuit,
}: Props) {
  const total = size * size;
  const [numbers] = useState(() => shuffle([...Array(total)].map((_, i) => i + 1)));
  const [next, setNext] = useState(inverse ? total : 1);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const startTime = useRef(Date.now());

  // Soft, single-purpose feedback values
  const flashOpacity = useSharedValue(0);
  const streakToastY = useSharedValue(-100);
  const streakToastOpacity = useSharedValue(0);

  // Timer benchmark calculation (e.g. 5x5 is 50s)
  const benchmark = size === 3 ? 15 : size === 4 ? 30 : size === 5 ? 50 : 80;

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startTime.current) / 1000), 100);
    return () => clearInterval(t);
  }, []);

  const triggerStreakToast = () => {
    const ease = { duration: 420, easing: Easing.out(Easing.cubic) };
    streakToastY.value = withTiming(20, ease);
    streakToastOpacity.value = withTiming(1, ease);
    setTimeout(() => {
      streakToastY.value = withTiming(-100, ease);
      streakToastOpacity.value = withTiming(0, ease);
    }, 1800);
  };

  const handleTap = (n: number) => {
    if (n === next) {
      setCorrectStreak(prev => {
        const nextStreak = prev + 1;
        if (nextStreak === 10) {
          haptics.success();
          triggerStreakToast();
        }
        return nextStreak;
      });

      const isLast = inverse ? next === 1 : next === total;
      if (isLast) {
        onFinish({ time: (Date.now() - startTime.current) / 1000, errors, size });
      } else {
        haptics.tap();
        setNext(prev => prev + (inverse ? -1 : 1));
      }
    } else {
      haptics.error();
      setErrors(e => e + 1);
      setWrongId(n);
      setCorrectStreak(0);

      // Soft red screen tint — no jarring shake.
      flashOpacity.value = withSequence(
        withTiming(0.1, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
      );

      setTimeout(() => setWrongId(null), 360);
    }
  };

  const cellSize = size === 3 ? 96 : size === 4 ? 78 : size === 5 ? 62 : size === 6 ? 52 : 44;
  const fontSize = size === 3 ? 34 : size === 4 ? 28 : size === 5 ? 24 : size === 6 ? 20 : 16;
  const gridWidth = size * cellSize + (size - 1) * 8 + 28;

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const animatedStreakToastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: streakToastY.value }],
    opacity: streakToastOpacity.value,
  }));

  // Quadrant Hint calculation
  const nextIndex = numbers.indexOf(next);
  let activeQuadrant = 0;
  if (nextIndex !== -1) {
    const halfSize = size / 2;
    const nextRow = Math.floor(nextIndex / size);
    const nextCol = nextIndex % size;

    if (nextRow < halfSize && nextCol < halfSize) activeQuadrant = 0;
    else if (nextRow < halfSize && nextCol >= halfSize) activeQuadrant = 1;
    else if (nextRow >= halfSize && nextCol < halfSize) activeQuadrant = 2;
    else activeQuadrant = 3;
  }

  // Unified progress value
  const progressRatio = inverse ? (total - next) / total : (next - 1) / total;
  const progressText = inverse ? `${total - next}/${total}` : `${next - 1}/${total}`;

  return (
    <View style={styles.container}>
      {/* Soft red screen tint for incorrect inputs */}
      <Animated.View style={[styles.flashOverlay, animatedFlashStyle]} pointerEvents="none" />

      {/* Perfect Streak Toast */}
      <Animated.View style={[styles.streakToast, animatedStreakToastStyle]} pointerEvents="none">
        <Text style={styles.streakToastText}>🔥 ¡Racha perfecta! (10 seguidos)</Text>
      </Animated.View>

      <ExerciseTopBar progress={progressRatio} accent={accent} onQuit={onQuit} title="Schulte Grid" />

      <View style={styles.statsRow}>
        <StatPill value={String(correctStreak)} label="Racha 🔥" color="#F59E0B" />
        <StatPill value={progressText} label="Progreso" color={accent} />
        <StatPill value={String(errors)} label="Errores" color="#EF4444" />
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Busca</Text>
        <Text style={[styles.targetNumber, { color: accent }]}>{next}</Text>
      </View>

      <View style={styles.gridWrapper}>
        <CircularTimer elapsed={elapsed} benchmark={benchmark} size={gridWidth + 24} strokeWidth={6}>
          <View style={[styles.gridCard, { gap: 8 }]}>
            {Array.from({ length: size }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row', gap: 8 }}>
                {numbers.slice(row * size, (row + 1) * size).map((n) => (
                  <GridCell
                    key={n}
                    n={n}
                    done={inverse ? n > next : n < next}
                    wrong={wrongId === n}
                    size={cellSize}
                    fontSize={fontSize}
                    onPress={() => handleTap(n)}
                  />
                ))}
              </View>
            ))}

            {showQuadrantHint && (
              <View style={[StyleSheet.absoluteFill, { padding: 14, pointerEvents: 'none' }]}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <QuadrantGlow active={activeQuadrant === 0} accent={accent} />
                  <QuadrantGlow active={activeQuadrant === 1} accent={accent} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <QuadrantGlow active={activeQuadrant === 2} accent={accent} />
                  <QuadrantGlow active={activeQuadrant === 3} accent={accent} />
                </View>
              </View>
            )}
          </View>
        </CircularTimer>
      </View>
    </View>
  );
}

function GridCell({ n, done, wrong, size, fontSize, onPress }: {
  n: number; done: boolean; wrong: boolean; size: number; fontSize: number; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Correct tap → smooth fade + gentle scale-down so the number "settles" away.
  useEffect(() => {
    if (done) {
      opacity.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
      scale.value = withTiming(0.9, { duration: 220, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [done]);

  // Wrong tap → soft scale pulse (no harsh shake).
  useEffect(() => {
    if (wrong) {
      scale.value = withSequence(
        withTiming(1.06, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 160, easing: Easing.inOut(Easing.quad) }),
      );
    }
  }, [wrong]);

  const animatedCellProps = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderColor: wrong ? '#EF4444' : 'transparent',
    borderWidth: wrong ? 2 : 0,
  }));

  return (
    <Animated.View style={[styles.cellWrapper, animatedCellProps]}>
      <Pressable
        onPress={onPress}
        disabled={done}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: 12,
            backgroundColor: wrong ? '#FEE2E2' : done ? 'transparent' : COLORS.white,
          },
        ]}
      >
        <Text style={[styles.cellText, { fontSize, color: done ? 'transparent' : COLORS.ink }]}>
          {n}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function QuadrantGlow({ active, accent }: { active: boolean; accent: string }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(active ? 0.12 : 0, { duration: 300, easing: Easing.inOut(Easing.quad) });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          backgroundColor: accent,
          borderRadius: 12,
          margin: 4,
        },
        animStyle,
      ]}
    />
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
  streakToast: {
    position: 'absolute',
    top: 50,
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(251, 146, 60, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  streakToastText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#FFF',
    textAlign: 'center',
  },
  statsRow:    { flexDirection: 'row', gap: 8, padding: 14 },
  pill:        { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.surface, alignItems: 'center' },
  pillValue:   { fontFamily: FONTS.heading, fontSize: 16, lineHeight: 20 },
  pillLabel:   { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  targetRow:   { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  targetLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  targetNumber:{ fontFamily: FONTS.heading, fontSize: 56, lineHeight: 64 },
  gridWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gridCard:    { backgroundColor: COLORS.white, borderRadius: 24, padding: 14 },
  cellWrapper: { borderRadius: 12, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cell:        { alignItems: 'center', justifyContent: 'center' },
  cellText:    { fontFamily: FONTS.heading },
});
