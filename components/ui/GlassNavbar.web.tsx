import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import * as haptics from '../../lib/haptics';
import { TabIcon, TAB_LABELS, TABS, type TabBarProps } from './GlassNavbarShared';

// Web variant: reanimated is stubbed on web (animations resolve instantly), so
// the sliding pill would jump. Here we drive the slide with a real CSS
// transition on the pill's box, which react-native-web forwards to the DOM.

export function GlassNavbar({ state, navigation, accentColor = COLORS.focus }: TabBarProps) {
  const [layouts, setLayouts] = React.useState<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const handleTabLayout = (tabName: string, x: number, y: number, width: number, height: number) => {
    setLayouts(prev => {
      const current = prev[tabName];
      if (current && current.x === x && current.width === width && current.height === height) {
        return prev;
      }
      return { ...prev, [tabName]: { x, y, width, height } };
    });
  };

  const activeTabName = TABS[state.index];
  const layout = layouts[activeTabName];

  // CSS-transition driven pill — glides smoothly between tabs on web.
  const indicatorStyle: any = layout
    ? {
        position: 'absolute',
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        borderRadius: 20,
        backgroundColor: accentColor,
        boxShadow: `0 6px 16px ${accentColor}55`,
        transitionProperty: 'left, top, width, height',
        transitionDuration: '340ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    : { opacity: 0 };

  return (
    <View style={[styles.container, webGlass]}>
      <View style={styles.inner}>
        <View style={indicatorStyle} pointerEvents="none" />

        {TABS.map((tabName, i) => {
          const active = state.index === i;
          return (
            <NavTab
              key={tabName}
              id={tabName}
              active={active}
              onLayout={(x, y, w, h) => handleTabLayout(tabName, x, y, w, h)}
              onPress={() => {
                haptics.tap();
                navigation.navigate(tabName);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function NavTab({
  id,
  active,
  onPress,
  onLayout,
}: {
  id: string;
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, y: number, width: number, height: number) => void;
}) {
  const pillStyle: any = {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: active ? 16 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Smooth the icon/label reflow as the active pill grows.
    transitionProperty: 'padding',
    transitionDuration: '300ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <View
      onLayout={e => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayout(x, y, width, height);
      }}
    >
      <Pressable onPress={onPress}>
        <View style={pillStyle}>
          <TabIcon name={id} color={active ? '#fff' : COLORS.muted} size={28} />
          {active && <Text style={styles.label}>{TAB_LABELS[id]}</Text>}
        </View>
      </Pressable>
    </View>
  );
}

// Liquid-glass look on web: translucent fill + backdrop blur (web-only CSS keys,
// not part of RN's ViewStyle, so kept as a plain cast object).
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
