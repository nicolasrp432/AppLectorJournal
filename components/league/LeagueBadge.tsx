import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getTier, LeagueTierId } from '../../lib/league';
import { FONTS } from '../../constants/typography';

/**
 * Insignia de liga reutilizable.
 *
 * Antes el tier se calculaba con un `getLeagueInfo(level)` privado dentro de
 * `perfil.tsx`, con nombres y colores escritos allí mismo. Al vivir en un único
 * componente que lee de `LEAGUE_TIERS`, cualquier pantalla puede mostrar la
 * liga sin duplicar la tabla de colores ni arriesgarse a que se desincronice.
 */
export function LeagueBadge({
  tier,
  size = 'md',
  showName = true,
}: {
  tier: LeagueTierId;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const t = getTier(tier);
  const dims = SIZES[size];

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.circle,
          {
            width: dims.circle,
            height: dims.circle,
            borderRadius: dims.circle / 2,
            backgroundColor: t.color + '18',
          },
        ]}
      >
        <Ionicons name={t.icon as never} size={dims.icon} color={t.color} />
      </View>
      {showName && (
        <Text style={[styles.name, { fontSize: dims.font, color: t.color }]}>{t.name}</Text>
      )}
    </View>
  );
}

const SIZES = {
  sm: { circle: 28, icon: 14, font: 12 },
  md: { circle: 44, icon: 22, font: 15 },
  lg: { circle: 64, icon: 32, font: 18 },
} as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONTS.headingBold },
});
