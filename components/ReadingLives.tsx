import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { MAX_READING_LIVES } from '../constants/lives';
import { msToNextLife, formatCountdown } from '../lib/lives';

interface Props {
  lives: number;
  nextLifeAt?: string | null;
  max?: number;
  /** Versión reducida (corazones más pequeños, sin fondo). */
  compact?: boolean;
}

/**
 * Fila de corazones de vida de lectura + temporizador hasta la próxima vida.
 * El temporizador se actualiza cada segundo mientras no esté lleno.
 */
export function ReadingLives({ lives, nextLifeAt, max = MAX_READING_LIVES, compact = false }: Props) {
  const [remaining, setRemaining] = useState(() => msToNextLife(nextLifeAt ?? null));

  useEffect(() => {
    setRemaining(msToNextLife(nextLifeAt ?? null));
    if (!nextLifeAt || lives >= max) return;
    const t = setInterval(() => setRemaining(msToNextLife(nextLifeAt)), 1000);
    return () => clearInterval(t);
  }, [nextLifeAt, lives, max]);

  const size = compact ? 16 : 22;
  const showTimer = lives < max && remaining > 0;

  return (
    <View style={[styles.row, !compact && styles.card]}>
      <View style={styles.hearts}>
        {Array.from({ length: max }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < lives ? 'heart' : 'heart-outline'}
            size={size}
            color={i < lives ? '#EF4444' : COLORS.border}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
      {showTimer && (
        <Text style={[styles.timer, compact && styles.timerCompact]}>
          +1 en {formatCountdown(remaining)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: {
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hearts: { flexDirection: 'row', alignItems: 'center' },
  timer: { fontFamily: FONTS.headingSemi, fontSize: 13, color: '#6B7280' },
  timerCompact: { fontSize: 11 },
});
