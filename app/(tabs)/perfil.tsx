import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Switch,
  TextInput, ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '../../store/useProfileStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MascotChar } from '../../components/ui/MascotChar';
import type { MascotKey } from '../../components/ui/MascotChar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { levelProgress, xpForNextLevel } from '../../lib/xpEngine';
import { scheduleDailyReminder, cancelDailyReminder } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';

const ACHIEVEMENTS = [
  { id: 'streak7',    title: 'Racha 7',      emoji: '🔥', desc: '7 días seguidos' },
  { id: 'firstbook',  title: 'Primer libro', emoji: '📚', desc: 'Lee tu primer libro' },
  { id: 'wpm300',     title: '300 WPM',      emoji: '⚡', desc: 'Alcanza 300 WPM' },
  { id: 'loci',       title: 'Maestro Loci', emoji: '🏛', desc: 'Completa método Loci' },
  { id: 'comp90',     title: '90% comp.',    emoji: '🧠', desc: '90% comprensión' },
  { id: 'level10',    title: 'Nivel 10',     emoji: '👑', desc: 'Llega al nivel 10' },
  { id: 'sessions50', title: '50 sesiones',  emoji: '🎯', desc: '50 ejercicios' },
  { id: 'schulte7',   title: 'Schulte 7×7',  emoji: '🔲', desc: 'Cuadrícula 7×7' },
  { id: 'wpm500',     title: '500 WPM',      emoji: '🚀', desc: 'Alcanza 500 WPM' },
];

