import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../store/useProfileStore';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

interface PremiumGateProps {
  children: React.ReactNode;
  onTriggerPaywall: () => void;
}

export function PremiumGate({ children, onTriggerPaywall }: PremiumGateProps) {
  const isPremium = useProfileStore(s => s.isPremium());

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Target Content */}
      <View style={styles.contentWrap} pointerEvents="none">
        {children}
      </View>

      {/* Modern Translucent Premium Glass Layer */}
      <Pressable style={styles.overlay} onPress={onTriggerPaywall}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <View style={styles.premiumBadge}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={styles.premiumText}>PREMIUM</Text>
        </View>
        <View style={styles.lockBox}>
          <Ionicons name="lock-closed" size={24} color="#FBBF24" />
        </View>
        <Text style={styles.lockTitle}>Desbloquea con Premium</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  contentWrap: {
    width: '100%',
    opacity: 0.45,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    position: 'absolute',
    top: 14,
    right: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumText: {
    color: '#fff',
    fontFamily: FONTS.headingBold || 'System',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  lockBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lockTitle: {
    color: '#fff',
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 13,
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
