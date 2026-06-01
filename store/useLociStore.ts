import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface LociMemoryItem {
  id: string;
  palace_id: string;
  room: string;
  item: string;
  story: string;
  image_url?: string;
}

export interface UserMemoryPalace {
  id: string;
  topic: string;
  theme: 'casa' | 'oficina' | 'naturaleza' | 'cuerpo' | 'mano' | 'custom';
  created_at: string;
  memories: LociMemoryItem[];
}

interface LociStoreState {
  palaces: UserMemoryPalace[];
  isLoading: boolean;

  fetchPalaces: () => Promise<void>;
  createPalace: (topic: string, theme: 'casa' | 'oficina' | 'naturaleza' | 'cuerpo' | 'mano' | 'custom', memories: Omit<LociMemoryItem, 'id' | 'palace_id'>[]) => Promise<UserMemoryPalace | null>;
  getPalace: (id: string) => UserMemoryPalace | undefined;
  deletePalace: (id: string) => Promise<void>;
  reset: () => void;
}

export const useLociStore = create<LociStoreState>()(
  persist(
    (set, get) => ({
      palaces: [],
      isLoading: false,
      reset: () => set({ palaces: [] }),

      getPalace: (id) => {
        return get().palaces.find(p => p.id === id);
      },

      fetchPalaces: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            set({ isLoading: false });
            return;
          }

          // Fetch palaces
          const { data: pData, error: pError } = await supabase
            .from('user_memory_palaces')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // guardrail

          if (pError) throw pError;

          if (pData) {
            // Fetch associated loci memories
            const { data: mData, error: mError } = await supabase
              .from('loci_memories')
              .select('*')
              .in('palace_id', pData.map(p => p.id))
              .limit(2000); // guardrail

            if (mError) throw mError;

            const formatted: UserMemoryPalace[] = pData.map(p => {
              const palaceMemories = (mData || [])
                .filter(m => m.palace_id === p.id)
                .map(m => ({
                  id: m.id,
                  palace_id: m.palace_id,
                  room: m.room,
                  item: m.item,
                  story: m.story,
                  image_url: m.image_url || undefined,
                }));

              return {
                id: p.id,
                topic: p.topic,
                theme: p.theme as any,
                created_at: p.created_at,
                memories: palaceMemories,
              };
            });

            set({ palaces: formatted });
          }
        } catch (err) {
          console.warn('Error fetching palaces from Supabase:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      createPalace: async (topic, theme, memories) => {
        const palaceId = `pal_${Date.now()}`;
        const newPalace: UserMemoryPalace = {
          id: palaceId,
          topic,
          theme,
          created_at: new Date().toISOString(),
          memories: memories.map((m, idx) => ({
            id: `mem_${Date.now()}_${idx}`,
            palace_id: palaceId,
            room: m.room,
            item: m.item,
            story: m.story,
            image_url: m.image_url,
          })),
        };

        // Save locally first
        set(state => ({
          palaces: [newPalace, ...state.palaces],
        }));

        // Sync with Supabase if online
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const userId = session.user.id;
            // 1. Insert palace
            const { data: pRes, error: pErr } = await supabase
              .from('user_memory_palaces')
              .insert({
                topic,
                theme,
                user_id: userId,
              })
              .select()
              .single();

            if (pErr) throw pErr;

            if (pRes) {
              const realPalaceId = pRes.id;
              
              // 2. Insert memories linked to the new palace_id
              const memoriesToInsert = memories.map(m => ({
                user_id: userId,
                palace_id: realPalaceId,
                room: m.room,
                item: m.item,
                story: m.story,
                image_url: m.image_url,
              }));

              const { data: mRes, error: mErr } = await supabase
                .from('loci_memories')
                .insert(memoriesToInsert)
                .select();

              if (mErr) throw mErr;

              if (mRes) {
                // Update local palace with real IDs from DB
                const dbMemories: LociMemoryItem[] = mRes.map(m => ({
                  id: m.id,
                  palace_id: realPalaceId,
                  room: m.room,
                  item: m.item,
                  story: m.story,
                  image_url: m.image_url || undefined,
                }));

                const dbPalace: UserMemoryPalace = {
                  id: realPalaceId,
                  topic,
                  theme,
                  created_at: pRes.created_at,
                  memories: dbMemories,
                };

                set(state => ({
                  palaces: state.palaces.map(p => p.id === palaceId ? dbPalace : p),
                }));

                return dbPalace;
              }
            }
          }
        } catch (err) {
          console.warn('Could not sync memory palace to Supabase, saved locally:', err);
        }

        return newPalace;
      },

      deletePalace: async (id) => {
        set(state => ({
          palaces: state.palaces.filter(p => p.id !== id),
        }));

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from('user_memory_palaces').delete().eq('id', id);
          }
        } catch (err) {
          console.warn('Error deleting palace from Supabase:', err);
        }
      },
    }),
    {
      name: 'lectorapp-loci-palaces',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
