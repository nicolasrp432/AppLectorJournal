import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { PushButton } from '../../components/ui/PushButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email.trim()) { setError('Ingresa tu correo'); return; }
    if (!password.trim()) { setError('Ingresa tu contraseña'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Correo o contraseña incorrectos');
      } else if (msg.includes('email not confirmed')) {
        setError('Tu email aún no está confirmado. Revisa tu bandeja de entrada.');
      } else if (msg.includes('disabled')) {
        setError('El inicio de sesión por email está deshabilitado. Usa Google.');
      } else {
        setError(err.message);
      }
      return;
    }
    router.replace('/(tabs)/ruta');
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Manejo para plataforma Web (Redirección directa del navegador)
      if (Platform.OS === 'web') {
        const { error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (oauthErr) throw oauthErr;
        return;
      }

      // 2. Manejo para plataforma Móvil Nativa (iOS / Android)
      const redirectUrl = Linking.createURL('google-auth');
      
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oauthErr) throw oauthErr;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          const parsedUrl = Linking.parse(result.url);
          const { access_token, refresh_token } = parsedUrl.queryParams || {};
          
          if (access_token && refresh_token) {
            const { error: sessionErr } = await supabase.auth.setSession({
              access_token: String(access_token),
              refresh_token: String(refresh_token),
            });
            if (sessionErr) throw sessionErr;
            router.replace('/(tabs)/ruta');
          }
        }
      }
    } catch (err: any) {
      console.warn('Error en Google Sign-in:', err);
      setError(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      // Nota: En web, redireccionamos fuera, por lo que loading puede quedar en true hasta salir
      if (Platform.OS !== 'web') {
        setLoading(false);
      }
    }
  };

  const handleGuest = () => router.replace('/(tabs)/ruta');

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
            <Text style={{ fontSize: 80 }}>🎯</Text>
          </View>

          <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
          <Text style={styles.sub}>Focus te estaba esperando.</Text>

          <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@email.com" />
          <View style={{ height: 14 }} />
          <Field label="Contraseña" value={password} onChange={setPassword} placeholder="••••••••" secureTextEntry />

          <Pressable style={styles.forgotRow}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PushButton color={COLORS.focus} onPress={handleLogin} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </PushButton>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <OutlineButton borderColor={COLORS.border} textColor={COLORS.inkLight} onPress={handleGoogle} full={false}>
              <Text style={{ fontFamily: FONTS.heading, fontSize: 14, color: COLORS.inkLight }}>  G  Google</Text>
            </OutlineButton>
            <OutlineButton borderColor={COLORS.border} textColor={COLORS.inkLight} onPress={handleGuest} full={false}>
              <Text style={{ fontFamily: FONTS.heading, fontSize: 14, color: COLORS.inkLight }}>👤 Invitado</Text>
            </OutlineButton>
          </View>

          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.switchText}>
              ¿Sin cuenta? <Text style={styles.switchLink}>Regístrate gratis</Text>
            </Text>
          </Pressable>
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
  content:    { padding: 28, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  backBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  backArrow:  { fontSize: 20, color: COLORS.ink },
  mascot:     { alignItems: 'center', marginBottom: 8 },
  title:      { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, textAlign: 'center', marginBottom: 4 },
  sub:        { fontFamily: FONTS.bodyLight, fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 28 },
  forgotRow:  { alignItems: 'flex-end', marginVertical: 10 },
  forgotText: { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.focus },
  errorText:  { fontFamily: FONTS.body, fontSize: 13, color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel:{ fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.subtle, textTransform: 'uppercase', letterSpacing: 1 },
  socialRow:  { flexDirection: 'row', gap: 12, marginBottom: 24, justifyContent: 'center' },
  switchText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  switchLink: { color: COLORS.focus, fontFamily: FONTS.headingSemi },
});

const fieldStyles = StyleSheet.create({
  label: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 },
  input: { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, color: COLORS.ink, backgroundColor: COLORS.white },
});
