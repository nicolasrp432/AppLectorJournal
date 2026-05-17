import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import * as haptics from '../../lib/haptics';

function TabIcon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  const sw = 1.9;
  switch (name) {
    case 'ruta':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Circle cx="16" cy="16" r="7.5" fill="none" stroke={color} strokeWidth={sw} />
          <Path d="M 16 11 L 18.5 16 L 16 21 L 13.5 16 Z" fill={color} />
        </Svg>
      );
    case 'progreso':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x="8" y="18" width="3.5" height="7" rx="1" fill={color} opacity={0.5} />
          <Rect x="14.25" y="13" width="3.5" height="12" rx="1" fill={color} opacity={0.75} />
          <Rect x="20.5" y="9" width="3.5" height="16" rx="1" fill={color} />
        </Svg>
      );
    case 'libros':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path
            d="M 9 9 Q 9 8 10 8 L 16 9 L 22 8 Q 23 8 23 9 L 23 23 Q 23 24 22 24 L 16 23 L 10 24 Q 9 24 9 23 Z"
            fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round"
          />
          <Line x1="16" y1="9" x2="16" y2="23" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'tienda':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path d="M 11 9 L 21 9 L 20 16 Q 20 19 16 19 Q 12 19 12 16 Z"
            fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M 11 11 L 8 11 L 8 14 Q 8 16 11 16"
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M 21 11 L 24 11 L 24 14 Q 24 16 21 16"
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1="16" y1="19" x2="16" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1="12" y1="23" x2="20" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'perfil':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Circle cx="16" cy="13" r="3.5" fill="none" stroke={color} strokeWidth={sw} />
          <Path d="M 9 24 Q 9 18 16 18 Q 23 18 23 24"
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

const TAB_LABELS: Record<string, string> = {
  ruta:     'Ruta',
  progreso: 'Progreso',
  libros:   'Libros',
  tienda:   'Tienda',
  perfil:   'Perfil',
};

const TABS = ['ruta', 'progreso', 'libros', 'tienda', 'perfil'] as const;

interface TabBarProps {
  state:       { index: number; routes: { name: string }[] };
  navigation:  { navigate: (name: string) => void };
  descriptors?: Record<string, unknown>;
  accentColor?: string;
}

export function GlassNavbar({ state, navigation, accentColor = COLORS.focus }: TabBarProps) {
  const Inner = (
    <View style={styles.inner}>
      {TABS.map((tabName, i) => {
        const active = state.index === i;
        return (
          <NavTab
            key={tabName}
            id={tabName}
            active={active}
            accentColor={accentColor}
            onPress={() => {
              haptics.tap();
              navigation.navigate(tabName);
            }}
          />
        );
      })}
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
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: active ? 14 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: active ? accentColor : 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: active ? 0.4 : 0,
    shadowRadius: 8,
    elevation: active ? 4 : 0,
  };

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.9, { duration: 80 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 8, stiffness: 300 }); }}
      onPress={onPress}
    >
      <Animated.View style={[pillStyle, animStyle]}>
        <TabIcon name={id} color={active ? '#fff' : COLORS.muted} size={22} />
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
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  androidBg: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
