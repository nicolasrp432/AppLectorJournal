import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Curated modern color palette matching our game theme
const COLORS = [
  '#10B981', // focus emerald
  '#3B82F6', // swift blue
  '#A855F7', // calm purple
  '#EAB308', // chest gold
  '#F43F5E', // critical rose
  '#06B6D4', // ocean cyan
];

interface Particle {
  id: number;
  x: number; // starting x
  y: number; // starting y
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
  angle: number;
  speed: number;
  drift: number;
  rotationSpeed: number;
  delay: number;
}

const PARTICLE_COUNT = 45;

export function ConfettiOverlay({ onAnimationEnd }: { onAnimationEnd?: () => void }) {
  const progress = useSharedValue(0);

  // Generate deterministic-looking random particles on mount
  const particles = React.useMemo(() => {
    const list: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      list.push({
        id: i,
        // Erupt from the bottom-middle of the screen, or scatter
        x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 60,
        y: SCREEN_HEIGHT * 0.65 + (Math.random() - 0.5) * 50,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 8 + 6,
        shape: ['circle', 'square', 'triangle'][i % 3] as Particle['shape'],
        angle: (Math.random() * 120 + 210) * (Math.PI / 180), // Erupt upwards (210 to 330 deg)
        speed: Math.random() * 250 + 200, // Initial velocity
        drift: (Math.random() - 0.5) * 120, // Horizontal wind drift
        rotationSpeed: (Math.random() - 0.5) * 720, // 3D spin speed
        delay: Math.random() * 150, // Short staggered starts
      });
    }
    return list;
  }, []);

  useEffect(() => {
    // Animate progress 0 -> 1 over 3.2 seconds
    progress.value = withTiming(1, {
      duration: 3200,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => {
      if (onAnimationEnd) onAnimationEnd();
    }, 3400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} progress={progress} />
      ))}
    </View>
  );
}

function ConfettiParticle({
  particle,
  progress,
}: {
  particle: Particle;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;

    // Delayed start calculation
    const delayFactor = particle.delay / 3200;
    const activeT = t > delayFactor ? (t - delayFactor) / (1 - delayFactor) : 0;

    if (activeT === 0) {
      return { opacity: 0 };
    }

    // Parabolic motion: gravity pulls down as time goes on
    const gravity = 480 * activeT * activeT; // acceleration downwards
    const dx = Math.cos(particle.angle) * particle.speed * activeT + particle.drift * activeT;
    const dy = Math.sin(particle.angle) * particle.speed * activeT + gravity;

    const currentX = particle.x + dx;
    const currentY = particle.y + dy;

    // Rotation over time
    const rotation = particle.rotationSpeed * activeT;

    // Fade out near the end of life
    const opacity = activeT > 0.7 ? withTiming(0, { duration: 600 }) : 0.9;

    // Scale slightly peaks then shrinks
    const scale = activeT < 0.15 ? activeT / 0.15 : activeT > 0.8 ? (1 - activeT) / 0.2 : 1;

    return {
      position: 'absolute',
      left: currentX,
      top: currentY,
      opacity,
      transform: [
        { scale },
        { rotate: `${rotation}deg` },
        { rotateX: `${rotation * 0.5}deg` },
      ],
    };
  });

  const renderShape = () => {
    const s = particle.size;
    if (particle.shape === 'circle') {
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={s / 2} cy={s / 2} r={s / 2} fill={particle.color} />
        </Svg>
      );
    }
    if (particle.shape === 'triangle') {
      return (
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Path d={`M ${s/2} 0 L ${s} ${s} L 0 ${s} Z`} fill={particle.color} />
        </Svg>
      );
    }
    // Square
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Rect x={0} y={0} width={s} height={s} fill={particle.color} rx={1} />
      </Svg>
    );
  };

  return <Animated.View style={style}>{renderShape()}</Animated.View>;
}
