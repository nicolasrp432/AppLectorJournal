import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import { TIMING, PRESS_SCALE, PRESS_RETENTION } from '../../constants/motion';
import * as haptics from '../../lib/haptics';
import { TabIcon, TAB_LABELS, TABS, type TabBarProps } from './GlassNavbarShared';

/**
 * Barra de pestañas.
 *
 * POR QUÉ LA PÍLDORA YA NO SE DESLIZA
 * -----------------------------------
 * Antes había un indicador que se movía con muelle entre las cinco pestañas,
 * lo que obligaba a medir el layout de cada pestaña, guardarlo en estado de
 * React (un re-render de toda la barra por medición) y animar cuatro valores
 * compartidos: left, top, width y height.
 *
 * Dos motivos para quitarlo:
 *
 *  1. Las pestañas son pares, no una jerarquía. Deslizar entre ellas sugiere
 *     una profundidad o un orden que no existe: ir de Perfil a Ruta no es
 *     "volver atrás cuatro sitios", es saltar a otro sitio.
 *
 *  2. El usuario cambia de pestaña decenas de veces por sesión. En esa
 *     frecuencia, cualquier animación es un peaje que se paga una y otra vez,
 *     y la respuesta correcta es que no haya ninguna: la píldora simplemente
 *     está donde tiene que estar en el frame siguiente.
 *
 * Al quitarla desaparecen también el estado de layouts, los cuatro valores
 * compartidos y el efecto que los sincronizaba. La píldora es ahora el fondo
 * de la propia pestaña activa.
 */
export function GlassNavbar({ state, navigation, accentColor = COLORS.focus }: TabBarProps) {
  const Inner = (
    <View style={styles.inner}>
      {TABS.map((tabName, i) => (
        <NavTab
          key={tabName}
          id={tabName}
          active={state.index === i}
          accentColor={accentColor}
          onPress={() => {
            haptics.tap();
            navigation.navigate(tabName);
          }}
        />
      ))}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="light" style={styles.container}>
        {Inner}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, styles.androidBg]}>
      {Inner}
    </View>
  );
}

function NavTab({
  id,
  active,
  accentColor,
  onPress,
}: {
  id: string;
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle: ViewStyle = {
    backgroundColor: active ? accentColor : 'transparent',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: active ? 16 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...(active
      ? {
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        }
      : null),
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={TAB_LABELS[id]}
      pressRetentionOffset={PRESS_RETENTION}
      onPressIn={() => { scale.value = withTiming(PRESS_SCALE, TIMING.press); }}
      onPressOut={() => { scale.value = withTiming(1, TIMING.press); }}
      onPress={onPress}
    >
      <Animated.View style={[pillStyle, animStyle]}>
        <TabIcon name={id} color={active ? '#fff' : COLORS.muted} size={28} />
        {active && (
          <Text style={styles.label}>{TAB_LABELS[id]}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 14,
    left: 12,
    right: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.6)' : 'rgba(17,24,39,0.08)',
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
  },
  androidBg: {
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
