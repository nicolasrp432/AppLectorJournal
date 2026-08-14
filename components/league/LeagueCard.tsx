import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { LeagueBadge } from './LeagueBadge';
import { LeaderboardRow } from './LeaderboardRow';
import { useLeagueStore } from '../../store/useLeagueStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  getTier, msToCycleEnd, formatTimeLeft, zoneCopy, zoneForPosition,
} from '../../lib/league';
import * as haptics from '../../lib/haptics';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

/**
 * Tarjeta de liga competitiva, con clasificación en vivo.
 *
 * Sustituye a la maqueta que vivía dentro de `perfil.tsx`: cuatro rivales de
 * mentira, temporizador fijo y tier derivado de `profile.level`. Aquí todo sale
 * del servidor y se actualiza por Realtime.
 *
 * Se entrega como componente propio para poder colocarla también en progreso o
 * en la ruta sin duplicar ni la lógica ni los estilos.
 */
export function LeagueCard({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const profile = useProfileStore(s => s.profile);
  const userId = profile?.id && profile.id !== 'local' ? profile.id : null;

  const { tier, members, isLoading, isLive, error, join, subscribeLive } = useLeagueStore();
  const ranked = useLeagueStore(s => s.ranked(userId));
  const gap = useLeagueStore(s => s.xpGap(userId));

  const [expanded, setExpanded] = useState(defaultExpanded);
  const reduceMotion = useReducedMotion();
  const t = getTier(tier);

  // Entrar en la liga y quedarse escuchando mientras la tarjeta esté montada.
  useEffect(() => {
    if (!userId) return;
    let unsubscribe: (() => void) | undefined;
    join().then(() => {
      unsubscribe = subscribeLive();
    });
    return () => unsubscribe?.();
  }, [userId]);

  const me = ranked.find(r => r.isUser);
  const zone = me ? me.zone : zoneForPosition(1, Math.max(1, ranked.length));
  const copy = zoneCopy(zone, tier);

  if (!userId) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={22} color={COLORS.subtle} />
          <Text style={styles.emptyText}>
            Inicia sesión para competir en la liga semanal.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: t.color + '25', shadowColor: t.color }]}>
      <Pressable
        onPress={() => {
          haptics.tap();
          setExpanded(e => !e);
        }}
        style={[styles.header, { backgroundColor: t.color + '0E' }]}
        accessibilityRole="button"
        accessibilityLabel={`${t.name}. ${copy.title}. Toca para ${expanded ? 'plegar' : 'desplegar'} la clasificación.`}
      >
        <LeagueBadge tier={tier} size="md" showName={false} />

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.tierName}>{t.name}</Text>
            {isLive && <LiveDot reduceMotion={reduceMotion} />}
          </View>
          <Text style={styles.subtitle}>
            {me ? `${me.weeklyXp} XP · puesto ${me.position} de ${ranked.length}` : 'Sumando XP…'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <CycleTimer color={t.color} />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={t.color}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {isLoading && members.length === 0 ? (
            <ActivityIndicator color={t.color} style={{ paddingVertical: 20 }} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-offline-outline" size={20} color={COLORS.subtle} />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : ranked.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="hourglass-outline" size={20} color={COLORS.subtle} />
              <Text style={styles.emptyText}>
                Aún no hay nadie más en tu grupo. Entrena y vuelve en un rato.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {ranked.map(m => (
                <LeaderboardRow key={m.userId} member={m} accent={t.color} />
              ))}
            </View>
          )}

          <View style={[styles.zoneBox, ZONE_STYLE[zone].box]}>
            <Ionicons name={ZONE_STYLE[zone].icon} size={15} color={ZONE_STYLE[zone].color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.zoneTitle, { color: ZONE_STYLE[zone].color }]}>
                {copy.title}
              </Text>
              <Text style={styles.zoneDetail}>{copy.detail}</Text>
            </View>
          </View>

          {gap != null && gap > 0 && (
            <Text style={styles.gapHint}>
              Te faltan {gap} XP para adelantar al siguiente.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Cuenta atrás real hasta el cierre del ciclo. Antes era el literal "3d 12h". */
function CycleTimer({ color }: { color: string }) {
  const [left, setLeft] = useState(() => msToCycleEnd());

  useEffect(() => {
    // Un tick por minuto basta: el formato no muestra segundos, así que
    // refrescar más a menudo solo gastaría renders.
    const id = setInterval(() => setLeft(msToCycleEnd()), 60_000);
    return () => clearInterval(id);
  }, []);

  const label = useMemo(() => formatTimeLeft(left), [left]);

  return (
    <View style={styles.timerBadge}>
      <Ionicons name="time-outline" size={12} color={color} />
      <Text style={[styles.timerText, { color }]}>{label}</Text>
    </View>
  );
}

/** Punto que late mientras la conexión en vivo está activa. */
function LiveDot({ reduceMotion }: { reduceMotion: boolean }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
  }, [reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, style]} />
      <Text style={styles.liveText}>EN VIVO</Text>
    </View>
  );
}

const ZONE_STYLE = {
  promotion: { color: '#16A34A', icon: 'rocket-outline' as const, box: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' } },
  safe:      { color: '#4B5563', icon: 'shield-checkmark-outline' as const, box: { backgroundColor: COLORS.surface, borderColor: COLORS.border } },
  demotion:  { color: '#DC2626', icon: 'alert-circle-outline' as const, box: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' } },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  subtitle: { fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: COLORS.surface,
  },
  timerText: { fontFamily: FONTS.headingSemi, fontSize: 11 },
  liveWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontFamily: FONTS.headingBold, fontSize: 8.5, color: '#EF4444', letterSpacing: 0.6 },
  body: { paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
  list: { gap: 2 },
  zoneBox: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderRadius: 12, borderWidth: 1, padding: 11,
  },
  zoneTitle: { fontFamily: FONTS.headingSemi, fontSize: 12.5 },
  zoneDetail: { fontFamily: FONTS.bodyLight, fontSize: 11.5, color: COLORS.muted, marginTop: 2, lineHeight: 16 },
  gapHint: {
    fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted,
    textAlign: 'center',
  },
  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
  },
  emptyText: { flex: 1, fontFamily: FONTS.bodyLight, fontSize: 12.5, color: COLORS.muted, lineHeight: 17 },
});
