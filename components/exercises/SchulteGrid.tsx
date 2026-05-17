import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
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

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startTime.current) / 1000), 100);
    return () => clearInterval(t);
  }, []);

  const handleTap = (n: number) => {
    if (n === next) {
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
      setTimeout(() => setShakeId(null), 300);
    }
  };

  const cellSize = size === 3 ? 90 : size === 4 ? 74 : size === 5 ? 58 : size === 6 ? 50 : 42;
  const fontSize = size === 3 ? 32 : size === 4 ? 26 : size === 5 ? 22 : size === 6 ? 18 : 15;

  return (
    <View style={styles.container}>
      <ExerciseTopBar progress={(next - 1) / total} accent={accent} onQuit={onQuit} title="Schulte" />

      <View style={styles.statsRow}>
        <StatPill value={elapsed.toFixed(1) + 's'} label="Tiempo" color="#3B82F6" />
        <StatPill value={`${next - 1}/${total}`} label="Progreso" color={accent} />
        <StatPill value={String(errors)} label="Errores" color="#EF4444" />
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Busca</Text>
        <Text style={[styles.targetNumber, { color: accent }]}>{next}</Text>
      </View>

      <View style={styles.gridWrapper}>
        <View style={[styles.gridCard, { gap: 6 }]}>
          {Array.from({ length: size }, (_, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
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
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function GridCell({ n, done, shaking, size, fontSize, accent, onPress }: {
  n: number; done: boolean; shaking: boolean; size: number; fontSize: number; accent: string; onPress: () => void;
}) {
  const tx = useSharedValue(0);

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

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        disabled={done}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: 10,
            backgroundColor: done ? `${accent}15` : COLORS.canvas,
            borderWidth: shaking ? 2 : 0,
            borderColor: shaking ? '#EF4444' : 'transparent',
          },
        ]}
      >
        <Text style={[styles.cellText, { fontSize, color: done ? `${accent}60` : COLORS.ink }]}>{n}</Text>
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
  statsRow:    { flexDirection: 'row', gap: 8, padding: 14 },
  pill:        { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.surface, alignItems: 'center' },
  pillValue:   { fontFamily: FONTS.heading, fontSize: 16, lineHeight: 20 },
  pillLabel:   { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  targetRow:   { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  targetLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  targetNumber:{ fontFamily: FONTS.heading, fontSize: 56, lineHeight: 64 },
  gridWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gridCard:    { backgroundColor: COLORS.white, borderRadius: 20, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  cell:        { alignItems: 'center', justifyContent: 'center' },
  cellText:    { fontFamily: FONTS.heading },
});
