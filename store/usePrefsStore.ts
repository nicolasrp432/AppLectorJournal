import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { enqueueMutation } from '../lib/taskQueue';
import type { UserPrefs } from '../types/db';

const DEFAULT_PREFS: UserPrefs = {
  user_id:              'local',
  wpm_default:          280,
  font_family:          'Lexend',
  font_size:            16,
  theme_color:          '#22C55E',
  dyslexia_font:        false,
  high_contrast:        false,
  reduce_motion:        false,
  daily_xp_goal:        200,
  daily_minutes_goal:   15,
  daily_exercises_goal: 3,
  notifications_enabled: true,
  notifications_time:   '20:00',
  updated_at:           '',
  loci_palace:          'casa',
};

interface PrefsState {
  prefs: UserPrefs;
  update: (patch: Partial<UserPrefs>) => Promise<void>;
  fetchPrefs: (userId: string) => Promise<void>;
  reset: () => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      prefs: DEFAULT_PREFS,

      update: async (patch: Partial<UserPrefs>) => {
        const updated = { ...get().prefs, ...patch, updated_at: new Date().toISOString() };
        set({ prefs: updated });
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await enqueueMutation({
            table: 'user_prefs',
            type: 'upsert',
            payload: { ...updated, user_id: session.session.user.id },
          });
        }
      },

      fetchPrefs: async (userId: string) => {
        const { data } = await supabase.from('user_prefs').select('*').eq('user_id', userId).single();
        if (data) set({ prefs: data as UserPrefs });
      },

      reset: () => set({ prefs: DEFAULT_PREFS }),
    }),
    { name: 'lectorapp-prefs', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
