import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { usePrefsStore } from './usePrefsStore';
import { useProfileStore } from './useProfileStore';
import { ACHIEVEMENT_IDS } from './useAchievementsStore';
import { REWARDS } from '../constants/rewards';
import type { MascotKey } from '../types/db';

interface RewardsState {
  owned: string[];
  equipped: { theme: string; avatar: string; background?: string; badge?: string };
  buy: (rewardId: string, cost: number, type: string, value?: string, mascot?: string) => void;
  equip: (rewardId: string, type: string, value?: string, mascot?: string) => void;
  consume: (rewardId: string) => void;
  fetchOwned: (userId: string) => Promise<void>;
  isOwned: (rewardId: string) => boolean;
  isEquipped: (rewardId: string) => boolean;
  reset: () => void;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      owned:    ['theme-green', 'pkg-dyslexia', 'avatar-focus'],
      equipped: { theme: 'theme-green', avatar: 'avatar-focus', background: '', badge: '' },
      reset: () => set({ owned: ['theme-green', 'pkg-dyslexia', 'avatar-focus'], equipped: { theme: 'theme-green', avatar: 'avatar-focus', background: '', badge: '' } }),

      buy: (rewardId, _cost, type, value, mascot) => {
        set(s => ({
          owned: s.owned.includes(rewardId) ? s.owned : [...s.owned, rewardId],
        }));
        
        const isConsumable = rewardId.startsWith('pw-');
        if (!isConsumable) {
          get().equip(rewardId, type, value, mascot);
        } else {
          // Sync consumable buy to Supabase
          supabase.auth.getSession().then(({ data: authData }) => {
            if (authData.session) {
              supabase.from('owned_rewards').upsert({
                user_id: authData.session.user.id,
                reward_id: rewardId,
                equipped: false,
                acquired_at: new Date().toISOString(),
              }).then(({ error }) => {
                if (error) console.error('[useRewardsStore] Failed to upsert bought consumable in DB:', error);
              });
            }
          });
        }
      },

      equip: (rewardId, type, value, mascot) => {
        // Optimistic UI updates
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
        } else if (type === 'background') {
          set(s => ({ equipped: { ...s.equipped, background: rewardId } }));
        } else if (type === 'badge') {
          set(s => ({ equipped: { ...s.equipped, badge: rewardId } }));
        }

        // DB sync
        supabase.auth.getSession().then(({ data: authData }) => {
          if (authData.session) {
            const userId = authData.session.user.id;
            const rewardsOfType = REWARDS.filter(r => r.type === type).map(r => r.id);
            
            // 1. Reset equipped status for all items of this type in DB
            supabase.from('owned_rewards')
              .update({ equipped: false })
              .eq('user_id', userId)
              .in('reward_id', rewardsOfType)
              .then(({ error: resetErr }) => {
                if (resetErr) console.warn('[useRewardsStore] Reset equipped error:', resetErr);
                
                // 2. Set equipped = true for newly equipped reward
                supabase.from('owned_rewards')
                  .update({ equipped: true })
                  .eq('user_id', userId)
                  .eq('reward_id', rewardId)
                  .then(({ error: updateErr }) => {
                    if (updateErr) {
                      // If not present in DB (e.g. was local buy), upsert it as equipped
                      supabase.from('owned_rewards').upsert({
                        user_id: userId,
                        reward_id: rewardId,
                        equipped: true,
                        acquired_at: new Date().toISOString(),
                      }).then(({ error: upsertErr }) => {
                        if (upsertErr) console.error('[useRewardsStore] Sync equipped failed:', upsertErr);
                      });
                    }
                  });
              });
          }
        });
      },

      consume: (rewardId) => {
        set(s => ({
          owned: s.owned.filter(id => id !== rewardId),
        }));
        
        supabase.auth.getSession().then(({ data: authData }) => {
          if (authData.session) {
            supabase
              .from('owned_rewards')
              .delete()
              .eq('user_id', authData.session.user.id)
              .eq('reward_id', rewardId)
              .then(({ error }) => {
                if (error) console.warn('Failed to delete consumed reward in DB:', error);
              });
          }
        });
      },

      fetchOwned: async (userId: string) => {
        const { data, error } = await supabase
          .from('owned_rewards')
          .select('reward_id, equipped')
          .eq('user_id', userId);
          
        if (error || !data) {
          if (error) console.warn('[useRewardsStore] fetchOwned error:', error);
          return;
        }

        const ownedIds = data
          .map((r: { reward_id: string }) => r.reward_id)
          .filter((id: string) => !ACHIEVEMENT_IDS.includes(id));
          
        // Find if any items are active (equipped) in Supabase and restore them
        const equippedTheme = data.find(r => r.equipped && r.reward_id.startsWith('theme-'))?.reward_id;
        const equippedAvatar = data.find(r => r.equipped && r.reward_id.startsWith('avatar-'))?.reward_id;
        const equippedBackground = data.find(r => r.equipped && r.reward_id.startsWith('bg-'))?.reward_id;
        const equippedBadge = data.find(r => r.equipped && r.reward_id.startsWith('badge-'))?.reward_id;

        set(s => {
          const newEquipped = { ...s.equipped };
          if (equippedTheme) newEquipped.theme = equippedTheme;
          if (equippedAvatar) newEquipped.avatar = equippedAvatar;
          if (equippedBackground) newEquipped.background = equippedBackground;
          if (equippedBadge) newEquipped.badge = equippedBadge;

          return {
            owned: [...new Set([...s.owned, ...ownedIds])],
            equipped: newEquipped
          };
        });
      },

      isOwned:    (rewardId: string) => get().owned.includes(rewardId),
      isEquipped: (rewardId: string) =>
        get().equipped.theme === rewardId ||
        get().equipped.avatar === rewardId ||
        get().equipped.background === rewardId ||
        get().equipped.badge === rewardId,
    }),
    { name: 'lectorapp-rewards', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
