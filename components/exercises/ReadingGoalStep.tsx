import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { READING_GOALS, ReadingGoalId, wpmForGoal } from '../../lib/readingGoals';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import * as haptics from '../../lib/haptics';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { SPRING, TIMING, PRESS_SCALE, PRESS_RETENTION } from '../../constants/motion';

/**
 * Paso previo a una lectura: el usuario declara para qué va a leer.
 *
 * Es entrenamiento metacognitivo, no una pantalla de ajustes. Fijar el objetivo
 * antes de leer produce ganancias de velocidad comparables a un curso de lectura
 * rápida pero sin sacrificar comprensión (Klimovich et al., 2023) porque cambia
 * el umbral con el que uno se auto-vigila mientras lee. Ver lib/readingGoals.ts.
 *
 * Se mantiene deliberadamente en una sola pantalla, sin scroll: si cuesta más de
 * tres segundos, deja de ser gratis en tiempo y el efecto se pierde.
 */
export function ReadingGoalStep({
  baseWpm,
  accent = COLORS.swift,
  onSelect,
}: {
  /** WPM del nivel actual; se muestra ya ajustado a cada objetivo. */
  baseWpm: number;
  accent?: string;
  onSelect: (goalId: ReadingGoalId, targetWpm: number) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ANTES DE LEER</Text>
        <Text style={styles.title}>¿Para qué vas a leer esto?</Text>
        <Text style={styles.subtitle}>
          Decidirlo ahora te hará leer más rápido sin perder comprensión.
        </Text>
      </View>

      <View style={styles.options}>
        {READING_GOALS.map((goal, i) => (
          <GoalCard
            key={goal.id}
            index={i}
            accent={accent}
            reduceMotion={reduceMotion}
            icon={goal.icon}
            label={goal.label}
            prompt={goal.prompt}
            wpm={wpmForGoal(baseWpm, goal.id)}
            onPress={() => {
              haptics.medium();
              onSelect(goal.id, wpmForGoal(baseWpm, goal.id));
            }}
          />
        ))}
      </View>
    </View>
  );
}

function GoalCard({
  index, icon, label, prompt, wpm, accent, reduceMotion, onPress,
}: {
  index: number;
  icon: string;
  label: string;
  prompt: string;
  wpm: number;
  accent: string;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  // Entrada escalonada: da jerarquía de lectura sin recurrir a más texto.
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      enter.value = 1;
      return;
    }
    enter.value = withDelay(index * 70, withSpring(1, SPRING.smooth));
  }, [index, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 18 },
      { scale: press.value },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${prompt}. Ritmo sugerido ${wpm} palabras por minuto.`}
        pressRetentionOffset={PRESS_RETENTION}
        onPressIn={() => {
          press.value = withTiming(PRESS_SCALE, TIMING.press);
        }}
        onPressOut={() => {
          press.value = withTiming(1, TIMING.press);
        }}
        onPress={onPress}
        style={styles.card}
      >
        <View style={[styles.iconBox, { backgroundColor: accent + '14' }]}>
          <Ionicons name={icon as never} size={20} color={accent} />
        </View>

        <View style={styles.cardText}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardPrompt}>{prompt}</Text>
        </View>

        <View style={styles.wpmBox}>
          <Text style={[styles.wpmValue, { color: accent }]}>{wpm}</Text>
          <Text style={styles.wpmUnit}>WPM</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: COLORS.subtle,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.ink,
    marginTop: 6,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  options: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 15,
    color: COLORS.ink,
  },
  cardPrompt: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12.5,
    color: COLORS.muted,
    marginTop: 3,
    lineHeight: 17,
  },
  wpmBox: {
    alignItems: 'flex-end',
  },
  wpmValue: {
    fontFamily: FONTS.heading,
    fontSize: 17,
  },
  wpmUnit: {
    fontFamily: FONTS.bodyLight,
    fontSize: 9,
    color: COLORS.subtle,
    letterSpacing: 0.5,
  },
});
