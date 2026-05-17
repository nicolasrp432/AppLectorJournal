import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PushButton } from '../../components/ui/PushButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { CharGroup } from '../../components/ui/MascotChar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle, { width: 180, height: 180, top: 60, right: -40, backgroundColor: '#DCFCE7' }]} />
      <View style={[styles.circle, { width: 80,  height: 80,  top: 30, left: -20, backgroundColor: '#DBEAFE' }]} />
      <View style={[styles.circle, { width: 40,  height: 40,  bottom: 280, right: 40, backgroundColor: '#FEF3C7' }]} />

      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.brandName}>LectorApp</Text>
      </View>

      {/* Hero area */}
      <View style={styles.hero}>
        <View style={styles.mascotGroup}>
          <CharGroup size={68} />
        </View>

        <Text style={styles.headline}>
          Entrena tu{'\n'}mente leyendo
        </Text>
        <Text style={styles.sub}>
          Un viaje divertido para leer más rápido,{'\n'}recordar más y concentrarte mejor.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <PushButton color={COLORS.focus} onPress={() => router.push('/(auth)/register')}>
          Empezar gratis
        </PushButton>
        <View style={{ height: 12 }} />
        <OutlineButton
          borderColor={COLORS.border}
          textColor={COLORS.muted}
          onPress={() => router.push('/(auth)/login')}
        >
          Ya tengo cuenta
        </OutlineButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: 0,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    zIndex: 2,
  },
  logoBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.focus,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONTS.heading, fontSize: 18, color: '#fff',
  },
  brandName: {
    fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  mascotGroup: {
    marginBottom: 20,
  },
  headline: {
    fontFamily: FONTS.heading,
    fontSize: 32,
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: {
    fontFamily: FONTS.bodyLight,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctas: { zIndex: 2 },
});
