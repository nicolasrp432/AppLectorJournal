import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { FONTS, FONT_SIZE } from '../../constants/typography';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface QualityButtonsProps {
  onSelect: (quality: number) => void;
}

export default function QualityButtons({ onSelect }: QualityButtonsProps) {
  const options = [
    { label: 'Otra vez', quality: 1, color: '#EF4444', emoji: '🔴', desc: 'No recuerdo' },
    { label: 'Difícil', quality: 3, color: '#F59E0B', emoji: '🟡', desc: 'Con esfuerzo' },
    { label: 'Bien', quality: 4, color: '#10B981', emoji: '🟢', desc: 'Correcto' },
    { label: 'Fácil', quality: 5, color: '#3B82F6', emoji: '💙', desc: 'Perfecto' },
  ];

  return (
    <Animated.View 
      entering={FadeInUp.delay(200).duration(400)} 
      style={styles.container}
    >
      <Text style={styles.title}>¿Qué tan fácil te resultó?</Text>
      
      <View style={styles.buttonRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.quality}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.quality)}
            style={[styles.button, { borderColor: opt.color }]}
          >
            <View style={[styles.emojiContainer, { backgroundColor: opt.color + '15' }]}>
              <Text style={styles.emoji}>{opt.emoji}</Text>
            </View>
            <Text style={[styles.label, { color: opt.color }]}>{opt.label}</Text>
            <Text style={styles.desc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    alignSelf: 'center',
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.headingSemi,
    fontSize: FONT_SIZE.base,
    color: COLORS.inkLight,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    width: (width * 0.9 - 24) / 4,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiContainer: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 6,
  },
  emoji: {
    fontSize: FONT_SIZE.xl,
  },
  label: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs + 1,
    marginBottom: 2,
  },
  desc: {
    fontFamily: FONTS.bodyLight,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
