import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { FONTS } from '../../constants/typography';

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
  const [pressed, setPressed] = useState(false);

  const btnStyle = {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    // @ts-ignore — React Native Web supports boxShadow and cursor
    boxShadow: pressed ? 'none' : `0 4px 0 ${borderColor}`,
    cursor: 'pointer',
    transform: [{ translateY: pressed ? 4 : 0 }],
  };

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={full ? styles.full : undefined}
    >
      <View style={btnStyle as ViewStyle}>
        {typeof children === 'string' ? (
          <Text style={[styles.label, { color: textColor }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full:  { width: '100%' },
  label: { fontFamily: FONTS.heading, fontSize: 15, letterSpacing: 0.2, textTransform: 'uppercase' },
});
