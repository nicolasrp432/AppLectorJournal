import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { LibraryItem } from '../types/db';

const DEFAULT_LIBRARY: LibraryItem[] = [
  { id: 'l1', user_id: 'local', kind: 'book',  title: 'El cerebro lector',          author: 'S. Dehaene',  content: null, words: 95000,  progress: 0.34, last_read_at: null, cover_color: '#3B82F6', source: 'catalog', created_at: '' },
  { id: 'l2', user_id: 'local', kind: 'book',  title: 'Atomic Habits',              author: 'J. Clear',    content: null, words: 70000,  progress: 0.78, last_read_at: null, cover_color: '#22C55E', source: 'catalog', created_at: '' },
  { id: 'l3', user_id: 'local', kind: 'book',  title: 'Sapiens',                    author: 'Y. N. Harari', content: null, words: 130000, progress: 0.12, last_read_at: null, cover_color: '#F97316', source: 'catalog', created_at: '' },
  { id: 'l4', user_id: 'local', kind: 'text',  title: 'Ensayo: Atención sostenida', author: 'Investigación 2024', content: null, words: 850, progress: 0, last_read_at: null, cover_color: '#8B5CF6', source: 'custom', created_at: '' },
];

interface LibraryState {
  items: LibraryItem[];
  list: () => LibraryItem[];
  get: (id: string) => LibraryItem | undefined;
  insert: (item: Omit<LibraryItem, 'id' | 'user_id' | 'created_at'>) => Promise<LibraryItem>;
  update: (id: string, patch: Partial<LibraryItem>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_LIBRARY,

      list: () => get().items,

      get: (id: string) => get().items.find(b => b.id === id),

      insert: async (item) => {
        const row: LibraryItem = {
          id: `l_${Date.now()}`,
          user_id: 'local',
          created_at: new Date().toISOString(),
          ...item,
        };
        set(s => ({ items: [row, ...s.items] }));
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await supabase.from('library_items').insert({ ...row, user_id: session.session.user.id });
        }
        return row;
      },

      update: async (id: string, patch: Partial<LibraryItem>) => {
        set(s => ({ items: s.items.map(b => b.id === id ? { ...b, ...patch } : b) }));
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await supabase.from('library_items').update(patch).eq('id', id);
        }
      },

      remove: async (id: string) => {
        set(s => ({ items: s.items.filter(b => b.id !== id) }));
        await supabase.from('library_items').delete().eq('id', id);
      },

      fetchAll: async (userId: string) => {
        const { data } = await supabase.from('library_items').select('*').eq('user_id', userId);
        if (data) set({ items: data as LibraryItem[] });
      },
    }),
    { name: 'lectorapp-library', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
