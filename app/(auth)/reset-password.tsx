import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currentUrl = Linking.useURL();

  // Procesar enlace de recuperación en plataformas nativas
  useEffect(() => {
    async function handleIncomingDeepLink() {
      if (Platform.OS === 'web' || !currentUrl) return;

      console.log('Incoming deep link in reset-password:', currentUrl);

      // Supabase a veces envía los tokens en la parte hash (#access_token=...)
      // Reemplazamos '#' por '?' para que Linking.parse lea los parámetros como queryParams
      const sanitized = currentUrl.replace('#', '?');
      const parsed = Linking.parse(sanitized);

      const accessToken = parsed.queryParams?.access_token;
      const refreshToken = parsed.queryParams?.refresh_token;

      if (accessToken && refreshToken) {
        console.log('Tokens de recuperación detectados. Estableciendo sesión en Supabase...');
        setSessionLoading(true);
        setError('');
        
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: String(accessToken),
          refresh_token: String(refreshToken),
        });
        
        setSessionLoading(false);

        if (sessionErr) {
          console.warn('Error al establecer sesión desde enlace:', sessionErr);
          setError('El enlace de recuperación ha expirado o es inválido. Por favor, solicita uno nuevo.');
        } else {
          console.log('Sesión establecida con éxito desde deep link.');
        }
      }
    }

    handleIncomingDeepLink();
  }, [currentUrl]);

  const handleResetPassword = async () => {
    const pwd = password.trim();
    const confPwd = confirmPassword.trim();

    if (!pwd || !confPwd) {
      setError('Por favor, completa ambos campos.');
      return;
    }

    if (pwd.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (pwd !== confPwd) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validar si realmente hay una sesión de recuperación activa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay ninguna sesión activa para recuperar la contraseña. Vuelve a solicitar el enlace.');
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: pwd,
      });

      if (updateErr) {
        throw updateErr;
      }

      // Cerrar sesión para limpiar cualquier token temporal y forzar un login limpio
      await supabase.auth.signOut();
      
      setSuccess(true);
    } catch (err: any) {
      console.warn('Error al cambiar la contraseña:', err);
      setError(err.message || 'Ocurrió un error al actualizar tu contraseña.');
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
          <View style={styles.mascot}>
            <Text style={{ fontSize: 80 }}>🔒</Text>
          </View>

          <Text style={styles.title}>Nueva Contraseña</Text>
          <Text style={styles.sub}>
            Ingresa tu nueva contraseña para volver a acceder a tu cuenta de LectorApp.
          </Text>

          {sessionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.focus} />
              <Text style={styles.loadingText}>Verificando enlace de recuperación…</Text>
            </View>
          ) : success ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>¡Contraseña cambiada! 🎉</Text>
              <Text style={styles.successText}>
                Tu contraseña ha sido actualizada con éxito de manera segura.
              </Text>
              <View style={{ height: 16 }} />
              <PushButton color={COLORS.focus} onPress={() => router.replace('/(auth)/login')}>
                Iniciar Sesión
              </PushButton>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <Field
                label="Nueva Contraseña"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <View style={{ height: 14 }} />

              <Field
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={{ height: 24 }} />

              <PushButton color={COLORS.focus} onPress={handleResetPassword} disabled={loading}>
                {loading ? 'Guardando contraseña…' : 'Establecer nueva contraseña'}
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  mascot: { alignItems: 'center', marginBottom: 12, marginTop: 24 },
  title: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.ink, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: FONTS.bodyLight, fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 12 },
  loadingContainer: { alignItems: 'center', padding: 32 },
  loadingText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, marginTop: 16 },
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
    lineHeight: 20,
  },
});

const fieldStyles = StyleSheet.create({
  label: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 },
  input: { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, color: COLORS.ink, backgroundColor: COLORS.white },
});
