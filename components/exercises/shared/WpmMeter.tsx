import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/typography';

interface Props {
  wpm: number;
  minWpm?: number;
  maxWpm?: number;
  size?: number;
  accent?: string;
}

export function WpmMeter({
  wpm,
  minWpm = 100,
  maxWpm = 800,
  size = 140,
  accent = '#F97316',
}: Props) {
  const animatedWpm = useSharedValue(minWpm);

  useEffect(() => {
    animatedWpm.value = withSpring(wpm, { damping: 15, stiffness: 90 });
  }, [wpm]);

  // Dimensions
  const half = size / 2;
  const strokeWidth = 8;
  const radius = half - strokeWidth - 6;

  // Arc path description (a 240 degree gauge arc from -120deg to 120deg)
  // Let's create an SVG path that goes from -210 degrees to 30 degrees (where 0 is right, -90 is top)
  // Or simply draw a nice track circle and mask it, or use absolute coordinates for the arc.
  // Standard 240-degree gauge starts at -210 degrees and ends at 30 degrees.
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const getArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(half, half + 10, radius, endAngle);
    const end = polarToCartesian(half, half + 10, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // The track goes from -120deg to +120deg (relative to top center)
  // In standard SVG angles: top center is -90deg.
  // -120deg from top center is -210deg.
  // +120deg from top center is +30deg.
  const trackPath = getArcPath(-120, 120);

  // Animated styles for needle and glow
  const needleStyle = useAnimatedStyle(() => {
    const angle = interpolate(
      animatedWpm.value,
      [minWpm, maxWpm],
      [-120, 120]
    );
    return {
      transform: [{ rotate: `${angle}deg` }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedWpm.value, [minWpm, maxWpm], [0.8, 1]),
    };
  });

  // Calculate dynamic colors based on speed range
  let speedColor = '#3B82F6'; // Cool/Standard blue
  if (wpm >= 500) {
    speedColor = '#8B5CF6'; // Hyper/Violet
  } else if (wpm >= 350) {
    speedColor = '#EC4899'; // Fast/Pink
  } else if (wpm >= 250) {
    speedColor = '#F97316'; // Active/Orange
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer subtle decorative ring */}
        <Circle
          cx={half}
          cy={half + 10}
          r={radius + 6}
          stroke="#E2E8F0"
          strokeWidth={1}
          fill="transparent"
          strokeDasharray="4, 4"
        />

        {/* Base Track */}
        <Path
          d={trackPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Dynamic Colored Track depending on WPM */}
        <Path
          d={trackPath}
          fill="none"
          stroke={speedColor}
          strokeWidth={strokeWidth - 1}
          strokeLinecap="round"
          opacity={0.15}
        />

        {/* Scale Ticks (-120deg, -60deg, 0deg, 60deg, 120deg) */}
        {[-120, -60, 0, 60, 120].map((angle, idx) => {
          const outer = polarToCartesian(half, half + 10, radius, angle);
          const inner = polarToCartesian(half, half + 10, radius - 6, angle);
          return (
            <Line
              key={idx}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#94A3B8"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Pivot Center Hub */}
        <Circle
          cx={half}
          cy={half + 10}
          r={10}
          fill={speedColor}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
        <Circle
          cx={half}
          cy={half + 10}
          r={4}
          fill="#FFFFFF"
        />
      </Svg>

      {/* Absolutely positioned needle container to allow Reanimated's CSS-based rotation */}
      <Animated.View
        style={[
          styles.needleContainer,
          {
            width: size,
            height: size,
            left: 0,
            top: 10, // match the SVG offset (+10)
          },
          needleStyle,
        ]}
        pointerEvents="none"
      >
        {/* Visual Needle Line */}
        <View
          style={[
            styles.needleLine,
            {
              height: radius - 8,
              backgroundColor: speedColor,
              bottom: half, // pivot on center
            },
          ]}
        />
      </Animated.View>

      {/* Internal Speed WPM Readout in the Center-Bottom */}
      <View style={[styles.readout, { top: half + 24 }]}>
        <Animated.Text style={[styles.wpmValue, { color: speedColor }, textStyle]}>
          {wpm}
        </Animated.Text>
        <Text style={styles.wpmLabel}>WPM</Text>
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
  needleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleLine: {
    position: 'absolute',
    width: 3.5,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  readout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  wpmValue: {
    fontFamily: FONTS.heading || 'System',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
  },
  wpmLabel: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 1,
  },
});
