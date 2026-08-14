import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { enqueueMutation } from '../lib/taskQueue';
import { xpToLevel } from '../lib/xpEngine';
import type { Profile, MascotKey } from '../types/db';
import { REWARDS } from '../constants/rewards';
import { LIVES_ENABLED, MAX_READING_LIVES, REFUND_COMPREHENSION_THRESHOLD } from '../constants/lives';
import { msToNextLife } from '../lib/lives';
import { isEntitled } from '../lib/premium';

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
  readingLives: number;
  nextLifeAt: string | null;
  fetchProfile: () => Promise<void>;
  addXP: (amount: number) => Promise<{ newXP: number; newLevel: number }>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  uploadAvatar: (uri: string, mimeType?: string, base64?: string) => Promise<string | null>;
  setProfileLocal: (profile: Profile) => void;
  reset: () => void;
  isPremium: () => boolean;
  refreshEntitlement: () => Promise<boolean>;
  fetchDailySessionsCount: () => Promise<void>;
  canStartSession: () => boolean;
  incrementSessionCountLocal: () => void;
  fetchReadingLives: () => Promise<void>;
  getAvailableReadingLives: () => number;
  canStartReading: () => boolean;
  consumeReadingLife: () => Promise<boolean>;
  refundReadingLifeIfQualified: (comprehension: number) => Promise<void>;
  timeToNextLife: () => number;
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
      readingLives: MAX_READING_LIVES,
      nextLifeAt: null,

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
          await enqueueMutation({
            table: 'profiles',
            type: 'update',
            payload: { xp: newXP, level: newLevel },
            match: { id: current.id },
          });
        }
        return { newXP, newLevel };
      },

      updateProfile: async (patch: Partial<Profile>) => {
        const current = get().profile;
        if (!current) return;
        const updated = { ...current, ...patch };
        set({ profile: updated });
        if (current.id !== 'local') {
          await enqueueMutation({
            table: 'profiles',
            type: 'update',
            payload: patch,
            match: { id: current.id },
          });
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

      reset: () => set({ profile: DEFAULT_PROFILE, dailySessionsCount: 0, readingLives: MAX_READING_LIVES, nextLifeAt: null }),

      isPremium: () => {
        const p = get().profile;
        if (!p) return false;
        // Exige tier + estado vigente + no caducado (ver lib/premium.ts). El OR
        // anterior concedía premium con una fila a medio actualizar y no miraba
        // nunca `subscription_expires_at`.
        return isEntitled({
          tier:      p.subscription_tier,
          status:    p.subscription_status,
          expiresAt: p.subscription_expires_at,
        });
      },

      /**
       * Relee el entitlement desde el servidor (`get_entitlement`), que es la
       * autoridad. El cliente ya no puede escribir las columnas de suscripción
       * (012_subscription_entitlements.sql), así que esta es la única vía de
       * refresco tras una compra o una caducidad.
       */
      refreshEntitlement: async () => {
        const current = get().profile;
        if (!current || current.id === 'local') return get().isPremium();
        try {
          const { data, error } = await supabase.rpc('get_entitlement');
          const row = Array.isArray(data) ? data[0] : data;
          if (error || !row) return get().isPremium();
          set({
            profile: {
              ...current,
              subscription_tier:       row.tier   ?? 'free',
              subscription_status:     row.status ?? 'inactive',
              subscription_expires_at: row.expires_at ?? null,
            },
          });
          return row.is_premium === true;
        } catch (err) {
          console.warn('Error refrescando el entitlement:', err);
          return get().isPremium();
        }
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

      // --- Vidas de lectura -------------------------------------------------

      fetchReadingLives: async () => {
        const current = get().profile;
        // Local o premium: se trata como vidas llenas (premium ignora el sistema).
        if (!current || current.id === 'local' || get().isPremium()) {
          set({ readingLives: MAX_READING_LIVES, nextLifeAt: null });
          return;
        }
        try {
          const { data, error } = await supabase.rpc('get_reading_lives');
          const row = Array.isArray(data) ? data[0] : data;
          if (!error && row) {
            set({ readingLives: Number(row.lives), nextLifeAt: row.next_regen_at ?? null });
          }
        } catch (err) {
          console.warn('Error fetching reading lives:', err);
        }
      },

      getAvailableReadingLives: () => {
        if (get().isPremium()) return MAX_READING_LIVES;
        return get().readingLives;
      },

      canStartReading: () => {
        if (!LIVES_ENABLED) return true;
        if (get().isPremium()) return true;
        return get().readingLives >= 1;
      },

      consumeReadingLife: async () => {
        const current = get().profile;
        // Sin coste para premium, flag apagado o usuario local.
        if (!LIVES_ENABLED || get().isPremium() || !current || current.id === 'local') {
          return true;
        }
        try {
          const { data, error } = await supabase.rpc('consume_reading_life');
          const row = Array.isArray(data) ? data[0] : data;
          if (error || !row) return false;
          set({ readingLives: Number(row.lives), nextLifeAt: row.next_regen_at ?? null });
          return row.ok === true;
        } catch (err) {
          console.warn('Error consuming reading life:', err);
          return false;
        }
      },

      refundReadingLifeIfQualified: async (comprehension: number) => {
        if (!LIVES_ENABLED || comprehension < REFUND_COMPREHENSION_THRESHOLD) return;
        const current = get().profile;
        if (get().isPremium() || !current || current.id === 'local') return;
        try {
          const { data, error } = await supabase.rpc('refund_reading_life');
          const row = Array.isArray(data) ? data[0] : data;
          if (!error && row) {
            set({ readingLives: Number(row.lives), nextLifeAt: row.next_regen_at ?? null });
          }
        } catch (err) {
          console.warn('Error refunding reading life:', err);
        }
      },

      timeToNextLife: () => msToNextLife(get().nextLifeAt),
    }),
    {
      name:    'lectorapp-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
