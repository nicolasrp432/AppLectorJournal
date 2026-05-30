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
import Svg, { Path } from 'react-native-svg';

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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Svg viewBox="0 0 24 24" width={18} height={18}>
                  <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </Svg>
                <Text style={{ fontFamily: FONTS.heading, fontSize: 14, color: COLORS.inkLight }}>Google</Text>
              </View>
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
