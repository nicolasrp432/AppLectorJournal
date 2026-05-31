import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Switch,
  TextInput, ActivityIndicator, Image, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/useProfileStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useNodeStore } from '../../store/useNodeStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { PremiumPaywall } from '../../components/ui/PremiumPaywall';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MascotChar } from '../../components/ui/MascotChar';
import type { MascotKey } from '../../components/ui/MascotChar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { levelProgress, xpForNextLevel } from '../../lib/xpEngine';
import { scheduleDailyReminder, cancelDailyReminder } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { REWARDS } from '../../constants/rewards';
import * as Haptics from 'expo-haptics';

type IconLib = 'Ionicons' | 'MaterialCommunityIcons';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  lib: IconLib;
  desc: string;
  color: string;
  cond: boolean;
}

const MASCOTS: { key: MascotKey; name: string; desc: string; color: string }[] = [
  { key: 'focus', name: 'Focus', desc: 'El zorro analítico y observador', color: COLORS.focus },
  { key: 'calm', name: 'Calm', desc: 'El panda sereno de la memoria profunda', color: COLORS.calm },
  { key: 'swift', name: 'Swift', desc: 'El lince ágil de la lectura veloz', color: COLORS.swift },
  { key: 'loci', name: 'Loci', desc: 'La lechuza sabia de los palacios mentales', color: COLORS.loci },
  { key: 'joy', name: 'Joy', desc: 'El delfín alegre de la alta comprensión', color: COLORS.joy },
  { key: 'memo', name: 'Memo', desc: 'La nube amigable de la memoria ágil', color: COLORS.memo },
];

function AchIcon({ icon, lib, size, color }: { icon: string; lib: IconLib; size: number; color: string }) {
  if (lib === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
  }
  return <Ionicons name={icon as any} size={size} color={color} />;
}

