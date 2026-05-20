import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { Session, ExerciseId } from '../types/db';

interface SessionFilter {
  exercise_id?: ExerciseId;
  since?: number;
  until?: number;
  limit?: number;
}

interface SessionState {
  sessions: Session[];
  list: (filter?: SessionFilter) => Session[];
  insert: (sess: Omit<Session, 'id' | 'user_id'>) => Promise<Session>;
  fetchRecent: (userId: string, limit?: number) => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      reset: () => set({ sessions: [] }),

      list: (filter?: SessionFilter) => {
        let s = [...get().sessions];
        if (filter?.exercise_id) s = s.filter(x => x.exercise_id === filter.exercise_id);
        if (filter?.since)       s = s.filter(x => new Date(x.finished_at).getTime() >= filter.since!);
        if (filter?.until)       s = s.filter(x => new Date(x.finished_at).getTime() <  filter.until!);
        s.sort((a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
        return filter?.limit ? s.slice(0, filter.limit) : s;
      },

      insert: async (sess) => {
        const row: Session = { id: `s_${Date.now()}`, user_id: 'local', ...sess };
        set(s => {
          const next = [row, ...s.sessions];
          if (next.length > 200) next.length = 200;
          return { sessions: next };
        });
        const { data: authSession } = await supabase.auth.getSession();
        if (authSession.session) {
          await supabase.from('sessions').insert({ ...row, user_id: authSession.session.user.id });
        }
        return row;
      },

      fetchRecent: async (userId: string, limit = 50) => {
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('finished_at', { ascending: false })
          .limit(limit);
        if (data) set({ sessions: data as Session[] });
      },
    }),
    { name: 'lectorapp-sessions', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
