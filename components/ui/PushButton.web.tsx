import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

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
  const [pressed, setPressed] = useState(false);
  const cfg        = SIZE_CONFIG[size];
  const shadeColor = darken(color, 0.18);
  const shadow     = cfg.shadow;

  const btnStyle = {
    backgroundColor: disabled ? '#9CA3AF' : color,
    paddingVertical: cfg.paddingV,
    paddingHorizontal: cfg.paddingH,
    borderRadius: cfg.radius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    // @ts-ignore — React Native Web supports boxShadow and cursor
    boxShadow: pressed || disabled ? 'none' : `0 ${shadow}px 0 ${shadeColor}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transform: [{ translateY: pressed && !disabled ? shadow : 0 }],
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[full ? styles.full : undefined, style]}
    >
      <View style={btnStyle as ViewStyle}>
        {typeof children === 'string' ? (
          <Text style={[styles.label, { color: textColor, fontSize: cfg.fontSize } as TextStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full:  { width: '100%' },
  label: { fontFamily: FONTS.heading, letterSpacing: 0.2, textTransform: 'uppercase' },
});
