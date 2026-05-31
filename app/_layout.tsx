import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!fontsLoaded && Platform.OS !== 'web') return;
    SplashScreen.hideAsync().catch(() => {});

    // On mount: restore existing session, then listen for auth changes
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) syncUser(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      } else if (session) {
        syncUser(session.user.id);
        router.replace('/(tabs)/ruta');
      } else {
        router.replace('/(auth)/welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  async function syncUser(userId: string) {
    await Promise.all([
      fetchProfile(),
      fetchAll(userId),
      fetchPrefs(userId),
      fetchCompleted(userId),
      fetchUnlocked(userId),
      fetchLibrary(userId),
      fetchOwned(userId),
      fetchRecent(userId),
    ]);
    // Schedule daily reminder using user's saved notification time
    const prefs = usePrefsStore.getState().prefs;
    if (prefs.notifications_enabled) {
      scheduleDailyReminder(prefs.notifications_time).catch(() => {});
    }
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
