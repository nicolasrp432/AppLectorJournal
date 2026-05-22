import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { calculateSM2 } from '../lib/sm2';
import { useProfileStore } from './useProfileStore';
import { useSessionStore } from './useSessionStore';
import type { Deck, Flashcard } from '../types/db';

interface FlashcardState {
  decks: Deck[];
  flashcards: Record<string, Flashcard[]>; // deck_id -> Flashcard[]
  isLoading: boolean;

  fetchDecks: () => Promise<void>;
  fetchCards: (deckId: string) => Promise<void>;
  
  createDeck: (name: string, description: string, color: string, isAIGenerated?: boolean) => Promise<Deck | null>;
  deleteDeck: (deckId: string) => Promise<void>;
  
  createFlashcard: (deckId: string, front: string, back: string, hint?: string) => Promise<Flashcard | null>;
  deleteFlashcard: (deckId: string, cardId: string) => Promise<void>;
  
  updateFlashcardReview: (deckId: string, cardId: string, quality: number) => Promise<void>;
  finishSession: (deckId: string, cardsReviewed: number) => Promise<number>; // returns XP earned
  
  reset: () => void;
}

const STARTER_DECKS: Deck[] = [
  {
    id: 'deck-starter-reading',
    user_id: 'local',
    name: '📚 Técnicas de Lectura Rápida',
    description: 'Aprende los fundamentos del neuro-aprendizaje y técnicas RSVP.',
    color: '#3B82F6',
    is_ai_generated: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'deck-starter-memory',
    user_id: 'local',
    name: '🧠 Palacio de Memoria',
    description: 'Domina los casilleros de loci, asociaciones visuales absurdas y más.',
    color: '#8B5CF6',
    is_ai_generated: false,
    created_at: new Date().toISOString(),
  }
];

