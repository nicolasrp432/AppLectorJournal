import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import { FONTS } from '../../constants/typography';

const ACHIEVEMENTS_META: Record<string, { emoji: string; title: string; desc: string }> = {
  streak7:    { emoji: '🔥', title: 'Racha 7',       desc: '7 días seguidos' },
  firstbook:  { emoji: '📚', title: 'Primer libro',  desc: 'Completaste tu primer libro' },
  wpm300:     { emoji: '⚡', title: '300 WPM',        desc: 'Velocidad de lectura élite' },
  loci:       { emoji: '🏛', title: 'Maestro Loci',   desc: 'Palacio de la memoria activado' },
  comp90:     { emoji: '🧠', title: '90% comp.',      desc: 'Comprensión casi perfecta' },
  level10:    { emoji: '👑', title: 'Nivel 10',       desc: 'Lector de nivel avanzado' },
  sessions50: { emoji: '🎯', title: '50 sesiones',    desc: '50 ejercicios completados' },
  schulte7:   { emoji: '🔲', title: 'Schulte 7×7',   desc: 'Cuadrícula experto dominada' },
  wpm500:     { emoji: '🚀', title: '500 WPM',        desc: 'Velocidad supersónica' },
};

interface Props {
  achievementId: string;
  onDone?: () => void;
}

const SLIDE_IN_MS  = 500;
const DISPLAY_MS   = 2800;
const SLIDE_OUT_MS = 400;

export function AchievementToast({ achievementId, onDone }: Props) {
  const meta = ACHIEVEMENTS_META[achievementId];
  const translateY = useSharedValue(-110);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.92);

  useEffect(() => {
    const outDelay = SLIDE_IN_MS + DISPLAY_MS;
    const total    = outDelay + SLIDE_OUT_MS;

    translateY.value = withSequence(
      withTiming(0, { duration: SLIDE_IN_MS, easing: Easing.out(Easing.back(1.5)) }),
      withDelay(DISPLAY_MS, withTiming(-110, { duration: SLIDE_OUT_MS, easing: Easing.in(Easing.quad) })),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 280 }),
      withDelay(outDelay - 200, withTiming(0, { duration: SLIDE_OUT_MS })),
    );
    scale.value = withSequence(
      withTiming(1, { duration: SLIDE_IN_MS, easing: Easing.out(Easing.back(1.3)) }),
      withDelay(DISPLAY_MS, withTiming(0.94, { duration: SLIDE_OUT_MS })),
    );

    const timer = setTimeout(() => onDone?.(), total + 60);
    return () => clearTimeout(timer);
  }, [achievementId]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!meta) return null;

  return (
    <Animated.View style={[styles.toast, animStyle]} pointerEvents="none">
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>LOGRO DESBLOQUEADO</Text>
        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.desc}>{meta.desc}</Text>
      </View>
      <Text style={styles.sparkle}>✨</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4C1D95',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 100,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji:     { fontSize: 26 },
  textBlock: { flex: 1 },
  label: {
    fontFamily: FONTS.headingSemi,
    fontSize: 8,
    color: '#C4B5FD',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#fff',
  },
  desc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  sparkle: { fontSize: 20, alignSelf: 'flex-start', marginTop: 2 },
});
