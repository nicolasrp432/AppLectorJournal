import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getStarterPalace, isStarterPalaceId } from '../constants/lociStarterPalaces';
import { calculateSM2 } from '../lib/sm2';
import { isDue } from '../lib/loci';

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
  // Programación de repaso espaciado (SM-2). Opcionales: los palacios antiguos
  // o los de ejemplo no las traen y se tratan con valores por defecto.
  interval?: number;        // días hasta el próximo repaso
  repetitions?: number;     // repasos correctos consecutivos
  easeFactor?: number;      // factor de facilidad (EF)
  nextDue?: string;         // ISO; cuándo toca repasar
  lastReviewedAt?: string;  // ISO; último repaso
}

/** Valores de programación SM-2 por defecto (palacio nunca repasado). */
const DEFAULT_REVIEW = { interval: 0, repetitions: 0, easeFactor: 2.5 };

interface LociStoreState {
  palaces: UserMemoryPalace[];
  isLoading: boolean;

  fetchPalaces: () => Promise<void>;
  createPalace: (topic: string, theme: 'casa' | 'oficina' | 'naturaleza' | 'cuerpo' | 'mano' | 'custom', memories: Omit<LociMemoryItem, 'id' | 'palace_id'>[]) => Promise<UserMemoryPalace | null>;
  getPalace: (id: string) => UserMemoryPalace | undefined;
  deletePalace: (id: string) => Promise<void>;
  updateMemoryImage: (palaceId: string, memoryId: string, imageUrl: string) => Promise<void>;
  /** Programa el siguiente repaso del palacio con SM-2 a partir de la calidad [0,5]. */
  reviewPalace: (palaceId: string, quality: number) => Promise<void>;
  /** Palacios propios (no de ejemplo) cuyo repaso ya vence. */
  getDuePalaces: () => UserMemoryPalace[];
  reset: () => void;
}

export const useLociStore = create<LociStoreState>()(
  persist(
    (set, get) => ({
      palaces: [],
      isLoading: false,
      reset: () => set({ palaces: [] }),

      getPalace: (id) => {
        // Los palacios del usuario tienen prioridad; si no, se resuelve contra
        // los palacios de ejemplo pre-construidos (solo lectura).
        return get().palaces.find(p => p.id === id) ?? getStarterPalace(id);
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
                interval: p.interval ?? DEFAULT_REVIEW.interval,
                repetitions: p.repetitions ?? DEFAULT_REVIEW.repetitions,
                easeFactor: p.ease_factor ?? DEFAULT_REVIEW.easeFactor,
                nextDue: p.next_due ?? undefined,
                lastReviewedAt: p.last_reviewed_at ?? undefined,
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
          ...DEFAULT_REVIEW,
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
                  interval: pRes.interval ?? DEFAULT_REVIEW.interval,
                  repetitions: pRes.repetitions ?? DEFAULT_REVIEW.repetitions,
                  easeFactor: pRes.ease_factor ?? DEFAULT_REVIEW.easeFactor,
                  nextDue: pRes.next_due ?? undefined,
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

      // Persiste la imagen de UN locus (generación bajo demanda en el visor).
      updateMemoryImage: async (palaceId, memoryId, imageUrl) => {
        set(state => ({
          palaces: state.palaces.map(p => p.id === palaceId
            ? { ...p, memories: p.memories.map(m => m.id === memoryId ? { ...m, image_url: imageUrl } : m) }
            : p),
        }));
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from('loci_memories').update({ image_url: imageUrl }).eq('id', memoryId);
          }
        } catch (err) {
          console.warn('Could not persist loci image to Supabase:', err);
        }
      },

      // Programa el siguiente repaso del palacio con SM-2 (mismo motor que las
      // flashcards). Actualiza el estado local y persiste en Supabase, salvo en
      // palacios de ejemplo (solo lectura) o sin sesión.
      reviewPalace: async (palaceId, quality) => {
        const palace = get().palaces.find(p => p.id === palaceId);
        if (!palace) return; // los palacios de ejemplo no se programan.

        const { interval, repetitions, easeFactor, nextDue } = calculateSM2(
          quality,
          palace.interval ?? DEFAULT_REVIEW.interval,
          palace.repetitions ?? DEFAULT_REVIEW.repetitions,
          palace.easeFactor ?? DEFAULT_REVIEW.easeFactor,
        );
        const nextDueIso = nextDue.toISOString();
        const lastReviewedAt = new Date().toISOString();

        set(state => ({
          palaces: state.palaces.map(p => p.id === palaceId
            ? { ...p, interval, repetitions, easeFactor, nextDue: nextDueIso, lastReviewedAt }
            : p),
        }));

        if (isStarterPalaceId(palaceId) || palaceId.startsWith('pal_')) {
          return; // ejemplo o palacio aún no sincronizado con la BD.
        }
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase
              .from('user_memory_palaces')
              .update({
                interval,
                repetitions,
                ease_factor: easeFactor,
                next_due: nextDueIso,
                last_reviewed_at: lastReviewedAt,
              })
              .eq('id', palaceId);
          }
        } catch (err) {
          console.warn('Could not persist palace review to Supabase:', err);
        }
      },

      getDuePalaces: () => {
        const now = new Date();
        return get().palaces.filter(p => !isStarterPalaceId(p.id) && isDue(p.nextDue, now));
      },
    }),
    {
      name: 'lectorapp-loci-palaces',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
