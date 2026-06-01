import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { supabase } from '../lib/supabase';
import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';
import { usePrefsStore } from '../store/usePrefsStore';
import { useNodeStore } from '../store/useNodeStore';
import { useAchievementsStore } from '../store/useAchievementsStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { useRewardsStore } from '../store/useRewardsStore';
import { useSessionStore } from '../store/useSessionStore';
import { scheduleDailyReminder } from '../lib/notifications';
import { swr, TTL } from '../lib/cache';
import { runInBackground, flushMutations } from '../lib/taskQueue';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_700Bold,
  });

  const fetchProfile      = useProfileStore(s => s.fetchProfile);
  const fetchAll          = useProgressStore(s => s.fetchAll);
  const fetchPrefs        = usePrefsStore(s => s.fetchPrefs);
  const fetchCompleted    = useNodeStore(s => s.fetchCompleted);
  const fetchUnlocked     = useAchievementsStore(s => s.fetchUnlocked);
  const fetchLibrary      = useLibraryStore(s => s.fetchAll);
  const fetchOwned        = useRewardsStore(s => s.fetchOwned);
  const fetchRecent       = useSessionStore(s => s.fetchRecent);

  // Último usuario sincronizado: un cambio de cuenta fuerza re-sync completo.
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!fontsLoaded && Platform.OS !== 'web') return;
    SplashScreen.hideAsync().catch(() => {});

    // On mount: restore existing session, then listen for auth changes.
    // El primer login (o cambio de usuario) fuerza una sincronización completa;
    // las restauraciones de sesión y los refresh de token reutilizan la caché si
    // sigue fresca (stale-while-revalidate), evitando re-leer Supabase cada vez.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) syncUser(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      } else if (session) {
        // SIGNED_IN tras un login explícito fuerza el refresh; TOKEN_REFRESHED no.
        syncUser(session.user.id, { force: event === 'SIGNED_IN' });
        router.replace('/(tabs)/ruta');
      } else {
        router.replace('/(auth)/welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  async function syncUser(userId: string, opts: { force?: boolean } = {}) {
    // Si cambió el usuario respecto a la última sync, forzamos todo.
    const force = opts.force || lastSyncedUserId.current !== userId;
    lastSyncedUserId.current = userId;

    // Diferimos el trabajo de red para no competir con el primer render ni con la
    // animación de navegación. La UI ya está hidratada desde AsyncStorage.
    runInBackground(async () => {
      // Reintenta cualquier escritura que quedara pendiente (modo offline-first).
      flushMutations();

      // Cada dataset se revalida sólo si su TTL expiró. Las claves van namespaced
      // por usuario para que un cambio de cuenta nunca sirva datos de otra.
      await Promise.all([
        swr(`profile:${userId}`,    TTL.USER_DATA, () => fetchProfile(),         { force }),
        swr(`progress:${userId}`,   TTL.USER_DATA, () => fetchAll(userId),        { force }),
        swr(`prefs:${userId}`,      TTL.USER_DATA, () => fetchPrefs(userId),      { force }),
        swr(`nodes:${userId}`,      TTL.SLOW,      () => fetchCompleted(userId),  { force }),
        swr(`achievements:${userId}`, TTL.SLOW,    () => fetchUnlocked(userId),   { force }),
        swr(`library:${userId}`,    TTL.USER_DATA, () => fetchLibrary(userId),    { force }),
        swr(`rewards:${userId}`,    TTL.SLOW,      () => fetchOwned(userId),      { force }),
        swr(`sessions:${userId}`,   TTL.USER_DATA, () => fetchRecent(userId),     { force }),
      ]);

      // Schedule daily reminder using user's saved notification time
      const prefs = usePrefsStore.getState().prefs;
      if (prefs.notifications_enabled) {
        scheduleDailyReminder(prefs.notifications_time).catch(() => {});
      }
    });
  }

  // On web, @expo-google-fonts uses CSS @font-face which may never resolve
  // the JS promise — render immediately and let fonts swap in asynchronously.
  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="exercise"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reader"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
