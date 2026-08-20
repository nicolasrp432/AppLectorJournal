import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring,
} from 'react-native-reanimated';

import { MascotChar } from '../ui/MascotChar';
import { RankedMember } from '../../lib/league';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import type { MascotKey } from '../../types/db';
import { SPRING } from '../../constants/motion';

/**
 * Fila de clasificación reutilizable.
 *
 * Destaca en color cuando el XP cambia, para que un adelantamiento en vivo se
 * note sin tener que mirar los números: con Realtime las filas se mueven solas
 * y un cambio silencioso pasaría desapercibido.
 */
export function LeaderboardRow({
  member,
  accent,
}: {
  member: RankedMember;
  accent: string;
}) {
  const reduceMotion = useReducedMotion();
  const flash = useSharedValue(0);
  const prevXp = React.useRef(member.weeklyXp);

  useEffect(() => {
    if (member.weeklyXp !== prevXp.current) {
      prevXp.current = member.weeklyXp;
      if (!reduceMotion) {
        flash.value = withSequence(
          withTiming(1, { duration: 180 }),
          withSpring(0, SPRING.momentum),
        );
      }
    }
  }, [member.weeklyXp, reduceMotion]);

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor:
      flash.value > 0 ? `rgba(34, 197, 94, ${0.16 * flash.value})` : 'transparent',
    transform: [{ scale: 1 + flash.value * 0.015 }],
  }));

  return (
    <Animated.View
      style={[
        styles.row,
        member.isUser && [styles.rowUser, { borderColor: accent + '40' }],
        flashStyle,
      ]}
    >
      <Text style={[styles.rank, member.zone === 'promotion' && styles.rankTop]}>
        {medalFor(member.position)}
      </Text>

      <View style={styles.avatar}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <MascotChar
            which={(member.avatar as MascotKey) ?? 'focus'}
            size={24}
            breathing={false}
            blinking={false}
          />
        )}
      </View>

      <Text
        numberOfLines={1}
        style={[styles.name, member.isUser && { fontFamily: FONTS.headingBold, color: accent }]}
      >
        {member.isUser ? 'Tú' : member.name}
      </Text>

      <Text style={styles.xp}>{member.weeklyXp} XP</Text>
    </Animated.View>
  );
}

function medalFor(position: number): string {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `${position}.`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowUser: { borderWidth: 1.5 },
  rank: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: COLORS.muted,
    width: 28,
  },
  rankTop: { fontSize: 15 },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  avatarImg: { width: 28, height: 28, borderRadius: 14 },
  name: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13.5,
    color: COLORS.ink,
  },
  xp: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: COLORS.inkLight,
  },
});
