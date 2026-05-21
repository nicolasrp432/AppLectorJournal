import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useProfileStore } from './useProfileStore';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: 'mission' | 'achievement' | 'system' | 'streak' | 'tip';
  icon: string;
  xp_reward: number;
  claimed: boolean;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  claimReward: (id: string) => Promise<void>;
  addLocalNotification: (notification: Omit<NotificationItem, 'id' | 'created_at' | 'claimed' | 'read'>) => void;
  unreadCount: () => number;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,

      unreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },

      reset: () => {
        set({ notifications: [], isLoading: false });
      },

      fetchNotifications: async () => {
        const profile = useProfileStore.getState().profile;
        if (!profile) return;

        if (profile.id === 'local') {
          // Keep local notifications as is
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            set({ notifications: data as NotificationItem[] });
          }
        } catch (err) {
          console.warn('Failed to fetch notifications from Supabase:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (id: string) => {
        const profile = useProfileStore.getState().profile;
        const currentNotifs = get().notifications;
        const updated = currentNotifs.map(n => n.id === id ? { ...n, read: true } : n);
        set({ notifications: updated });

        if (profile && profile.id !== 'local') {
          try {
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('id', id);
          } catch (err) {
            console.warn('Failed to mark notification as read in Supabase:', err);
          }
        }
      },

      claimReward: async (id: string) => {
        const profile = useProfileStore.getState().profile;
        if (!profile) return;

        const notification = get().notifications.find(n => n.id === id);
        if (!notification || notification.claimed || notification.xp_reward <= 0) return;

        // Set claimed locally first
        const currentNotifs = get().notifications;
        const updated = currentNotifs.map(n => n.id === id ? { ...n, claimed: true, read: true } : n);
        set({ notifications: updated });

        // Add XP to profile
        await useProfileStore.getState().addXP(notification.xp_reward);

        // Update database if logged in
        if (profile.id !== 'local') {
          try {
            await supabase
              .from('notifications')
              .update({ claimed: true, read: true })
              .eq('id', id);
          } catch (err) {
            console.warn('Failed to claim notification reward in Supabase:', err);
          }
        }
      },

      addLocalNotification: (notifData) => {
        const id = Math.random().toString(36).substring(7);
        const newNotif: NotificationItem = {
          ...notifData,
          id,
          claimed: false,
          read: false,
          created_at: new Date().toISOString(),
        };
        set(state => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },
    }),
    {
      name: 'lectorapp-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
