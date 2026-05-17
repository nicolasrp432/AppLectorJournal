import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function RegisterScreen() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleRegister = async () => {
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace('/(tabs)/ruta');
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
});