const STARTER_CARDS: Record<string, Flashcard[]> = {
  'deck-starter-reading': [
    {
      id: 'card-r1',
      deck_id: 'deck-starter-reading',
      front: '¿Qué es la regresión en lectura?',
      back: 'El hábito inconsciente de releer palabras o frases previas, reduciendo drásticamente la velocidad lectora.',
      hint: 'Hábito visual común',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'card-r2',
      deck_id: 'deck-starter-reading',
      front: '¿Qué significa RSVP?',
      back: 'Rapid Serial Visual Presentation. Mostrar palabras individualmente en una pantalla a alta velocidad.',
      hint: 'Lectura Focalizada',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'card-r3',
      deck_id: 'deck-starter-reading',
      front: '¿Cómo ayuda el Schulte Grid?',
      back: 'Expande el campo visual periférico para capturar múltiples palabras a la vez sin mover los ojos.',
      hint: 'Entrenamiento ocular',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  ],
  'deck-starter-memory': [
    {
      id: 'card-m1',
      deck_id: 'deck-starter-memory',
      front: '¿Qué es un Locus?',
      back: 'Un lugar o punto geográfico específico dentro de tu palacio mental donde anclas un recuerdo.',
      hint: 'Unidad de almacenamiento',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'card-m2',
      deck_id: 'deck-starter-memory',
      front: '¿Qué es la Ley del Efecto Absurdo?',
      back: 'Los recuerdos son mucho más fáciles de retener si las imágenes mentales creadas son cómicas, gigantes o físicamente imposibles.',
      hint: 'Creatividad mnemónica',
      interval: 0,
      repetitions: 0,
      ease_factor: 2.5,
      next_due: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  ]
};

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: STARTER_DECKS,
      flashcards: STARTER_CARDS,
      isLoading: false,

      fetchDecks: async () => {
        const profile = useProfileStore.getState().profile;
        if (!profile || profile.id === 'local') {
          // If local, keep default or offline decks
          if (get().decks.length === 0) {
            set({ decks: STARTER_DECKS });
          }
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('decks')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            // Merge local starter decks with Supabase decks if desired
            const remoteDecks = data.map(d => ({
              id: d.id,
              user_id: d.user_id,
              name: d.name,
              description: d.description,
              color: d.color,
              is_ai_generated: d.is_ai_generated,
              created_at: d.created_at
            }));
            
            set({ decks: [...STARTER_DECKS, ...remoteDecks] });
          }
        } catch (err) {
          console.warn('Error fetching decks from Supabase:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCards: async (deckId: string) => {
        // Skip for starter decks
        if (deckId.startsWith('deck-starter-')) return;

        // If local profile or local deck, avoid Supabase and initialize local array
        const profile = useProfileStore.getState().profile;
        if (!profile || profile.id === 'local' || deckId.startsWith('deck-local-')) {
          set(state => ({
            flashcards: {
              ...state.flashcards,
              [deckId]: state.flashcards[deckId] || [],
            }
          }));
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('deck_id', deckId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            const cards = data.map(c => ({
              id: c.id,
              deck_id: c.deck_id,
              front: c.front,
              back: c.back,
              hint: c.hint,
              interval: c.interval,
              repetitions: c.repetitions,
              ease_factor: c.ease_factor,
              next_due: c.next_due,
              created_at: c.created_at
            }));

            set(state => ({
              flashcards: {
                ...state.flashcards,
                [deckId]: cards,
              }
            }));
          } else {
            // Fallback to empty array if error to prevent undefined stuck states
            set(state => ({
              flashcards: {
                ...state.flashcards,
                [deckId]: state.flashcards[deckId] || [],
              }
            }));
          }
        } catch (err) {
          console.warn('Error fetching flashcards from Supabase:', err);
          set(state => ({
            flashcards: {
              ...state.flashcards,
              [deckId]: state.flashcards[deckId] || [],
            }
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      createDeck: async (name, description, color, isAIGenerated = false) => {
        const profile = useProfileStore.getState().profile;
        const localId = 'deck-local-' + Math.random().toString(36).substring(2, 9);
        const newDeck: Deck = {
          id: localId,
          user_id: profile?.id ?? 'local',
          name,
          description,
          color,
          is_ai_generated: isAIGenerated,
          created_at: new Date().toISOString(),
        };

        // Add to local state
        set(state => ({
          decks: [newDeck, ...state.decks],
          flashcards: { ...state.flashcards, [localId]: [] }
        }));

        if (profile && profile.id !== 'local') {
          // Push to Supabase
          const { data, error } = await supabase
            .from('decks')
            .insert({
              name,
              description,
              color,
              is_ai_generated: isAIGenerated,
              user_id: profile.id
            })
            .select()
            .single();

          if (!error && data) {
            // Replace local ID with DB ID
            const dbDeck: Deck = {
              id: data.id,
              user_id: data.user_id,
              name: data.name,
              description: data.description,
              color: data.color,
              is_ai_generated: data.is_ai_generated,
              created_at: data.created_at
            };

            set(state => ({
              decks: state.decks.map(d => d.id === localId ? dbDeck : d),
              flashcards: {
                ...state.flashcards,
                [data.id]: state.flashcards[localId] || [],
              }
            }));
            
            // Delete temp key
            const updatedFC = { ...get().flashcards };
            delete updatedFC[localId];
            set({ flashcards: updatedFC });

            return dbDeck;
          }
        }

        return newDeck;
      },

      deleteDeck: async (deckId: string) => {
        set(state => ({
          decks: state.decks.filter(d => d.id !== deckId),
        }));

        const profile = useProfileStore.getState().profile;
        if (profile && profile.id !== 'local' && !deckId.startsWith('deck-starter-')) {
          await supabase.from('decks').delete().eq('id', deckId);
        }
      },

      createFlashcard: async (deckId, front, back, hint = '') => {
        const localId = 'card-local-' + Math.random().toString(36).substring(2, 9);
        const newCard: Flashcard = {
          id: localId,
          deck_id: deckId,
          front,
          back,
          hint,
          interval: 0,
          repetitions: 0,
          ease_factor: 2.5,
          next_due: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        set(state => ({
          flashcards: {
            ...state.flashcards,
            [deckId]: [...(state.flashcards[deckId] || []), newCard]
          }
        }));

        const profile = useProfileStore.getState().profile;
        if (profile && profile.id !== 'local' && !deckId.startsWith('deck-starter-')) {
          const { data, error } = await supabase
            .from('flashcards')
            .insert({
              deck_id: deckId,
              front,
              back,
              hint,
            })
            .select()
            .single();

          if (!error && data) {
            const dbCard: Flashcard = {
              id: data.id,
              deck_id: data.deck_id,
              front: data.front,
              back: data.back,
              hint: data.hint,
              interval: data.interval,
              repetitions: data.repetitions,
              ease_factor: data.ease_factor,
              next_due: data.next_due,
              created_at: data.created_at
            };

            set(state => ({
              flashcards: {
                ...state.flashcards,
                [deckId]: (state.flashcards[deckId] || []).map(c => c.id === localId ? dbCard : c)
              }
            }));

            return dbCard;
          }
        }

        return newCard;
      },

      deleteFlashcard: async (deckId: string, cardId: string) => {
        set(state => ({
          flashcards: {
            ...state.flashcards,
            [deckId]: (state.flashcards[deckId] || []).filter(c => c.id !== cardId)
          }
        }));

        if (deckId.startsWith('deck-starter-') || cardId.startsWith('card-') || cardId.startsWith('card-local-')) {
          return; // Operación estrictamente local, no invocar Supabase
        }

        const profile = useProfileStore.getState().profile;
        if (profile && profile.id !== 'local') {
          await supabase.from('flashcards').delete().eq('id', cardId);
        }
      },

      updateFlashcardReview: async (deckId: string, cardId: string, quality: number) => {
        const cards = get().flashcards[deckId] || [];
        const cardIndex = cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const card = cards[cardIndex];
        const { interval, repetitions, easeFactor, nextDue } = calculateSM2(
          quality,
          card.interval,
          card.repetitions,
          card.ease_factor
        );

        const updatedCard: Flashcard = {
          ...card,
          interval,
          repetitions,
          ease_factor: easeFactor,
          next_due: nextDue.toISOString(),
        };

        // Update local state
        const updatedDeckCards = [...cards];
        updatedDeckCards[cardIndex] = updatedCard;

        set(state => ({
          flashcards: {
            ...state.flashcards,
            [deckId]: updatedDeckCards,
          }
        }));

        if (deckId.startsWith('deck-starter-') || cardId.startsWith('card-') || cardId.startsWith('card-local-')) {
          return; // No llamar a Supabase
        }

        // Persist to Supabase if not a starter card and profile is not local
        const profile = useProfileStore.getState().profile;
        if (profile && profile.id !== 'local') {
          await supabase
            .from('flashcards')
            .update({
              interval,
              repetitions,
              ease_factor: easeFactor,
              next_due: nextDue.toISOString(),
            })
            .eq('id', cardId);
        }
      },

      finishSession: async (deckId: string, cardsReviewed: number) => {
        const xpEarned = 30; // reward exactly 30 XP per completed review session
        await useProfileStore.getState().addXP(xpEarned);

        const profile = useProfileStore.getState().profile;
        if (profile && profile.id !== 'local' && !deckId.startsWith('deck-starter-')) {
          // Log session to Supabase
          await supabase.from('flashcard_sessions').insert({
            user_id: profile.id,
            deck_id: deckId,
            cards_reviewed: cardsReviewed,
            xp_earned: xpEarned,
          });
        }

        // Insert in local session store to track progress/heatmap
        await useSessionStore.getState().insert({
          exercise_id: 'flashcards',
          level: 1,
          started_at: null,
          score: cardsReviewed, // score represents card count reviewed
          errors: 0,
          time_seconds: cardsReviewed * 5, // mock 5s per card reviewed
          wpm: null,
          comprehension: 1.0,
          xp_earned: xpEarned,
          finished_at: new Date().toISOString(),
        });

        return xpEarned;
      },

      reset: () => set({ decks: STARTER_DECKS, flashcards: STARTER_CARDS }),
    }),
    {
      name: 'lectorapp-flashcards',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
