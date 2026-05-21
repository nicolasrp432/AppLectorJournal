import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { ExerciseProgress, ExerciseId } from '../types/db';

type ProgressMap = Partial<Record<ExerciseId, ExerciseProgress>>;

const DEFAULT_PROGRESS: ProgressMap = {};

interface ProgressState {
  all: ProgressMap;
  get: (exId: ExerciseId) => ExerciseProgress;
  update: (exId: ExerciseId, patch: Partial<ExerciseProgress>) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;
  reset: () => void;
}

const EMPTY: ExerciseProgress = {
  user_id: 'local', exercise_id: 'schulte',
  current_level: 1, best_score: 0, last_score: 0, total_sessions: 0, mastery: 0, updated_at: '',
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      all: DEFAULT_PROGRESS,
      reset: () => set({ all: DEFAULT_PROGRESS }),

      get: (exId: ExerciseId) => get().all[exId] ?? { ...EMPTY, exercise_id: exId },

      update: async (exId: ExerciseId, patch: Partial<ExerciseProgress>) => {
        const current = get().all[exId] ?? { ...EMPTY, exercise_id: exId };
        const updated = { ...current, ...patch, updated_at: new Date().toISOString() };
        set(s => ({ all: { ...s.all, [exId]: updated } }));
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await supabase.from('exercise_progress').upsert({ ...updated, user_id: session.session.user.id });
        }
      },

      fetchAll: async (userId: string) => {
        const { data } = await supabase
          .from('exercise_progress')
          .select('*')
          .eq('user_id', userId);
        if (data) {
          const map: ProgressMap = {};
          for (const row of data) map[row.exercise_id as ExerciseId] = row as ExerciseProgress;
          set({ all: map });
        }
      },
    }),
    { name: 'lectorapp-progress', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
