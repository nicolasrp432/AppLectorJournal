import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import * as haptics from '../../lib/haptics';
import { TabIcon, TAB_LABELS, TABS, type TabBarProps } from './GlassNavbarShared';
import { TIMING, PRESS_SCALE, PRESS_RETENTION } from '../../constants/motion';

// Glassy spring tuned for a fluid glide (no snap) on native.
const SLIDE_SPRING = { damping: 17, stiffness: 110, mass: 0.9 } as const;

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
  const indicatorX = useSharedValue(0);
  const indicatorY = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorH = useSharedValue(0);

  React.useEffect(() => {
    const layout = layouts[activeTabName];
    if (layout) {
      indicatorX.value = withSpring(layout.x, SLIDE_SPRING);
      indicatorY.value = withSpring(layout.y, SLIDE_SPRING);
      indicatorW.value = withSpring(layout.width, SLIDE_SPRING);
      indicatorH.value = withSpring(layout.height, SLIDE_SPRING);
    }
  }, [activeTabName, layouts]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (indicatorW.value === 0) {
      return { opacity: 0 };
    }
    return {
      position: 'absolute',
      left: indicatorX.value,
      top: indicatorY.value,
      width: indicatorW.value,
      height: indicatorH.value,
      borderRadius: 20,
      backgroundColor: accentColor,
      opacity: 1,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    };
  });

  const Inner = (
    <View style={styles.inner}>
      {/* Sliding Glassmorphic/Solid background pill */}
      <Animated.View style={indicatorStyle} />

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
  onPress,
  onLayout,
}: {
  id: string;
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, y: number, width: number, height: number) => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle: ViewStyle = {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: active ? 16 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <View
      onLayout={e => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayout(x, y, width, height);
      }}
    >
      <Pressable
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
    </View>
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
