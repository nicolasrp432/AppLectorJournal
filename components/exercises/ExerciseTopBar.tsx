import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

interface Props {
  title?: string;
  progress: number;
  accent: string;
  onQuit: () => void;
}

export function ExerciseTopBar({ title, progress, accent, onQuit }: Props) {
  const insets = useSafeAreaInsets();
  const trackW = useSharedValue(0);
  const fillW  = useSharedValue(0);

  React.useEffect(() => {
    const target = Math.min(1, Math.max(0, progress)) * trackW.value;
    fillW.value = withTiming(target, { duration: 400 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({ width: fillW.value }));

  return (
    <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
      <Pressable onPress={onQuit} style={styles.quitBtn} hitSlop={8}>
        <Text style={styles.quitIcon}>✕</Text>
      </Pressable>
      {progress >= 0 ? (
        <View
          style={styles.progressTrack}
          onLayout={e => {
            trackW.value = e.nativeEvent.layout.width;
            fillW.value  = Math.min(1, Math.max(0, progress)) * e.nativeEvent.layout.width;
          }}
        >
          <Animated.View style={[styles.progressFill, { backgroundColor: accent }, barStyle]} />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {title ? <Text style={styles.titleText}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  quitBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  quitIcon:      { fontSize: 16, color: COLORS.muted },
  progressTrack: { flex: 1, height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },
  titleText:     { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
});
