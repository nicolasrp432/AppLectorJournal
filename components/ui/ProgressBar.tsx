import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Props {
  value: number;   // 0–1
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = '#22C55E', height = 10 }: Props) {
  const reduceMotion = useReducedMotion();
  const trackW = useSharedValue(0);
  const fillW  = useSharedValue(0);

  useEffect(() => {
    const target = Math.min(1, Math.max(0, value)) * trackW.value;
    fillW.value = withTiming(target, { duration: reduceMotion ? 0 : 400 });
  }, [value, reduceMotion]);

  const barStyle = useAnimatedStyle(() => ({ width: fillW.value }));

  return (
    <View
      style={[styles.track, { height, borderRadius: height }]}
      onLayout={e => {
        trackW.value = e.nativeEvent.layout.width;
        fillW.value  = Math.min(1, Math.max(0, value)) * e.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height }, barStyle]}>
        <View style={[styles.highlight, { height: Math.max(2, height / 3) }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track:     { width: '100%', backgroundColor: '#F3F4F6', overflow: 'hidden' },
  fill:      { height: '100%' },
  highlight: {
    position: 'absolute', top: 2, left: 4, right: 4,
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 999,
  },
});
