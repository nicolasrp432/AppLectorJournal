import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import * as haptics from '../../lib/haptics';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  sm: { paddingV: 8,  paddingH: 18, fontSize: 14, radius: 14, shadow: 3 },
  md: { paddingV: 12, paddingH: 22, fontSize: 15, radius: 16, shadow: 4 },
  lg: { paddingV: 16, paddingH: 26, fontSize: 16, radius: 18, shadow: 5 },
};

export function PushButton({
  children,
  onPress,
  color = '#22C55E',
  textColor = '#fff',
  size = 'lg',
  full = true,
  disabled = false,
  style,
}: Props) {
  const cfg        = SIZE_CONFIG[size];
  const shadowSize = cfg.shadow;          // plain number — safe to capture in worklet
  const shadeColor = darken(color, 0.18);
  const pressed    = useSharedValue(0);

  // Only animate transform — shadow/elevation are native-only and crash web worklets
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * shadowSize }],
  }));

  // Static shadow applied outside the worklet (web uses boxShadow via style)
  const shadowStyle: ViewStyle = Platform.select({
    web: {
      // @ts-ignore — React Native Web supports boxShadow
      boxShadow: `0 ${cfg.shadow}px 0 ${shadeColor}`,
      cursor: 'pointer',
    } as ViewStyle,
    default: {
      shadowColor: shadeColor,
      shadowOffset: { width: 0, height: cfg.shadow },
      shadowOpacity: 0.99,
      shadowRadius: 0,
      elevation: cfg.shadow,
    },
  }) ?? {};

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
        haptics.tap();
      }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: 80 }); }}
      onPress={onPress}
      style={[full && styles.full, style]}
    >
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: disabled ? '#9CA3AF' : color,
            paddingVertical: cfg.paddingV,
            paddingHorizontal: cfg.paddingH,
            borderRadius: cfg.radius,
          },
          shadowStyle,
          animStyle,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.label, { color: textColor, fontSize: cfg.fontSize } as TextStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full:  { width: '100%' },
  base:  { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONTS.heading, letterSpacing: 0.2, textTransform: 'uppercase' },
});
