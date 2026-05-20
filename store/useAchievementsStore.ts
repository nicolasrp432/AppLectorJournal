import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { Profile, Session, LibraryItem, ExerciseProgress, ExerciseId } from '../types/db';

type ProgressMap = Partial<Record<ExerciseId, ExerciseProgress>>;

export interface AchievementContext {
  profile: Profile;
  sessions: Session[];
  progress: ProgressMap;
  library: LibraryItem[];
}

// Each condition returns true when the achievement is earned.
// schulte7 → level 5 in difficulty.ts = 7×7 Expert grid.
// sessions50 → sum of total_sessions across all exercises.
const CONDITIONS: Record<string, (ctx: AchievementContext) => boolean> = {
  streak7:    ({ profile }) => profile.streak >= 7,
  firstbook:  ({ library }) => library.some(b => b.progress >= 0.99),
  wpm300:     ({ sessions }) => sessions.some(s => (s.wpm ?? 0) >= 300),
  loci:       ({ sessions }) => sessions.some(s => s.exercise_id === 'loci' && s.score >= 0.8),
  comp90:     ({ sessions }) => sessions.some(s => (s.comprehension ?? 0) >= 0.9),
  level10:    ({ profile }) => profile.level >= 10,
  sessions50: ({ progress }) =>
    Object.values(progress).reduce((sum, p) => sum + (p?.total_sessions ?? 0), 0) >= 50,
  schulte7:   ({ progress }) => (progress.schulte?.current_level ?? 0) >= 5,
  wpm500:     ({ sessions }) => sessions.some(s => (s.wpm ?? 0) >= 500),
};

export const ACHIEVEMENT_IDS = Object.keys(CONDITIONS);

interface AchievementsState {
  unlocked: string[];
  newlyUnlocked: string[];
  clearNew: () => void;
  fetchUnlocked: (userId: string) => Promise<void>;
  checkAll: (ctx: AchievementContext) => Promise<string[]>;
  reset: () => void;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      newlyUnlocked: [],

      clearNew: () => set({ newlyUnlocked: [] }),
      reset: () => set({ unlocked: [], newlyUnlocked: [] }),

      fetchUnlocked: async (userId: string) => {
        const { data } = await supabase
          .from('owned_rewards')
          .select('reward_id')
          .eq('user_id', userId)
          .in('reward_id', ACHIEVEMENT_IDS);
        if (data) set({ unlocked: data.map(r => r.reward_id) });
      },

      checkAll: async (ctx: AchievementContext) => {
        const current = get().unlocked;
        const newOnes: string[] = [];

        for (const [id, condition] of Object.entries(CONDITIONS)) {
          if (!current.includes(id) && condition(ctx)) {
            newOnes.push(id);
          }
        }

        if (newOnes.length === 0) return [];

        set({ unlocked: [...current, ...newOnes], newlyUnlocked: newOnes });

        const { data: authData } = await supabase.auth.getSession();
        if (authData.session) {
          const uid = authData.session.user.id;
          await supabase.from('owned_rewards').upsert(
            newOnes.map(id => ({
              user_id: uid,
              reward_id: id,
              equipped: false,
              acquired_at: new Date().toISOString(),
            })),
          );
        }

        return newOnes;
      },
    }),
    { name: 'lectorapp-achievements', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
