import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { xpToLevel } from '../lib/xpEngine';
import type { Profile, MascotKey } from '../types/db';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  addXP: (amount: number) => Promise<{ newXP: number; newLevel: number }>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  uploadAvatar: (uri: string, mimeType?: string) => Promise<string | null>;
  setProfileLocal: (profile: Profile) => void;
  reset: () => void;
}

const DEFAULT_PROFILE: Profile = {
  id: 'local',
  name: 'Sofía',
  email: null,
  avatar: 'focus' as MascotKey,
  bio: 'Aprendiendo a leer mejor cada día',
  level: 4,
  xp: 1240,
  streak: 7,
  last_active: null,
  created_at: new Date().toISOString(),
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      isLoading: false,

      fetchProfile: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .single();
        if (!error && data) set({ profile: data as Profile });
        set({ isLoading: false });
      },

      addXP: async (amount: number) => {
        const current = get().profile;
        if (!current) return { newXP: 0, newLevel: 1 };
        const newXP    = Math.max(0, current.xp + amount);
        const newLevel = xpToLevel(newXP);
        const updated  = { ...current, xp: newXP, level: newLevel };
        set({ profile: updated });
        await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', current.id);
        return { newXP, newLevel };
      },

      updateProfile: async (patch: Partial<Profile>) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...patch };
        set({ profile: updated });
        await supabase.from('profiles').update(patch).eq('id', current.id);
      },

      uploadAvatar: async (uri: string, mimeType = 'image/jpeg') => {
        const current = get().profile;
        if (!current || current.id === 'local') return null;
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) return null;
        const userId = authData.session.user.id;
        const ext = mimeType.split('/')[1] ?? 'jpg';
        const path = `${userId}/avatar.${ext}`;
        try {
          const res = await fetch(uri);
          const blob = await res.blob();
          const { error } = await supabase.storage
            .from('avatars')
            .upload(path, blob, { upsert: true, contentType: mimeType });
          if (error) return null;
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          const urlWithBust = `${publicUrl}?t=${Date.now()}`;
          await get().updateProfile({ avatar_url: urlWithBust });
          return urlWithBust;
        } catch {
          return null;
        }
      },

      setProfileLocal: (profile: Profile) => set({ profile }),

      reset: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name:    'lectorapp-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
