import React from 'react';
import { Platform, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { FONTS } from '../../constants/typography';
import * as haptics from '../../lib/haptics';

interface Props {
  children: React.ReactNode;
  onPress: () => void;
  borderColor?: string;
  textColor?: string;
  full?: boolean;
}

export function OutlineButton({
  children,
  onPress,
  borderColor = '#E5E7EB',
  textColor = '#111827',
  full = true,
}: Props) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 4 }],
  }));

  const shadowStyle: ViewStyle = Platform.select({
    web: {
      // @ts-ignore
      boxShadow: `0 4px 0 ${borderColor}`,
      cursor: 'pointer',
    } as ViewStyle,
    default: {
      shadowColor: borderColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.99,
      shadowRadius: 0,
      elevation: 4,
    },
  }) ?? {};

  return (
    <Pressable
      onPressIn={() => { pressed.value = withTiming(1, { duration: 80 }); haptics.tap(); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: 80 }); }}
      onPress={onPress}
      style={full ? styles.full : undefined}
    >
      <Animated.View style={[styles.base, { borderColor }, shadowStyle, animStyle]}>
        {typeof children === 'string' ? (
          <Text style={[styles.label, { color: textColor }]}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  base: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
