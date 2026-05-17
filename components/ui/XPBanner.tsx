import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, withDelay,
  Easing,
} from 'react-native-reanimated';
import { FONTS } from '../../constants/typography';

interface Props {
  amount: number;
  /** Banner auto-shows on mount, calls onDone after the full cycle finishes */
  onDone?: () => void;
  /** How long the banner stays fully visible (ms). Default 2 200 */
  displayMs?: number;
}

const SLIDE_IN_MS  = 480;
const SLIDE_OUT_MS = 380;

export function XPBanner({ amount, onDone, displayMs = 2200 }: Props) {
  const translateY = useSharedValue(120);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    // slide in with spring-like overshoot
    translateY.value = withTiming(0, {
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.back(1.6)),
    });
    opacity.value = withTiming(1, { duration: 250 });

    const total = SLIDE_IN_MS + displayMs + SLIDE_OUT_MS;
    const outDelay = SLIDE_IN_MS + displayMs;

    translateY.value = withSequence(
      withTiming(0, { duration: SLIDE_IN_MS, easing: Easing.out(Easing.back(1.6)) }),
      withDelay(displayMs, withTiming(120, { duration: SLIDE_OUT_MS, easing: Easing.in(Easing.quad) })),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(outDelay - 250 + 50, withTiming(0, { duration: SLIDE_OUT_MS })),
    );

    const timer = setTimeout(() => onDone?.(), total + 50);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, animStyle]} pointerEvents="none">
      <View style={styles.iconWrap}>
        <Text style={styles.bolt}>⚡</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>XP GANADO</Text>
        <Text style={styles.amount}>+{amount}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D97706',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    // gradient approximation via solid warm amber
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 50,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: { fontSize: 24 },
  textBlock: { flex: 1 },
  label: {
    fontFamily: FONTS.headingSemi,
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  amount: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: '#fff',
    marginTop: 1,
  },
});
