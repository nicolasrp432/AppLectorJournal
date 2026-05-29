import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseTopBar } from './ExerciseTopBar';
import { MascotChar } from '../ui/MascotChar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Phase = 'intro' | 'playing';

interface Props {
  accent?: string;
  durationSeconds?: number;
  onFinish: (result: { time: number; errors: number; size: number; correct: number; total: number; passed: boolean }) => void;
  onQuit: () => void;
}

export function FocusCircle({ accent = '#22C55E', durationSeconds = 60, onFinish, onQuit }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [breathText, setBreathText] = useState('Inhala con calma...');

  const circleScale = useSharedValue(1.0);
  const breathingPulse = useSharedValue(1.0);
  const playStart = useRef(Date.now());

  useEffect(() => {
    if (phase !== 'playing') return;

    // Slowly expand the green circle from scale 1.0 to 3.8 over the course of the duration
    circleScale.value = withTiming(3.8, { duration: durationSeconds * 1000 });

    // Breathing pulse for the outer indicator ring (pulsing every 4s)
    breathingPulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000 }),
        withTiming(1.0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Countdown and Breathing text interval
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Breathing & focus guide text cycler
  useEffect(() => {
    if (phase !== 'playing') return;

    const intervalVal = durationSeconds - timeLeft;
    const cycle = intervalVal % 12;

    if (cycle < 4) {
      setBreathText('Inhala profundamente...');
    } else if (cycle < 8) {
      setBreathText('Exhala despacio...');
    } else {
      setBreathText('Fija tu mirada en el centro...');
    }
  }, [timeLeft, phase]);

  const handleStart = () => {
    playStart.current = Date.now();
    setPhase('playing');
  };

  const handleComplete = () => {
    onFinish({
      time: durationSeconds,
      errors: 0,
      size: 5,
      correct: 1,
      total: 1,
      passed: true,
    });
  };

  // Animated Styles
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingPulse.value }],
    opacity: 0.15 + (1.3 - breathingPulse.value) * 0.4,
  }));

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Círculo de Enfoque" />
        <ScrollView contentContainerStyle={styles.centerScroll}>
          <View style={styles.mascotWrapper}>
            <MascotChar which="focus" size={130} expression="calm" />
          </View>
          <Text style={styles.title}>Círculo de Enfoque</Text>
          <Text style={styles.subtitle}>
            Entrena tu tramo de atención sostenida y calma mental enfocando tu mirada en el centro del círculo verde mientras se expande progresivamente.
          </Text>

          <View style={styles.card}>
            <View style={styles.tipRow}>
              <Ionicons name="eye-outline" size={24} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Mirada fija en el punto</Text>
                <Text style={styles.tipDesc}>Coloca el dispositivo a una distancia cómoda. Evita parpadear en exceso y mantén la vista en el punto central.</Text>
              </View>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="expand-outline" size={24} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Apertura de visión periférica</Text>
                <Text style={styles.tipDesc}>A medida que el círculo crezca, intenta notar sus bordes expandiéndose sin mover los ojos del punto central.</Text>
              </View>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="fitness-outline" size={24} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Sincroniza tu respiración</Text>
                <Text style={styles.tipDesc}>Sigue las indicaciones en pantalla para inhalar y exhalar, promoviendo una oxigenación neuronal óptima.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={handleStart} style={[styles.ctaBtn, { backgroundColor: accent }]}>
            <Text style={styles.ctaBtnText}>Comenzar Ejercicio</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExerciseTopBar
        progress={(durationSeconds - timeLeft) / durationSeconds}
        accent={accent}
        onQuit={onQuit}
        title={`Tiempo restante: ${timeLeft}s`}
      />

      <View style={styles.sandbox}>
        {/* Pulsing Guide Ring */}
        <Animated.View style={[styles.pulseRing, { borderColor: accent }, pulseStyle]} />

        {/* Outer dotted orbit */}
        <View style={[styles.orbit, { borderColor: `${accent}22` }]} />

        {/* Centered expanding circle */}
        <Animated.View style={[styles.focusCircle, { backgroundColor: accent }, circleStyle]}>
          {/* Exact center point */}
          <View style={styles.centerDot} />
        </Animated.View>
      </View>

      <View style={styles.breathBar}>
        <Ionicons name="leaf-outline" size={20} color={accent} style={{ marginBottom: 4 }} />
        <Text style={[styles.breathText, { color: COLORS.ink }]}>{breathText}</Text>
        <Text style={styles.timerSubText}>Enfoque visual periférico sostenido</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  centerScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    marginVertical: 14,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 18,
    width: '100%',
    gap: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  tipDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  ctaBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sandbox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  focusCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  orbit: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
  },
  breathBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 2,
  },
  timerSubText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
  },
});
