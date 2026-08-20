import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import * as haptics from '../../lib/haptics';
import { TabIcon, TAB_LABELS, TABS, type TabBarProps } from './GlassNavbarShared';

// Variante web. Antes esta existía porque reanimated está stubbeado en web y la
// píldora deslizante habría dado un salto, así que el deslizamiento se hacía con
// una transición CSS real sobre left/top/width/height.
//
// Ya no hay deslizamiento en ninguna plataforma (ver el comentario en
// GlassNavbar.tsx), así que este archivo se queda solo por el cristal: en web el
// desenfoque es backdrop-filter, no expo-blur.

export function GlassNavbar({ state, navigation, accentColor = COLORS.focus }: TabBarProps) {
  return (
    <View style={[styles.container, webGlass]}>
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
  const pillStyle: any = {
    backgroundColor: active ? accentColor : 'transparent',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: active ? 16 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...(active ? { boxShadow: `0 6px 16px ${accentColor}55` } : null),
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={TAB_LABELS[id]}
      onPress={onPress}
      // El equivalente en web del scale de nativo: instantáneo al pulsar.
      style={({ pressed }: { pressed: boolean }) =>
        pressed ? { transform: [{ scale: 0.97 }] } : null
      }
    >
      <View style={pillStyle}>
        <TabIcon name={id} color={active ? '#fff' : COLORS.muted} size={28} />
        {active && <Text style={styles.label}>{TAB_LABELS[id]}</Text>}
      </View>
    </Pressable>
  );
}

// Liquid-glass en web: relleno translúcido + desenfoque de fondo (claves CSS
// que no forman parte del ViewStyle de RN, de ahí el objeto casteado).
const webGlass: any = {
  backgroundColor: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 14,
    left: 12,
    right: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
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