export default function PerfilScreen() {
  const profile              = useProfileStore(s => s.profile);
  const updateProfile        = useProfileStore(s => s.updateProfile);
  const uploadAvatar         = useProfileStore(s => s.uploadAvatar);
  const prefs                = usePrefsStore(s => s.prefs);
  const { update: updatePrefs } = usePrefsStore();
  const unlockedAchievements = useAchievementsStore(s => s.unlocked);

  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [editBio,  setEditBio]    = useState('');
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;

  // ── Avatar picker ────────────────────────────────────────────────────────────
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar el avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    const mime = asset.mimeType ?? 'image/jpeg';
    const url = await uploadAvatar(asset.uri, mime);
    setUploading(false);
    if (!url) {
      Alert.alert('Error', 'No se pudo subir la foto. Verifica tu conexión.');
    }
  };

  // ── Profile edit ─────────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditName(profile.name);
    setEditBio(profile.bio);
    setEditing(true);
  };

  const saveEdit = async () => {
    const name = editName.trim();
    const bio  = editBio.trim();
    if (!name) return;
    await updateProfile({ name, bio });
    setEditing(false);
  };

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const isGuest = profile.id === 'local';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Avatar */}
          <Pressable onPress={handlePickAvatar} style={styles.avatarWrap} disabled={uploading || isGuest}>
            {uploading ? (
              <ActivityIndicator color={COLORS.focus} size="large" />
            ) : profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <MascotChar which={(profile.avatar as MascotKey) ?? 'focus'} size={80} expression="happy" />
            )}
            {!isGuest && (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>📷</Text>
              </View>
            )}
          </Pressable>

          {/* Name / bio */}
          {editing ? (
            <View style={{ width: '100%', gap: 10, marginTop: 10 }}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.subtle}
                maxLength={40}
              />
              <TextInput
                style={[styles.editInput, { height: 60 }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Una frase sobre ti..."
                placeholderTextColor={COLORS.subtle}
                multiline
                maxLength={120}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setEditing(false)} style={styles.editCancelBtn}>
                  <Text style={styles.editCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={saveEdit} style={styles.editSaveBtn}>
                  <Text style={styles.editSaveText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Text style={styles.name}>{profile.name}</Text>
                {!isGuest && (
                  <Pressable onPress={startEdit} hitSlop={8}>
                    <Text style={{ fontSize: 16 }}>✏️</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.bio}>{profile.bio}</Text>
            </>
          )}

          {/* Level + XP bar */}
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Nivel {profile.level}</Text>
            <Text style={styles.levelXP}>{xpForNextLevel(profile.xp)} XP para Nivel {profile.level + 1}</Text>
          </View>
          <View style={{ marginTop: 8, width: '100%' }}>
            <ProgressBar value={levelProgress(profile.xp)} color={COLORS.focus} height={10} />
          </View>
        </View>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Racha', value: profile.streak, unit: '🔥' },
            { label: 'Nivel',  value: profile.level,  unit: '⭐' },
            { label: 'XP',     value: profile.xp,     unit: '⚡' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.unit} {s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Logros</Text>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <View key={a.id} style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}>
                <Text style={{ fontSize: 24, opacity: unlocked ? 1 : 0.3 }}>{a.emoji}</Text>
                <Text style={[styles.achievementLabel, !unlocked && { color: COLORS.subtle }]}>{a.title}</Text>
                {unlocked && <Text style={styles.achievementCheck}>✓</Text>}
              </View>
            );
          })}
        </View>

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.settingsCard}>
          <View style={[styles.settingsRow, { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.surface }]}>
            <Text style={styles.settingsLabel}>Reducir animaciones</Text>
            <Switch
              value={prefs.reduce_motion}
              onValueChange={val => updatePrefs({ reduce_motion: val })}
              trackColor={{ true: COLORS.focus }}
            />
          </View>
          <View style={[styles.settingsRow, { paddingVertical: 14 }]}>
            <Text style={styles.settingsLabel}>Notificaciones diarias</Text>
            <Switch
              value={prefs.notifications_enabled}
              onValueChange={async (val) => {
                await updatePrefs({ notifications_enabled: val });
                if (val) {
                  scheduleDailyReminder(prefs.notifications_time).catch(() => {});
                } else {
                  cancelDailyReminder().catch(() => {});
                }
              }}
              trackColor={{ true: COLORS.focus }}
            />
          </View>
        </View>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        {!isGuest && (
          <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </Pressable>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.canvas },
  scroll:    { padding: 20 },

  // Hero
  hero:        { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.focus + '40', padding: 20, alignItems: 'center', marginBottom: 16 },
  avatarWrap:  { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.focus + '20', alignItems: 'center', justifyContent: 'center' },
  avatarImg:   { width: 88, height: 88, borderRadius: 44 },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  avatarBadgeText: { fontSize: 12 },
  name:        { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  bio:         { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 4 },
  levelRow:    { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  levelLabel:  { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.ink },
  levelXP:     { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },

  // Edit
  editInput:      { fontFamily: FONTS.body, fontSize: 15, borderWidth: 1.5, borderColor: COLORS.focus + '60', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, color: COLORS.ink, backgroundColor: COLORS.surface },
  editCancelBtn:  { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  editCancelText: { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.muted },
  editSaveBtn:    { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.focus, alignItems: 'center' },
  editSaveText:   { fontFamily: FONTS.headingSemi, fontSize: 13, color: '#fff' },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:  { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  statLabel: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  // Section title
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, marginBottom: 10 },

  // Achievements
  achievementsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  achievementBadge:  { width: '30%', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.focus + '40', padding: 10, alignItems: 'center', gap: 4 },
  achievementLocked: { borderColor: COLORS.border },
  achievementLabel:  { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.inkLight, textAlign: 'center' },
  achievementCheck:  { fontSize: 9, color: '#22C55E', fontFamily: FONTS.heading },

  // Settings card
  settingsCard:   { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden' },
  settingsRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  settingsLabel:  { fontFamily: FONTS.body, fontSize: 15, color: COLORS.ink, flex: 1 },

  // Sign out
  signOutBtn:  { marginTop: 4, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#EF4444', alignItems: 'center' },
  signOutText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: '#EF4444' },
});
