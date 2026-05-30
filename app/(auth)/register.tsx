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

export default function RegisterScreen() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleRegister = async () => {
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    if (!email.trim()) { setError('Ingresa tu correo'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: Platform.OS === 'web'
            ? window.location.origin
            : undefined,
        },
      });

      // If the user was created successfully (even if confirmation email failed)
      if (data?.user && !data.user.email_confirmed_at) {
        // User created but email not confirmed — try auto-login
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!loginErr) {
          router.replace('/(tabs)/ruta');
          return;
        }
      }

      if (err) {
        // Translate common Supabase errors to Spanish
        const msg = err.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          setError('Este correo ya está registrado. Intenta iniciar sesión.');
        } else if (msg.includes('sending confirmation') || msg.includes('confirmation email')) {
          // Email was created but confirmation email failed (SMTP issue)
          // Try to sign in directly
          const { error: loginErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!loginErr) {
            router.replace('/(tabs)/ruta');
            return;
          }
          setError('Cuenta creada pero hubo un error con el correo de confirmación. Intenta iniciar sesión.');
        } else if (msg.includes('password') && msg.includes('characters')) {
          setError('La contraseña debe tener al menos 6 caracteres');
        } else if (msg.includes('valid email') || msg.includes('invalid')) {
          setError('Ingresa un correo electrónico válido');
        } else if (msg.includes('signups not allowed') || msg.includes('disabled')) {
          setError('El registro por email está temporalmente deshabilitado. Usa Google para registrarte.');
        } else {
          setError(err.message);
        }
        return;
      }

      // Success — user is confirmed or auto-confirmed
      if (data?.session) {
        router.replace('/(tabs)/ruta');
      } else {
        // Email confirmation required — show info
        setError('');
        router.replace('/(tabs)/ruta');
      }
    } catch (e: any) {
      setError(e.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
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
      if (Platform.OS !== 'web') {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ fontSize: 20, color: COLORS.ink }}>←</Text>
          </Pressable>

          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 80 }}>😄</Text>
          </View>

          <Text style={styles.title}>¡Únete al viaje!</Text>
          <Text style={styles.sub}>Joy te dará tu primer premio.</Text>

          {[
            { label: 'Nombre',      value: name,     setter: setName,     placeholder: '¿Cómo te llamamos?',   secure: false },
            { label: 'Correo',      value: email,    setter: setEmail,    placeholder: 'tu@email.com',         secure: false },
            { label: 'Contraseña',  value: password, setter: setPassword, placeholder: 'mínimo 8 caracteres', secure: true  },
          ].map(f => (
            <View key={f.label} style={{ marginBottom: 14 }}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={f.secure}
                autoCapitalize={f.label === 'Nombre' ? 'words' : 'none'}
              />
            </View>
          ))}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PushButton color={COLORS.focus} onPress={handleRegister} disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </PushButton>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>o regístrate con</Text>
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
          </View>

          <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>
              ¿Ya tienes cuenta? <Text style={{ color: COLORS.focus, fontFamily: FONTS.headingSemi }}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content:    { padding: 28, paddingBottom: 40 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:      { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, textAlign: 'center', marginBottom: 4 },
  sub:        { fontFamily: FONTS.bodyLight, fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 28 },
  fieldLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 },
  input:      { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, color: COLORS.ink },
  errorText:  { fontFamily: FONTS.body, fontSize: 13, color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel:{ fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.subtle, textTransform: 'uppercase', letterSpacing: 1 },
  socialRow:  { flexDirection: 'row', gap: 12, marginBottom: 12, justifyContent: 'center' },
});
