import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { ExerciseProgress, ExerciseId } from '../types/db';

type ProgressMap = Partial<Record<ExerciseId, ExerciseProgress>>;

const DEFAULT_PROGRESS: ProgressMap = {
  schulte:     { user_id: 'local', exercise_id: 'schulte',     current_level: 3, best_score: 0.92, last_score: 0.85, total_sessions: 18, mastery: 0.78, updated_at: '' },
  reading:     { user_id: 'local', exercise_id: 'reading',     current_level: 4, best_score: 0.88, last_score: 0.81, total_sessions: 22, mastery: 0.82, updated_at: '' },
  wordspan:    { user_id: 'local', exercise_id: 'wordspan',    current_level: 2, best_score: 0.80, last_score: 0.66, total_sessions: 12, mastery: 0.55, updated_at: '' },
  loci:        { user_id: 'local', exercise_id: 'loci',        current_level: 1, best_score: 1.00, last_score: 1.00, total_sessions: 6,  mastery: 0.45, updated_at: '' },
  comprehension:{ user_id: 'local', exercise_id: 'comprehension', current_level: 3, best_score: 1.00, last_score: 0.66, total_sessions: 14, mastery: 0.70, updated_at: '' },
  boss:        { user_id: 'local', exercise_id: 'boss',        current_level: 1, best_score: 0.85, last_score: 0.85, total_sessions: 2,  mastery: 0.40, updated_at: '' },
};

interface ProgressState {
  all: ProgressMap;
  get: (exId: ExerciseId) => ExerciseProgress;
  update: (exId: ExerciseId, patch: Partial<ExerciseProgress>) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;
}

const EMPTY: ExerciseProgress = {
  user_id: 'local', exercise_id: 'schulte',
  current_level: 1, best_score: 0, last_score: 0, total_sessions: 0, mastery: 0, updated_at: '',
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      all: DEFAULT_PROGRESS,

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
