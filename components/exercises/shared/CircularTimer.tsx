import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/typography';

interface Props {
  elapsed: number;
  benchmark: number;
  size: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function CircularTimer({ elapsed, benchmark, size, strokeWidth = 5, children }: Props) {
  const progress = Math.min(1, elapsed / benchmark);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 150 });
  }, [progress]);

  // Determine dynamic colors based on elapsed time progress
  let strokeColor = '#22C55E'; // Green
  if (progress >= 0.8) {
    strokeColor = '#EF4444'; // Red
  } else if (progress >= 0.5) {
    strokeColor = '#F97316'; // Orange
  }

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - animatedProgress.value * circumference,
    };
  });

  // Animated color using Reanimated isn't strictly necessary here since colors change at broad intervals,
  // but let's make sure the strokeDashoffset animates smoothly.
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG circular progress ring */}
      <Svg style={StyleSheet.absoluteFillObject} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth - 1}
          fill="transparent"
          opacity={0.3}
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Children content (the grid itself) */}
      <View style={styles.innerContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
