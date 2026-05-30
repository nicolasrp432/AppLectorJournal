import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { xpToLevel } from '../lib/xpEngine';
import type { Profile, MascotKey } from '../types/db';
import { REWARDS } from '../constants/rewards';

function getSpentXP(): number {
  try {
    const rewardsStore = require('./useRewardsStore').useRewardsStore;
    const owned = rewardsStore.getState().owned;
    if (!owned) return 0;
    return owned.reduce((sum: number, rewardId: string) => {
      const rewardItem = REWARDS.find(r => r.id === rewardId);
      return sum + (rewardItem ? rewardItem.cost : 0);
    }, 0);
  } catch (err) {
    console.warn('Error calculating spent XP, returning 0:', err);
    return 0;
  }
}


interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  dailySessionsCount: number;
  fetchProfile: () => Promise<void>;
  addXP: (amount: number) => Promise<{ newXP: number; newLevel: number }>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  uploadAvatar: (uri: string, mimeType?: string, base64?: string) => Promise<string | null>;
  setProfileLocal: (profile: Profile) => void;
  reset: () => void;
  isPremium: () => boolean;
  fetchDailySessionsCount: () => Promise<void>;
  canStartSession: () => boolean;
  incrementSessionCountLocal: () => void;
}

const DEFAULT_PROFILE: Profile = {
  id: 'local',
  name: 'Nuevo Lector',
  email: null,
  avatar: 'focus' as MascotKey,
  bio: '',
  level: 1,
  xp: 0,
  streak: 0,
  last_active: null,
  created_at: new Date().toISOString(),
  subscription_tier: 'free',
  subscription_status: 'inactive',
};

// Pure JavaScript Base64 to ArrayBuffer decoder
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let i = 0;
  let p = 0;
  
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  for (i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)] ?? 0;
    const encoded2 = lookup[base64.charCodeAt(i + 1)] ?? 0;
    const encoded3 = lookup[base64.charCodeAt(i + 2)] ?? 0;
    const encoded4 = lookup[base64.charCodeAt(i + 3)] ?? 0;

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return arrayBuffer;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      isLoading: false,
      dailySessionsCount: 0,

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
        
        // Calculate new spendable XP
        const newXP = Math.max(0, current.xp + amount);
        
        // Calculate new level using lifetime XP (spendable + spent)
        // Level never decreases on shopping (when amount <= 0)
        let newLevel = current.level;
        if (amount > 0) {
          const spentXP = getSpentXP();
          const lifetimeXP = newXP + spentXP;
          newLevel = Math.min(10, xpToLevel(lifetimeXP));
        }

        const updated = { ...current, xp: newXP, level: newLevel };
        set({ profile: updated });
        
        if (current.id !== 'local') {
          await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', current.id);
        }
        return { newXP, newLevel };
      },

      updateProfile: async (patch: Partial<Profile>) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...patch };
        set({ profile: updated });
        if (current.id !== 'local') {
          await supabase.from('profiles').update(patch).eq('id', current.id);
        }
      },

      uploadAvatar: async (uri: string, mimeType = 'image/jpeg', base64?: string) => {
        const current = get().profile;
        if (!current) return null;
        if (current.id === 'local') {
          await get().updateProfile({ avatar_url: uri });
          return uri;
        }
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) return null;
        const userId = authData.session.user.id;
        const ext = mimeType.split('/')[1] ?? 'jpg';
        const path = `${userId}/avatar.${ext}`;
        try {
          let body: any;
          if (base64) {
            body = decodeBase64ToArrayBuffer(base64);
          } else {
            const res = await fetch(uri);
            body = await res.blob();
          }

          const { error } = await supabase.storage
            .from('avatars')
            .upload(path, body, { upsert: true, contentType: mimeType });
          if (error) {
            console.warn('Supabase storage upload failed, falling back to local path:', error);
            await get().updateProfile({ avatar_url: uri });
            return uri;
          }
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          const urlWithBust = `${publicUrl}?t=${Date.now()}`;
          await get().updateProfile({ avatar_url: urlWithBust });
          return urlWithBust;
        } catch (e) {
          console.warn('Catch error in uploadAvatar, falling back to local path:', e);
          await get().updateProfile({ avatar_url: uri });
          return uri;
        }
      },

      setProfileLocal: (profile: Profile) => set({ profile }),

      reset: () => set({ profile: DEFAULT_PROFILE, dailySessionsCount: 0 }),

      isPremium: () => {
        const p = get().profile;
        if (!p) return false;
        return p.subscription_tier === 'premium' || p.subscription_status === 'active';
      },

      fetchDailySessionsCount: async () => {
        const current = get().profile;
        if (!current || current.id === 'local') return;

        try {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const startOfDayISO = startOfDay.toISOString();

          const { data, error } = await supabase.rpc('get_user_daily_session_count', {
            p_user_id: current.id,
            p_start_of_day: startOfDayISO
          });

          if (!error && data !== null) {
            set({ dailySessionsCount: Number(data) });
          }
        } catch (err) {
          console.warn('Error fetching daily sessions count:', err);
        }
      },

      canStartSession: () => {
        const isPrem = get().isPremium();
        if (isPrem) return true;
        return get().dailySessionsCount < 3;
      },

      incrementSessionCountLocal: () => {
        set(state => ({ dailySessionsCount: state.dailySessionsCount + 1 }));
      },
    }),
    {
      name:    'lectorapp-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
