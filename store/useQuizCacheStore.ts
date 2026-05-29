import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
}

export interface CachedQuiz {
  id?: string;
  library_item_id: string;
  text_slice_hash: string;
  questions: QuizQuestion[];
  created_at: string;
}

interface QuizCacheState {
  quizzes: Record<string, CachedQuiz[]>; // library_item_id -> CachedQuiz[]
  
  getQuiz: (libraryItemId: string, textSliceHash: string) => CachedQuiz | undefined;
  insertQuiz: (libraryItemId: string, textSliceHash: string, questions: QuizQuestion[]) => Promise<CachedQuiz>;
  fetchQuizzes: (libraryItemId: string) => Promise<void>;
  reset: () => void;
}

export const useQuizCacheStore = create<QuizCacheState>()(
  persist(
    (set, get) => ({
      quizzes: {},
      reset: () => set({ quizzes: {} }),

      getQuiz: (libraryItemId, textSliceHash) => {
        const list = get().quizzes[libraryItemId] || [];
        return list.find(q => q.text_slice_hash === textSliceHash);
      },

      insertQuiz: async (libraryItemId, textSliceHash, questions) => {
        const newQuiz: CachedQuiz = {
          library_item_id: libraryItemId,
          text_slice_hash: textSliceHash,
          questions,
          created_at: new Date().toISOString(),
        };

        // Update locally
        set(state => {
          const list = state.quizzes[libraryItemId] || [];
          // Avoid duplicate hashes
          const filtered = list.filter(q => q.text_slice_hash !== textSliceHash);
          return {
            quizzes: {
              ...state.quizzes,
              [libraryItemId]: [...filtered, newQuiz],
            }
          };
        });

        // Sync with Supabase if online/session active
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          try {
            await supabase.from('custom_reading_quizzes').insert({
              library_item_id: libraryItemId,
              text_slice_hash: textSliceHash,
              questions,
            });
          } catch (err) {
            console.warn('Supabase quiz caching failed, saved locally:', err);
          }
        }

        return newQuiz;
      },

      fetchQuizzes: async (libraryItemId) => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        try {
          const { data, error } = await supabase
            .from('custom_reading_quizzes')
            .select('*')
            .eq('library_item_id', libraryItemId);

          if (!error && data) {
            const formatted = data.map(q => ({
              id: q.id,
              library_item_id: q.library_item_id,
              text_slice_hash: q.text_slice_hash,
              questions: q.questions as QuizQuestion[],
              created_at: q.created_at,
            }));

            set(state => ({
              quizzes: {
                ...state.quizzes,
                [libraryItemId]: formatted,
              }
            }));
          }
        } catch (err) {
          console.warn('Error fetching quizzes from Supabase:', err);
        }
      },
    }),
    {
      name: 'lectorapp-quiz-cache',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
