import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from './useProfileStore';
import { useNotificationStore } from './useNotificationStore';
import { supabase } from '../lib/supabase';
import type { ExerciseId } from '../types/db';

export interface DailyMission {
  id: string;
  type: 'sessions_count' | 'comprehension_80' | 'loci_session' | 'flashcards_review';
  description: string;
  target: number;
  current: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  xpClaimed: boolean;
}

const MISSION_TEMPLATES: Omit<DailyMission, 'current' | 'date' | 'completed' | 'xpClaimed'>[] = [
  {
    id: 'm1_sessions',
    type: 'sessions_count',
    description: 'Completa 2 sesiones de entrenamiento de cualquier ejercicio',
    target: 2,
  },
  {
    id: 'm2_comprehension',
    type: 'comprehension_80',
    description: 'Logra un 80% o más de comprensión en una lectura',
    target: 1,
  },
  {
    id: 'm3_loci',
    type: 'loci_session',
    description: 'Fortalece tus anclajes espaciales en el Palacio de Memoria',
    target: 1,
  },
  {
    id: 'm4_flashcards',
    type: 'flashcards_review',
    description: 'Repasa tus Flashcards en el nuevo módulo de memoria espaciada (SM-2)',
    target: 1,
  },
];

interface DailyMissionState {
  mission: DailyMission | null;
  checkOrGenerate: () => Promise<void>;
  incrementProgress: (type: DailyMission['type'], details?: { comprehension?: number; exerciseId?: string }) => void;
  claimReward: () => Promise<boolean>;
  reset: () => void;
}

export const useDailyMissionStore = create<DailyMissionState>()(
  persist(
    (set, get) => ({
      mission: null,

      reset: () => set({ mission: null }),

      checkOrGenerate: async () => {
        const today = new Date().toISOString().split('T')[0];
        const currentMission = get().mission;

        // If mission already exists and is for today, keep it!
        if (currentMission && currentMission.date === today) {
          return;
        }

        // Generate a new random mission for today
        const randomIndex = Math.floor(Math.random() * MISSION_TEMPLATES.length);
        const template = MISSION_TEMPLATES[randomIndex];

        const newMission: DailyMission = {
          ...template,
          current: 0,
          date: today,
          completed: false,
          xpClaimed: false,
        };

        set({ mission: newMission });

        // Sync with notifications
        const profile = useProfileStore.getState().profile;
        if (!profile) return;

        const notifData = {
          user_id: profile.id,
          title: 'Misión Diaria',
          message: template.description,
          category: 'mission' as const,
          icon: 'flash-outline',
          xp_reward: 25,
        };

        if (profile.id === 'local') {
          // Add local notification
          useNotificationStore.getState().addLocalNotification(notifData);
        } else {
          try {
            // Check if notification already exists for today's mission
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', profile.id)
              .eq('title', 'Misión Diaria')
              .gte('created_at', today + 'T00:00:00Z')
              .limit(1);

            if (!existing || existing.length === 0) {
              await supabase.from('notifications').insert({
                user_id: profile.id,
                title: notifData.title,
                message: notifData.message,
                category: notifData.category,
                icon: notifData.icon,
                xp_reward: notifData.xp_reward,
                claimed: false,
                read: false,
              });
              // Refresh store notifications
              await useNotificationStore.getState().fetchNotifications();
            }
          } catch (e) {
            console.warn('Error inserting daily mission notification in Supabase:', e);
          }
        }
      },

      incrementProgress: (type, details) => {
        const mission = get().mission;
        if (!mission || mission.completed) return;

        let shouldIncrement = false;

        if (mission.type === type) {
          if (type === 'sessions_count') {
            shouldIncrement = true;
          } else if (type === 'comprehension_80' && details?.comprehension !== undefined) {
            if (details.comprehension >= 0.8) {
              shouldIncrement = true;
            }
          } else if (type === 'loci_session' && details?.exerciseId === 'loci') {
            shouldIncrement = true;
          } else if (type === 'flashcards_review' && details?.exerciseId === 'flashcards') {
            shouldIncrement = true;
          }
        }

        if (shouldIncrement) {
          const nextCurrent = Math.min(mission.target, mission.current + 1);
          const nextCompleted = nextCurrent >= mission.target;

          set({
            mission: {
              ...mission,
              current: nextCurrent,
              completed: nextCompleted,
            },
          });
        }
      },

      claimReward: async () => {
        const mission = get().mission;
        if (!mission || !mission.completed || mission.xpClaimed) return false;

        // Add 25 XP using useProfileStore
        const profileStore = useProfileStore.getState();
        await profileStore.addXP(25);

        set({
          mission: {
            ...mission,
            xpClaimed: true,
          },
        });

        return true;
      },
    }),
    {
      name: 'lectorapp-daily-mission',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
