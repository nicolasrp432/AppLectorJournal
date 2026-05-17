import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { usePrefsStore } from './usePrefsStore';
import { useProfileStore } from './useProfileStore';
import { ACHIEVEMENT_IDS } from './useAchievementsStore';
import type { MascotKey } from '../types/db';

interface RewardsState {
  owned: string[];
  equipped: { theme: string; avatar: string };
  buy: (rewardId: string, cost: number, type: string, value?: string, mascot?: string) => void;
  equip: (rewardId: string, type: string, value?: string, mascot?: string) => void;
  fetchOwned: (userId: string) => Promise<void>;
  isOwned: (rewardId: string) => boolean;
  isEquipped: (rewardId: string) => boolean;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      owned:    ['theme-green', 'pkg-dyslexia', 'avatar-focus'],
      equipped: { theme: 'theme-green', avatar: 'avatar-focus' },

      buy: (rewardId, _cost, type, value, mascot) => {
        set(s => ({
          owned: s.owned.includes(rewardId) ? s.owned : [...s.owned, rewardId],
        }));
        get().equip(rewardId, type, value, mascot);
        supabase.auth.getSession().then(({ data: authData }) => {
          if (authData.session) {
            supabase.from('owned_rewards').upsert({
              user_id: authData.session.user.id,
              reward_id: rewardId,
              equipped: false,
              acquired_at: new Date().toISOString(),
            });
          }
        });
      },

      equip: (rewardId, type, value, mascot) => {
        if (type === 'theme') {
          set(s => ({ equipped: { ...s.equipped, theme: rewardId } }));
          if (value?.startsWith('#')) {
            usePrefsStore.getState().update({ theme_color: value });
          }
        } else if (type === 'avatar') {
          set(s => ({ equipped: { ...s.equipped, avatar: rewardId } }));
          if (mascot) {
            useProfileStore.getState().updateProfile({ avatar: mascot as MascotKey });
          }
        }
      },

      fetchOwned: async (userId: string) => {
        const { data } = await supabase
          .from('owned_rewards')
          .select('reward_id')
          .eq('user_id', userId);
        if (!data) return;
        const ownedIds = data
          .map((r: { reward_id: string }) => r.reward_id)
          .filter((id: string) => !ACHIEVEMENT_IDS.includes(id));
        if (ownedIds.length === 0) return;
        set(s => ({
          owned: [...new Set([...s.owned, ...ownedIds])],
        }));
      },

      isOwned:    (rewardId: string) => get().owned.includes(rewardId),
      isEquipped: (rewardId: string) =>
        get().equipped.theme === rewardId || get().equipped.avatar === rewardId,
    }),
    { name: 'lectorapp-rewards', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
