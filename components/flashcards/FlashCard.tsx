import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZE } from '../../constants/typography';
import { COLORS, darken } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface FlashCardProps {
  front: string;
  back: string;
  hint?: string;
  color?: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function FlashCard({
  front,
  back,
  hint,
  color = '#3B82F6',
  isFlipped,
  onFlip,
}: FlashCardProps) {
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    rotate.value = withTiming(isFlipped ? 180 : 0, {
      duration: 450,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotate.value, [0, 180], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` }
      ],
      zIndex: rotate.value < 90 ? 1 : 0,
      opacity: rotate.value < 90 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotate.value, [0, 180], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` }
      ],
      zIndex: rotate.value >= 90 ? 1 : 0,
      opacity: rotate.value >= 90 ? 1 : 0,
    };
  });

  const gradientColors = [color, darken(color, 0.25)] as [string, string];

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onFlip}
        style={styles.touchable}
      >
        {/* FRONT SIDE */}
        <Animated.View style={[styles.cardSide, frontStyle]}>
          <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.innerContent}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>PREGUNTA</Text>
              </View>
              
              <Text style={styles.frontText}>{front}</Text>
              
              {hint && (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintLabel}>Pista:</Text>
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              )}
              
              <Text style={styles.tapPrompt}>Toca para revelar respuesta</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* BACK SIDE */}
        <Animated.View style={[styles.cardSide, styles.cardBack, backStyle]}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC'] as [string, string]}
            style={[styles.gradient, styles.whiteGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.innerContent}>
              <View style={[styles.badgeContainer, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>RESPUESTA</Text>
              </View>

              <Text style={[styles.backText, { color: COLORS.ink }]}>{back}</Text>
              
              <View style={styles.cardBackFooter}>
                <Text style={styles.flipBackPrompt}>Toca para volver a la pregunta</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: width * 0.9,
    height: 420,
    alignSelf: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  touchable: {
    flex: 1,
  },
  cardSide: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardBack: {
    borderColor: COLORS.border,
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  whiteGradient: {
    justifyContent: 'space-between',
  },
  innerContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignSelf: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1.5,
  },
  frontText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE['2xl'],
    textAlign: 'center',
    lineHeight: 32,
    marginVertical: 20,
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    paddingHorizontal: 10,
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    maxWidth: '90%',
    alignItems: 'center',
    marginTop: 10,
  },
  hintLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZE.xs,
    marginBottom: 2,
  },
  hintText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  tapPrompt: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  cardBackFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    paddingTop: 12,
    alignItems: 'center',
  },
  flipBackPrompt: {
    color: COLORS.muted,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
  },
});