export default function PerfilScreen() {
  const profile              = useProfileStore(s => s.profile);
  const updateProfile        = useProfileStore(s => s.updateProfile);
  const uploadAvatar         = useProfileStore(s => s.uploadAvatar);
  const prefs                = usePrefsStore(s => s.prefs);
  const { update: updatePrefs } = usePrefsStore();
  const unlockedAchievements = useAchievementsStore(s => s.unlocked);
  const themeColor = prefs?.theme_color || COLORS.focus;
  
  // Equip badges integration
  const equippedBadge = useRewardsStore(s => s.equipped.badge);
  const activeBadgeItem = REWARDS.find(r => r.id === equippedBadge);

  // Additional stores for dynamic calculated stats
  const sessions = useSessionStore(s => s.sessions);
  const libraryItems = useLibraryStore(s => s.items);
  const progress = useProgressStore(s => s.all);

  const getSpentXP = () => {
    const owned = useRewardsStore.getState().owned;
    return owned.reduce((sum, rewardId) => {
      const rewardItem = REWARDS.find(r => r.id === rewardId);
      return sum + (rewardItem ? rewardItem.cost : 0);
    }, 0);
  };

  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [leagueExpanded, setLeagueExpanded] = useState(false);
  const [editBio,  setEditBio]    = useState('');
  const [uploading, setUploading] = useState(false);

  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [mascotModalVisible, setMascotModalVisible] = useState(false);
  const [diagnosticVisible, setDiagnosticVisible] = useState(false);

  // Interactive settings sheets visibility
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);
  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [accessModalVisible, setAccessModalVisible] = useState(false);
  const [proModalVisible, setProModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // Local edit states for Goals Modal
  const [goalMin, setGoalMin] = useState(15);
  const [goalXp, setGoalXp] = useState(200);
  const [goalEx, setGoalEx] = useState(3);

  // Local edit states for Preferences Modal
  const [prefWpm, setPrefWpm] = useState(280);
  const [prefFont, setPrefFont] = useState<'Lexend' | 'Nunito' | 'Georgia'>('Lexend');
  const [prefSize, setPrefSize] = useState(16);
  const [prefNotif, setPrefNotif] = useState(true);
  const [prefTime, setPrefTime] = useState('20:00');

  // Local edit states for Accessibility Modal
  const [aDyslexia, setADyslexia] = useState(false);
  const [aContrast, setAContrast] = useState(false);
  const [aMotion, setAMotion] = useState(false);

  // Sync state values when modal is displayed
  useEffect(() => {
    if (goalsModalVisible && prefs) {
      setGoalMin(prefs.daily_minutes_goal ?? 15);
      setGoalXp(prefs.daily_xp_goal ?? 200);
      setGoalEx(prefs.daily_exercises_goal ?? 3);
    }
  }, [goalsModalVisible, prefs]);

  useEffect(() => {
    if (prefsModalVisible && prefs) {
      setPrefWpm(prefs.wpm_default ?? 280);
      setPrefFont(prefs.font_family ?? 'Lexend');
      setPrefSize(prefs.font_size ?? 16);
      setPrefNotif(prefs.notifications_enabled ?? true);
      setPrefTime(prefs.notifications_time ?? '20:00');
    }
  }, [prefsModalVisible, prefs]);

  useEffect(() => {
    if (accessModalVisible && prefs) {
      setADyslexia(prefs.dyslexia_font ?? false);
      setAContrast(prefs.high_contrast ?? false);
      setAMotion(prefs.reduce_motion ?? false);
    }
  }, [accessModalVisible, prefs]);

  useEffect(() => {
    useSubscriptionStore.getState().initialize().catch(err => {
      console.warn('Failed to initialize subscription store:', err);
    });
  }, []);

  if (!profile) return null;

  // Real Calculated Stats
  const totalMinutes = Math.round(sessions.reduce((s, x) => s + (x.time_seconds || 0), 0) / 60);
  const wpmSessions = sessions.filter(s => s.wpm).map(s => s.wpm as number);
  const maxWpm = wpmSessions.length ? Math.round(Math.max(...wpmSessions)) : 0;
  const booksFinished = libraryItems.filter(b => b.progress >= 0.99).length;
  const progressValues = Object.values(progress);
  const masteryAvg = progressValues.length ? (progressValues.reduce((s, p) => s + (p?.mastery ?? 0), 0) / progressValues.length) : 0;

  const ACHIEVEMENTS: Achievement[] = [
    { id: 'streak7',    title: 'Racha 7',      icon: 'flame',           lib: 'Ionicons',              desc: '7 días seguidos', color: '#EF4444', cond: profile.streak >= 7 },
    { id: 'firstbook',  title: 'Primer libro', icon: 'library',         lib: 'Ionicons',              desc: 'Lee tu primer libro', color: '#3B82F6', cond: booksFinished >= 1 },
    { id: 'wpm300',     title: '300 WPM',      icon: 'flash',           lib: 'Ionicons',              desc: 'Alcanza 300 WPM', color: '#F97316', cond: maxWpm >= 300 },
    { id: 'loci',       title: 'Maestro Loci', icon: 'school',          lib: 'Ionicons',              desc: 'Completa método Loci', color: '#8B5CF6', cond: (progress.loci?.mastery ?? 0) >= 0.8 },
    { id: 'comp90',     title: '90% comp.',    icon: 'brain',           lib: 'MaterialCommunityIcons', desc: '90% comprensión', color: '#22C55E', cond: (progress.comprehension?.best_score ?? 0) >= 0.9 },
    { id: 'level10',    title: 'Nivel 10',     icon: 'trophy',          lib: 'Ionicons',              desc: 'Llega al nivel 10', color: '#D97706', cond: profile.level >= 10 },
    { id: 'sessions50', title: '50 sesiones',  icon: 'radio-button-on', lib: 'Ionicons',              desc: '50 ejercicios', color: '#EAB308', cond: sessions.length >= 50 },
    { id: 'schulte7',   title: 'Schulte 7×7',  icon: 'grid',            lib: 'Ionicons',              desc: 'Cuadrícula 7×7', color: '#16A34A', cond: (progress.schulte?.current_level ?? 0) >= 5 },
    { id: 'wpm500',     title: '500 WPM',      icon: 'rocket',          lib: 'Ionicons',              desc: 'Alcanza 500 WPM', color: '#DC2626', cond: maxWpm >= 500 },
  ];

  const handlePickAvatar = async () => {
    setAvatarMenuVisible(false);
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
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    const mime = asset.mimeType ?? 'image/jpeg';
    const url = await uploadAvatar(asset.uri, mime, asset.base64 ?? undefined);
    setUploading(false);
    if (!url && profile.id !== 'local') {
      Alert.alert('Error', 'No se pudo subir la foto. Verifica tu conexión.');
    }
  };

  const handleSelectMascot = async (key: MascotKey) => {
    await updateProfile({ avatar: key, avatar_url: undefined });
    setMascotModalVisible(false);
    setAvatarMenuVisible(false);
  };

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

  const handleSignOut = () => {
    const performSignOut = async () => {
      console.log('[Perfil] Starting signout sequence...');
      try {
        // 1. Reset all Zustand stores to pristine defaults in memory instantly
        console.log('[Perfil] Resetting Zustand stores...');
        useProfileStore.getState().reset();
        usePrefsStore.getState().reset();
        useRewardsStore.getState().reset();
        useAchievementsStore.getState().reset();
        useLibraryStore.getState().reset();
        useNodeStore.getState().reset();
        useProgressStore.getState().reset();
        useSessionStore.getState().reset();
        useSubscriptionStore.getState().reset();
        
        // 2. Clear AsyncStorage to guarantee clean slate
        console.log('[Perfil] Clearing local storage...');
        try {
          await AsyncStorage.clear();
          console.log('[Perfil] AsyncStorage cleared successfully.');
        } catch (e) {
          console.warn('[Perfil] AsyncStorage clear failed:', e);
        }
        
        // 3. Trigger supabase.auth.signOut() asynchronously
        console.log('[Perfil] Triggering Supabase auth signout...');
        supabase.auth.signOut().then(() => {
          console.log('[Perfil] Supabase signout completed successfully.');
        }).catch(e => {
          console.warn('[Perfil] Background Supabase signout failed/ignored:', e);
        });
      } catch (err) {
        console.error('[Perfil] Error during signout execution:', err);
      } finally {
        // 4. Redirect immediately to welcome screen (always run as fallback)
        console.log('[Perfil] Redirecting to welcome onboarding screen.');
        router.replace('/(auth)/welcome');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('¿Seguro que quieres salir?')) {
          performSignOut();
        }
      } else {
        performSignOut();
      }
    } else {
      Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: performSignOut }
      ]);
    }
  };

  const isGuest = profile.id === 'local';
  const isPremiumRC = useSubscriptionStore(s => s.isPremium);
  const isProfilePremium = useProfileStore(s => s.isPremium());
  const isPremium = isPremiumRC || isProfilePremium;

  const getLeagueInfo = (lvl: number) => {
    if (lvl >= 9) return { name: 'Liga Diamante', icon: 'diamond', color: '#06B6D4', colorBg: '#ECFEFF' };
    if (lvl >= 7) return { name: 'Liga Esmeralda', icon: 'shield-checkmark', color: '#10B981', colorBg: '#ECFDF5' };
    if (lvl >= 5) return { name: 'Liga Oro', icon: 'ribbon', color: '#EAB308', colorBg: '#FEFCE8' };
    if (lvl >= 3) return { name: 'Liga Plata', icon: 'shield', color: '#94A3B8', colorBg: '#F8FAFC' };
    return { name: 'Liga Bronce', icon: 'trophy', color: '#B45309', colorBg: '#FFFBEB' };
  };

  const getWeeklyXP = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sessions
      .filter(s => new Date(s.finished_at) >= oneWeekAgo)
      .reduce((sum, s) => sum + (s.xp_earned ?? 0), 0);
  };

  const weeklyXP = getWeeklyXP();
  const league = getLeagueInfo(profile.level);

  // Dynamic ranking of competitors
  const competitors = [
    { name: 'Camila', xp: 750, avatar: 'loci' as MascotKey, avatarUrl: null, isUser: false },
    { name: 'Carlos', xp: 620, avatar: 'swift' as MascotKey, avatarUrl: null, isUser: false },
    { name: profile.name || 'Tú', xp: weeklyXP, avatar: profile.avatar || 'focus', avatarUrl: profile.avatar_url, isUser: true },
    { name: 'Mateo', xp: 320, avatar: 'calm' as MascotKey, avatarUrl: null, isUser: false },
    { name: 'Sofía', xp: 210, avatar: 'memo' as MascotKey, avatarUrl: null, isUser: false },
  ].sort((a, b) => b.xp - a.xp);

  const userRank = competitors.findIndex(c => c.isUser) + 1;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { borderColor: themeColor + '40' }]}>
          <Pressable onPress={() => setAvatarMenuVisible(true)} style={[styles.avatarWrap, { backgroundColor: themeColor + '20' }]} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={themeColor} size="large" />
            ) : profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <MascotChar which={(profile.avatar as MascotKey) ?? 'focus'} size={80} expression="happy" />
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color={COLORS.muted} />
            </View>
          </Pressable>

          {editing ? (
            <View style={{ width: '100%', gap: 10, marginTop: 10 }}>
              <TextInput
                style={[styles.editInput, { borderColor: themeColor + '60' }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.subtle}
                maxLength={40}
              />
              <TextInput
                style={[styles.editInput, { height: 60, borderColor: themeColor + '60' }]}
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
                <Pressable onPress={saveEdit} style={[styles.editSaveBtn, { backgroundColor: themeColor }]}>
                  <Text style={styles.editSaveText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                <Text style={styles.name}>{profile.name}</Text>
                
                {isPremium && (
                  <View style={styles.heroProBadge}>
                    <Ionicons name="ribbon" size={12} color="#fff" />
                    <Text style={styles.heroProBadgeText}>PRO</Text>
                  </View>
                )}

                {activeBadgeItem && (
                  <View style={[styles.heroEquippedBadge, { backgroundColor: activeBadgeItem.color + '1A', borderColor: activeBadgeItem.color }]}>
                    <Ionicons name={activeBadgeItem.icon as any} size={12} color={activeBadgeItem.color} />
                    <Text style={[styles.heroEquippedBadgeText, { color: activeBadgeItem.color }]}>{activeBadgeItem.title}</Text>
                  </View>
                )}

                <Pressable onPress={startEdit} hitSlop={8}>
                  <Ionicons name="pencil" size={16} color={COLORS.muted} />
                </Pressable>
              </View>
              <Text style={styles.bio}>{profile.bio}</Text>
            </>
          )}

          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Nivel {profile.level}</Text>
            {profile.level >= 10 ? (
              <Text style={styles.levelXP}>¡Nivel Máximo alcanzado! 👑</Text>
            ) : (
              <Text style={styles.levelXP}>
                {xpForNextLevel(profile.xp + getSpentXP())} XP para Nivel {profile.level + 1}
              </Text>
            )}
          </View>
          <View style={{ marginTop: 8, width: '100%' }}>
            <ProgressBar 
              value={profile.level >= 10 ? 1 : levelProgress(profile.xp + getSpentXP())} 
              color={themeColor} 
              height={10} 
            />
          </View>
        </View>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#F97316', borderLeftWidth: 4 }]}>
            <View style={styles.statIconWrapLeft}>
              <Ionicons name="time" size={20} color="#F97316" />
            </View>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.statValue}>{totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: themeColor, borderLeftWidth: 4 }]}>
            <View style={styles.statIconWrapLeft}>
              <Ionicons name="speedometer" size={20} color={themeColor} />
            </View>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.statValue}>{maxWpm}</Text>
              <Text style={styles.statLabel}>WPM máx</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
            <View style={styles.statIconWrapLeft}>
              <Ionicons name="book" size={20} color="#3B82F6" />
            </View>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.statValue}>{booksFinished}</Text>
              <Text style={styles.statLabel}>Libros</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
            <View style={styles.statIconWrapLeft}>
              <MaterialCommunityIcons name="brain" size={20} color="#8B5CF6" />
            </View>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.statValue}>{Math.round(masteryAvg * 100)}%</Text>
              <Text style={styles.statLabel}>Maestría</Text>
            </View>
          </View>
        </View>

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <View style={[styles.sectionTitleRightBadge, { backgroundColor: themeColor + '15' }]}>
            <Text style={[styles.sectionTitleRightBadgeText, { color: themeColor }]}>
              {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id) || a.cond).length}/{ACHIEVEMENTS.length}
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsScroll}
          style={{ marginBottom: 20 }}
        >
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.includes(a.id) || a.cond;
            return (
              <View key={a.id} style={[styles.achievementCard, !unlocked && styles.achievementCardLocked, unlocked && { borderColor: themeColor + '30', shadowColor: themeColor }]}>
                <View style={[styles.achievementIconCircle, { backgroundColor: unlocked ? (a.color + '1A') : COLORS.surface }, !unlocked && { opacity: 0.6 }]}>
                  <AchIcon icon={unlocked ? a.icon : 'lock-closed'} lib={unlocked ? a.lib : 'Ionicons'} size={24} color={unlocked ? a.color : COLORS.subtle} />
                </View>
                <Text style={[styles.achievementCardTitle, !unlocked && { color: COLORS.subtle }]} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.achievementCardDesc}>{a.desc}</Text>
                {unlocked && (
                  <View style={styles.achievementCheckWrap}>
                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* ── Liga Competitiva Semanal ────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Liga Competitiva</Text>
          <View style={[styles.sectionTitleRightBadge, { backgroundColor: league.color + '15' }]}>
            <Text style={[styles.sectionTitleRightBadgeText, { color: league.color }]}>Semana Activa</Text>
          </View>
        </View>

        <View style={[styles.leagueCard, { borderColor: league.color + '25', shadowColor: league.color }]}>
          <Pressable 
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              setLeagueExpanded(!leagueExpanded);
            }}
            style={[styles.leagueHeader, { backgroundColor: league.color + '0E' }]}
          >
            <View style={[styles.leagueIconCircle, { backgroundColor: league.color + '18' }]}>
              <Ionicons name={league.icon as any} size={26} color={league.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.leagueName}>{league.name}</Text>
              <Text style={styles.leagueWeeklyXP}>{weeklyXP} XP acumulados esta semana</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.leagueTimerBadge}>
                <Ionicons name="time-outline" size={11} color={COLORS.muted} style={{ marginRight: 3 }} />
                <Text style={styles.leagueTimerText}>3d 12h</Text>
              </View>
              <Ionicons 
                name={leagueExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={league.color} 
              />
            </View>
          </Pressable>

          {leagueExpanded && (
            <>
              <View style={styles.leagueLeaderboard}>
                {competitors.map((comp, idx) => {
                  const rank = idx + 1;
                  return (
                    <View key={comp.name} style={[styles.leaderboardRow, comp.isUser && [styles.leaderboardRowUser, { borderColor: themeColor + '30' }]]}>
                      <Text style={styles.leaderboardRank}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                      </Text>
                      <View style={styles.leaderboardAvatarWrapper}>
                        {comp.avatarUrl ? (
                          <Image source={{ uri: comp.avatarUrl }} style={styles.leaderboardAvatarImg} />
                        ) : (
                          <MascotChar which={comp.avatar} size={24} breathing={false} blinking={false} />
                        )}
                      </View>
                      <Text style={[styles.leaderboardName, comp.isUser && [styles.leaderboardNameUser, { color: themeColor }]]}>
                        {comp.name}
                      </Text>
                      <Text style={styles.leaderboardXP}>{comp.xp} XP</Text>
                    </View>
                  );
                })}
              </View>

              {/* Promotion / Demotion Zone Indicator */}
              <View style={[
                styles.zoneIndicator,
                userRank <= 2 ? styles.zoneAscenso : userRank === 5 ? styles.zonePeligro : styles.zonePermanencia
              ]}>
                <Ionicons
                  name={userRank <= 2 ? 'rocket-outline' : userRank === 5 ? 'alert-circle-outline' : 'shield-checkmark-outline'}
                  size={15}
                  color={userRank <= 2 ? '#16A34A' : userRank === 5 ? '#DC2626' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.zoneIndicatorText,
                  userRank <= 2 ? { color: '#16A34A' } : userRank === 5 ? { color: '#DC2626' } : { color: '#4B5563' }
                ]}>
                  {userRank <= 2 ? 'Zona de Ascenso (Top 2) 🚀 ¡Vas rumbo a subir de liga!' :
                   userRank === 5 ? 'Zona de Descenso ⚠️ ¡Entrena más para conservar tu liga!' :
                   'Zona de Permanencia 🛡️ Mantienes tu puesto en la liga.'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.settingsCard}>
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => setGoalsModalVisible(true)}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: themeColor + '1A' }]}>
              <MaterialCommunityIcons name="target" size={18} color={themeColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>Meta diaria</Text>
              <Text style={styles.settingsSubtext}>
                {prefs.daily_minutes_goal ?? 15} min · {prefs.daily_xp_goal ?? 200} XP
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => setPrefsModalVisible(true)}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: '#F973161A' }]}>
              <Ionicons name="speedometer" size={18} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>Preferencias de lectura</Text>
              <Text style={styles.settingsSubtext}>
                {prefs.wpm_default ?? 280} WPM · {prefs.font_family ?? 'Lexend'} ({prefs.font_size ?? 16}px)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => setAccessModalVisible(true)}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: '#8B5CF61A' }]}>
              <Ionicons name="accessibility" size={18} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>Accesibilidad</Text>
              <Text style={styles.settingsSubtext}>
                {prefs.dyslexia_font || prefs.high_contrast || prefs.reduce_motion ? 'Personalizado' : 'Estándar'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => setProModalVisible(true)}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: '#EAB3081A' }]}>
              <Ionicons name="trophy" size={18} color="#EAB308" />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.settingsLabel}>Plan actual</Text>
              {isPremium && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.settingsValueRight, isPremium && { color: '#D97706', fontFamily: FONTS.heading }]}>
              {isPremium ? 'Premium' : 'Gratuito'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.settingsRow, { borderBottomWidth: 0 }, pressed && { backgroundColor: COLORS.surface }]}
            onPress={() => setAboutModalVisible(true)}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: '#6B72801A' }]}>
              <Ionicons name="information-circle" size={18} color="#6B7280" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>Acerca de LectorApp</Text>
              <Text style={styles.settingsSubtext}>v1.0.0 · Ver detalles</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
          </Pressable>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>{isGuest ? 'Salir (Volver al Inicio)' : 'Cerrar sesión'}</Text>
        </Pressable>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Modal: Avatar Menu ────────────────────────────────────────────── */}
      <Modal
        visible={avatarMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAvatarMenuVisible(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetKnob} />
              <Text style={styles.bottomSheetTitle}>Personalizar Avatar</Text>
              <Text style={styles.bottomSheetSubtitle}>Selecciona cómo quieres mostrarte en la plataforma</Text>
            </View>

            <View style={styles.bottomSheetOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.bottomSheetOptionBtn,
                  { backgroundColor: pressed ? COLORS.surface : '#fff' }
                ]}
                onPress={() => {
                  setAvatarMenuVisible(false);
                  setMascotModalVisible(true);
                }}
              >
                <View style={[styles.bottomSheetOptionIcon, { backgroundColor: themeColor + '12' }]}>
                  <Ionicons name="sparkles" size={20} color={themeColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bottomSheetOptionText}>Elegir Mascota LectorApp</Text>
                  <Text style={styles.bottomSheetOptionSubtext}>Usa uno de nuestros personajes guías premium</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.bottomSheetOptionBtn,
                  { backgroundColor: pressed ? COLORS.surface : '#fff' }
                ]}
                onPress={handlePickAvatar}
              >
                <View style={[styles.bottomSheetOptionIcon, { backgroundColor: COLORS.swift + '12' }]}>
                  <Ionicons name="image" size={20} color={COLORS.swift} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bottomSheetOptionText}>Subir Foto de Galería</Text>
                  <Text style={styles.bottomSheetOptionSubtext}>Elige una foto de perfil personalizada</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.bottomSheetCancelBtn,
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => setAvatarMenuVisible(false)}
            >
              <Text style={styles.bottomSheetCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: Mascot Carousel ────────────────────────────────────────── */}
      <Modal
        visible={mascotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMascotModalVisible(false)}
      >
        <View style={styles.fullscreenModalOverlay}>
          <View style={styles.mascotModalCard}>
            <View style={styles.mascotModalHeader}>
              <Text style={styles.mascotModalTitle}>Elige tu Mascota Guía</Text>
              <Pressable onPress={() => setMascotModalVisible(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mascotCarousel}
              snapToInterval={240}
              decelerationRate="fast"
            >
              {MASCOTS.map((m) => {
                const isSelected = profile.avatar === m.key && !profile.avatar_url;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => handleSelectMascot(m.key)}
                    style={[
                      styles.mascotCarouselCard,
                      { borderColor: isSelected ? m.color : COLORS.border },
                      isSelected && { backgroundColor: m.color + '05', borderWidth: 2 }
                    ]}
                  >
                    <View style={[styles.mascotCarouselCharWrap, { backgroundColor: m.color + '12' }]}>
                      <MascotChar which={m.key} size={88} breathing blinking />
                    </View>
                    <Text style={[styles.mascotCarouselName, { color: m.color }]}>{m.name}</Text>
                    <Text style={styles.mascotCarouselDesc}>{m.desc}</Text>
                    {isSelected && (
                      <View style={[styles.mascotSelectedBadge, { backgroundColor: m.color }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                        <Text style={styles.mascotSelectedText}>Activo</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            
            <Text style={styles.swipeTipText}>Desliza para explorar más personajes...</Text>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Diagnostic / Troubleshooting Guide ─────────────────────── */}
      <Modal
        visible={diagnosticVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiagnosticVisible(false)}
      >
        <View style={styles.fullscreenModalOverlay}>
          <View style={[styles.mascotModalCard, { maxWidth: 380, maxHeight: '80%' }]}>
            <View style={styles.mascotModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pulse" size={20} color={themeColor} />
                <Text style={styles.mascotModalTitle}>Soporte Expo / Metro</Text>
              </View>
              <Pressable onPress={() => setDiagnosticVisible(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <MascotChar which={(profile.avatar as MascotKey) ?? 'focus'} size={72} expression="happy" breathing blinking />
              </View>
              <Text style={styles.diagnosticIntro}>
                Si tienes problemas para conectar tu dispositivo físico (iOS o Android) al Metro bundler en tu PC, sigue esta guía técnica:
              </Text>

              <View style={styles.diagnosticStep}>
                <View style={[styles.diagnosticStepNum, { backgroundColor: COLORS.focus }]}>
                  <Text style={styles.diagnosticStepNumText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagnosticStepTitle}>Misma Red Wi-Fi</Text>
                  <Text style={styles.diagnosticStepDesc}>
                    Asegúrate de que tu celular y tu computadora estén conectados exactamente a la misma red de Wi-Fi local.
                  </Text>
                </View>
              </View>

              <View style={styles.diagnosticStep}>
                <View style={[styles.diagnosticStepNum, { backgroundColor: COLORS.calm }]}>
                  <Text style={styles.diagnosticStepNumText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagnosticStepTitle}>Iniciar en Modo Tunnel</Text>
                  <Text style={styles.diagnosticStepDesc}>
                    Si el router de tu casa tiene habilitado aislamiento inalámbrico (Wireless Client Isolation), inicia Expo usando el túnel externo de Ngrok:
                  </Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>npx expo start --tunnel</Text>
                  </View>
                </View>
              </View>

              <View style={styles.diagnosticStep}>
                <View style={[styles.diagnosticStepNum, { backgroundColor: COLORS.swift }]}>
                  <Text style={styles.diagnosticStepNumText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagnosticStepTitle}>Firewall de Windows</Text>
                  <Text style={styles.diagnosticStepDesc}>
                    Verifica que las reglas de entrada del Firewall de Windows permitan conexiones entrantes de "Node.js JavaScript Runtime" para redes privadas.
                  </Text>
                </View>
              </View>

              <View style={styles.diagnosticStep}>
                <View style={[styles.diagnosticStepNum, { backgroundColor: COLORS.loci }]}>
                  <Text style={styles.diagnosticStepNumText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagnosticStepTitle}>Evitar IPs Virtuales</Text>
                  <Text style={styles.diagnosticStepDesc}>
                    Si tienes activado Docker, VirtualBox o WSL, Metro puede publicar su red en un adaptador virtual inválido. Configura tu IP física real:
                  </Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>REACT_NATIVE_PACKAGER_HOSTNAME=tu-ip-local</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <Pressable
              style={({ pressed }) => [
                styles.diagnosticCloseBtn,
                { backgroundColor: themeColor },
                pressed && { opacity: 0.9 }
              ]}
              onPress={() => setDiagnosticVisible(false)}
            >
              <Text style={styles.diagnosticCloseText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Meta Diaria ───────────────────────────────────────────── */}
      <Modal
        visible={goalsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setGoalsModalVisible(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetKnob} />
              <Text style={styles.bottomSheetTitle}>Meta Diaria</Text>
              <Text style={styles.bottomSheetSubtitle}>Ajusta tus objetivos diarios de entrenamiento</Text>
            </View>

            <View style={{ gap: 14, marginBottom: 20 }}>
              <View>
                <Text style={styles.label}>Minutos al día</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalMin(prev => Math.max(5, prev - 5))}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.ink} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{goalMin} min</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalMin(prev => Math.min(60, prev + 5))}
                  >
                    <Ionicons name="add" size={18} color={COLORS.ink} />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={styles.label}>XP diaria</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalXp(prev => Math.max(50, prev - 50))}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.ink} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{goalXp} XP</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalXp(prev => Math.min(500, prev + 50))}
                  >
                    <Ionicons name="add" size={18} color={COLORS.ink} />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Ejercicios al día</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalEx(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.ink} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{goalEx} ejerc.</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setGoalEx(prev => Math.min(10, prev + 1))}
                  >
                    <Ionicons name="add" size={18} color={COLORS.ink} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={() => setGoalsModalVisible(false)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.editSaveBtn, { backgroundColor: themeColor }]}
                onPress={async () => {
                  await updatePrefs({
                    daily_minutes_goal: goalMin,
                    daily_xp_goal: goalXp,
                    daily_exercises_goal: goalEx,
                  });
                  setGoalsModalVisible(false);
                }}
              >
                <Text style={styles.editSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: Preferencias de Lectura ─────────────────────────────── */}
      <Modal
        visible={prefsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrefsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPrefsModalVisible(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetKnob} />
              <Text style={styles.bottomSheetTitle}>Preferencias</Text>
              <Text style={styles.bottomSheetSubtitle}>Personaliza tu experiencia de lectura</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350, marginBottom: 20 }}>
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.label}>WPM por defecto</Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPrefWpm(prev => Math.max(150, prev - 10))}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.ink} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{prefWpm} WPM</Text>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPrefWpm(prev => Math.min(800, prev + 10))}
                    >
                      <Ionicons name="add" size={18} color={COLORS.ink} />
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>Tipografía</Text>
                  <View style={styles.fontOptionGrid}>
                    {(['Lexend', 'Nunito', 'Georgia'] as const).map(f => {
                      const isActive = prefFont === f;
                      return (
                        <Pressable
                          key={f}
                          style={[styles.fontOptionBtn, isActive && styles.fontOptionBtnActive]}
                          onPress={() => setPrefFont(f)}
                        >
                          <Text style={[styles.fontOptionText, { fontFamily: f }, isActive && styles.fontOptionTextActive]}>
                            {f}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>Tamaño de letra</Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPrefSize(prev => Math.max(12, prev - 1))}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.ink} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{prefSize} px</Text>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPrefSize(prev => Math.min(24, prev + 1))}
                    >
                      <Ionicons name="add" size={18} color={COLORS.ink} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.toggleLabel}>Recordatorio Diario</Text>
                    <Text style={styles.settingsSubtext}>Recibe una alerta para tu entrenamiento</Text>
                  </View>
                  <Switch
                    value={prefNotif}
                    onValueChange={setPrefNotif}
                    trackColor={{ false: COLORS.border, true: themeColor }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                {prefNotif && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={styles.label}>Hora del recordatorio</Text>
                    <TextInput
                      style={[styles.editInput, { width: 100, textAlign: 'center', paddingVertical: 6 }]}
                      value={prefTime}
                      onChangeText={setPrefTime}
                      placeholder="20:00"
                      maxLength={5}
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={() => setPrefsModalVisible(false)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.editSaveBtn, { backgroundColor: themeColor }]}
                onPress={async () => {
                  await updatePrefs({
                    wpm_default: prefWpm,
                    font_family: prefFont,
                    font_size: prefSize,
                    notifications_enabled: prefNotif,
                    notifications_time: prefTime,
                  });
                  if (prefNotif) {
                    await scheduleDailyReminder(prefTime);
                  } else {
                    await cancelDailyReminder();
                  }
                  setPrefsModalVisible(false);
                }}
              >
                <Text style={styles.editSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: Accesibilidad ───────────────────────────────────────── */}
      <Modal
        visible={accessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccessModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAccessModalVisible(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetKnob} />
              <Text style={styles.bottomSheetTitle}>Accesibilidad</Text>
              <Text style={styles.bottomSheetSubtitle}>Opciones de visualización adaptativa</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 20 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleLabel}>Fuente para Dislexia</Text>
                  <Text style={styles.settingsSubtext}>Usa la tipografía adaptada OpenDyslexic</Text>
                </View>
                <Switch
                  value={aDyslexia}
                  onValueChange={setADyslexia}
                  trackColor={{ false: COLORS.border, true: themeColor }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleLabel}>Alto contraste</Text>
                  <Text style={styles.settingsSubtext}>Optimiza colores para mejor lectura</Text>
                </View>
                <Switch
                  value={aContrast}
                  onValueChange={setAContrast}
                  trackColor={{ false: COLORS.border, true: themeColor }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleLabel}>Reducir movimiento</Text>
                  <Text style={styles.settingsSubtext}>Desactiva animaciones de interfaz</Text>
                </View>
                <Switch
                  value={aMotion}
                  onValueChange={setAMotion}
                  trackColor={{ false: COLORS.border, true: themeColor }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={() => setAccessModalVisible(false)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.editSaveBtn, { backgroundColor: themeColor }]}
                onPress={async () => {
                  await updatePrefs({
                    dyslexia_font: aDyslexia,
                    high_contrast: aContrast,
                    reduce_motion: aMotion,
                  });
                  setAccessModalVisible(false);
                }}
              >
                <Text style={styles.editSaveText}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal: LectorApp PRO ───────────────────────────────────────── */}
      <PremiumPaywall
        visible={proModalVisible}
        onClose={() => setProModalVisible(false)}
      />

      {/* ── Modal: Acerca de LectorApp ─────────────────────────────────── */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAboutModalVisible(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetKnob} />
              <Text style={styles.bottomSheetTitle}>Acerca de LectorApp</Text>
              <Text style={styles.bottomSheetSubtitle}>Tu coach de neuro-aprendizaje digital</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, marginBottom: 20 }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <MascotChar which={(profile.avatar as MascotKey) ?? 'focus'} size={72} expression="happy" breathing blinking />
              </View>
              <View style={{ gap: 12 }}>
                <Text style={styles.aboutText}>
                  LectorApp es una plataforma interactiva diseñada en base a rigurosas investigaciones sobre neurociencia cognitiva y técnicas avanzadas de lectura veloz.
                </Text>
                <Text style={styles.aboutText}>
                  Mediante ejercicios adaptativos y gamificados como Schulte, Loci y Word Span, entrenamos tu percepción visual y memoria de trabajo para aumentar exponencialmente tu velocidad de lectura y nivel de comprensión.
                </Text>
                <Text style={[styles.aboutText, { fontFamily: FONTS.headingSemi }]}>
                  Versión: v1.0.0 (Beta)
                </Text>
                <Text style={styles.aboutText}>
                  Desarrollado para optimizar el rendimiento humano. Sincronización en la nube mediante Supabase habilitada.
                </Text>

                <Pressable
                  style={({ pressed }) => [styles.resetBtn, pressed && { backgroundColor: '#EF44441A' }]}
                  onPress={() => {
                    const performReset = async () => {
                      try {
                        // 1. Reset all 8 Zustand stores to pristine defaults in memory instantly
                        useProfileStore.getState().reset();
                        usePrefsStore.getState().reset();
                        useRewardsStore.getState().reset();
                        useAchievementsStore.getState().reset();
                        useLibraryStore.getState().reset();
                        useNodeStore.getState().reset();
                        useProgressStore.getState().reset();
                        useSessionStore.getState().reset();
                        
                        // 2. Clear AsyncStorage to guarantee clean slate
                        try {
                          await AsyncStorage.clear();
                        } catch (e) {
                          console.warn('AsyncStorage clear failed:', e);
                        }
                        
                        // 3. Trigger supabase.auth.signOut() asynchronously
                        supabase.auth.signOut().catch(e => {
                          console.warn('Background Supabase signout failed/ignored:', e);
                        });

                        if (Platform.OS === 'web') {
                          alert('Los datos locales han sido restaurados. Volviendo al inicio.');
                        } else {
                          Alert.alert('Completado', 'Los datos locales han sido restaurados. Volviendo al inicio.');
                        }
                      } catch (err) {
                        console.error('Error during local reset execution:', err);
                      } finally {
                        setAboutModalVisible(false);
                        router.replace('/(auth)/welcome');
                      }
                    };

                    if (Platform.OS === 'web') {
                      if (typeof window !== 'undefined' && window.confirm) {
                        if (window.confirm('¿Estás absolutamente seguro de que deseas restablecer la aplicación? Esto eliminará todo tu historial, racha y progresos de forma irreversible.')) {
                          performReset();
                        }
                      } else {
                        performReset();
                      }
                    } else {
                      Alert.alert(
                        'Restaurar Datos',
                        '¿Estás absolutamente seguro de que deseas restablecer la aplicación? Esto eliminará todo tu historial, racha y progresos de forma irreversible.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Restablecer', style: 'destructive', onPress: performReset }
                        ]
                      );
                    }
                  }}
                >
                  <Text style={styles.resetBtnText}>Restaurar datos locales</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.diagnosticCloseBtn,
                    { backgroundColor: themeColor + '15', borderWidth: 1.5, borderColor: themeColor, marginTop: 12, height: 44 },
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={() => {
                    setAboutModalVisible(false);
                    setDiagnosticVisible(true);
                  }}
                >
                  <Text style={[styles.diagnosticCloseText, { color: themeColor }]}>Guía de Diagnóstico Metro / Expo</Text>
                </Pressable>
              </View>
            </ScrollView>

            <Pressable
              style={styles.bottomSheetCancelBtn}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.bottomSheetCancelText}>Cerrar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.canvas },
  scroll:    { padding: 20 },

  hero:        { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.focus + '40', padding: 20, alignItems: 'center', marginBottom: 16 },
  avatarWrap:  { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.focus + '20', alignItems: 'center', justifyContent: 'center' },
  avatarImg:   { width: 88, height: 88, borderRadius: 44 },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  name:        { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  heroProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D97706', // Premium Golden color
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  heroProBadgeText: {
    fontFamily: FONTS.headingSemi, // Safe fallback style matching fontsLoaded
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.6,
  },
  heroEquippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroEquippedBadgeText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 9.5,
  },
  bio:         { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 4 },
  levelRow:    { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  levelLabel:  { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.ink },
  levelXP:     { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },

  editInput:      { fontFamily: FONTS.body, fontSize: 15, borderWidth: 1.5, borderColor: COLORS.focus + '60', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, color: COLORS.ink, backgroundColor: COLORS.surface },
  editCancelBtn:  { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  editCancelText: { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.muted },
  editSaveBtn:    { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.focus, alignItems: 'center' },
  editSaveText:   { fontFamily: FONTS.headingSemi, fontSize: 13, color: '#fff' },

  statsGrid:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, alignItems: 'center' },
  statIconRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue:    { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  statLabel:    { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  sectionTitle: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, marginBottom: 10 },

  achievementsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  achievementBadge:   { width: '30%', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.focus + '40', padding: 10, alignItems: 'center', gap: 4 },
  achievementLocked:  { borderColor: COLORS.border },
  achievementLabel:   { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.inkLight, textAlign: 'center' },
  achievementCheckWrap: { position: 'absolute', top: 6, right: 6 },

  settingsCard:   { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden' },
  settingsRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  settingsLabel:  { fontFamily: FONTS.body, fontSize: 15, color: COLORS.ink, flex: 1 },

  signOutBtn:  { marginTop: 4, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#EF4444', alignItems: 'center' },
  signOutText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: '#EF4444' },

  // Bottom Sheet Custom Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderWidth: 1.2,
    borderColor: COLORS.border,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetKnob: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.ink,
  },
  bottomSheetSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  bottomSheetOptions: {
    gap: 12,
    marginBottom: 20,
  },
  bottomSheetOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: 12,
  },
  bottomSheetOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetOptionText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.ink,
  },
  bottomSheetOptionSubtext: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subtle,
    marginTop: 1,
  },
  bottomSheetCancelBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetCancelText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.muted,
  },

  // Mascot Carousel Modal Styles
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mascotModalCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    alignItems: 'center',
  },
  mascotModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  mascotModalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.ink,
  },
  mascotCarousel: {
    paddingVertical: 10,
    gap: 16,
  },
  mascotCarouselCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
  mascotCarouselCharWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mascotCarouselName: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    marginBottom: 4,
  },
  mascotCarouselDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  mascotSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 10,
  },
  mascotSelectedText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: '#fff',
  },
  swipeTipText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.subtle,
    marginTop: 12,
  },

  // Diagnostic styles
  diagnosticOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.focus + '12',
  },
  diagnosticOpenText: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: COLORS.focus,
  },
  diagnosticIntro: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  diagnosticStep: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  diagnosticStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  diagnosticStepNumText: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: '#fff',
  },
  diagnosticStepTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 2,
  },
  diagnosticStepDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  },
  codeBlock: {
    backgroundColor: COLORS.canvas,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: COLORS.inkLight,
  },
  diagnosticCloseBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.focus,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  diagnosticCloseText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: '#fff',
  },

  // Additional Premium Custom Styles
  statIconWrapLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRightBadge: {
    backgroundColor: COLORS.focus + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sectionTitleRightBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.focus,
  },
  achievementsScroll: {
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 20,
    gap: 12,
  },
  achievementCard: {
    width: 125,
    height: 145,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.focus + '30',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: COLORS.focus,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  achievementCardLocked: {
    borderColor: COLORS.border,
    opacity: 0.5,
    backgroundColor: COLORS.surface,
  },
  achievementIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementCardTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: COLORS.ink,
    textAlign: 'center',
  },
  achievementCardDesc: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsSubtext: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  settingsValueRight: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: COLORS.muted,
    marginRight: 6,
  },
  proBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.ink,
  },
  fontOptionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  fontOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontOptionBtnActive: {
    borderColor: COLORS.focus,
    backgroundColor: COLORS.focus + '12',
  },
  fontOptionText: {
    fontSize: 13,
    color: COLORS.inkLight,
  },
  fontOptionTextActive: {
    color: COLORS.focus,
    fontFamily: FONTS.headingBold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  toggleLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  proGoldCard: {
    backgroundColor: '#D97706',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  proGoldTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: '#fff',
  },
  proGoldSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  proFeatureText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: COLORS.ink,
  },
  aboutText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.inkLight,
    lineHeight: 18,
    marginBottom: 10,
  },
  resetBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  resetBtnText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: '#EF4444',
  },
  leagueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginBottom: 14,
  },
  leagueIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueName: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.ink,
  },
  leagueWeeklyXP: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  leagueTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.canvas,
    borderRadius: 8,
  },
  leagueTimerText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 9,
    color: COLORS.muted,
  },
  leagueLeaderboard: {
    gap: 8,
    marginBottom: 14,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface + '20',
  },
  leaderboardRowUser: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
  },
  leaderboardRank: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: COLORS.muted,
    width: 28,
    textAlign: 'center',
  },
  leaderboardAvatarWrapper: {
    marginRight: 10,
  },
  leaderboardAvatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  leaderboardName: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    color: COLORS.inkLight,
    flex: 1,
  },
  leaderboardNameUser: {
    fontFamily: FONTS.headingBold,
  },
  leaderboardXP: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: COLORS.ink,
  },
  zoneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  zoneAscenso: {
    backgroundColor: '#DCFCE7',
  },
  zonePermanencia: {
    backgroundColor: '#F1F5F9',
  },
  zonePeligro: {
    backgroundColor: '#FEE2E2',
  },
  zoneIndicatorText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10.5,
    flex: 1,
  },
});
