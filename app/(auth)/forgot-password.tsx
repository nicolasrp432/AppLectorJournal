import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let redirectTo = '';
      if (Platform.OS === 'web') {
        redirectTo = `${window.location.origin}/reset-password`;
      } else {
        redirectTo = Linking.createURL('reset-password');
      }

      console.log('Password reset redirect URL:', redirectTo);

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (resetErr) {
        throw resetErr;
      }

      setSuccess(true);
    } catch (err: any) {
      console.warn('Error al solicitar reestablecimiento:', err);
      setError(err.message || 'Ocurrió un error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <View style={styles.mascot}>
            <Text style={{ fontSize: 80 }}>🔑</Text>
          </View>

          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.sub}>
            No te preocupes, dinos tu correo y te enviaremos las instrucciones de recuperación.
          </Text>

          {success ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>¡Correo enviado! 📩</Text>
              <Text style={styles.successText}>
                Hemos enviado un enlace a <Text style={{ fontFamily: FONTS.headingSemi }}>{email.trim()}</Text> para que puedas cambiar tu contraseña.
              </Text>
              <Text style={styles.successSubtext}>
                Revisa tu bandeja de entrada o la carpeta de spam.
              </Text>
              <View style={{ height: 16 }} />
              <PushButton color={COLORS.focus} onPress={() => router.replace('/(auth)/login')}>
                Volver a Iniciar Sesión
              </PushButton>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <Field
                label="Correo Electrónico"
                value={email}
                onChange={setEmail}
                placeholder="tu@email.com"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={{ height: 24 }} />

              <PushButton color={COLORS.focus} onPress={handleResetRequest} disabled={loading}>
                {loading ? 'Enviando enlace…' : 'Enviar enlace de recuperación'}
              </PushButton>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder, secureTextEntry = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; secureTextEntry?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, { borderColor: focused ? COLORS.focus : COLORS.border }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.subtle}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  backArrow: { fontSize: 20, color: COLORS.ink },
  mascot: { alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.ink, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: FONTS.bodyLight, fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 12 },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  successTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: '#15803D',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  successSubtext: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: '#166534',
    opacity: 0.8,
    textAlign: 'center',
  },
});

const fieldStyles = StyleSheet.create({
  label: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 },
  input: { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, color: COLORS.ink, backgroundColor: COLORS.white },
});
