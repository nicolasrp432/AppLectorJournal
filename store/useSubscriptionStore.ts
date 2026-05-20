import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCat, SubscriptionOffering } from '../lib/revenuecat';
import { useProfileStore } from './useProfileStore';
import { supabase } from '../lib/supabase';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  offerings: SubscriptionOffering[];
  initialize: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  purchase: (offering: SubscriptionOffering) => Promise<boolean>;
  restore: () => Promise<boolean>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      isLoading: false,
      offerings: [],

      initialize: async () => {
        set({ isLoading: true });
        try {
          // 1. Initialise RevenueCat SDK
          await revenueCat.configure();
          
          // 2. Fetch packages & check entitlement
          await Promise.all([
            get().fetchOfferings(),
            get().checkSubscription(),
          ]);
        } catch (error) {
          console.warn('[SubscriptionStore] Initialization failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchOfferings: async () => {
        try {
          const offerings = await revenueCat.getOfferings();
          set({ offerings });
        } catch (error) {
          console.error('[SubscriptionStore] Error fetching offerings:', error);
        }
      },

      checkSubscription: async () => {
        try {
          // 1. Check RevenueCat active entitlement
          const rcEntitled = await revenueCat.checkPremiumEntitlement();
          
          // 2. Check Supabase DB profile override
          const profile = useProfileStore.getState().profile;
          const dbEntitled = profile
            ? (profile.subscription_tier === 'premium' || profile.subscription_status === 'active')
            : false;
          
          const isPremium = rcEntitled || dbEntitled;
          
          if (get().isPremium !== isPremium) {
            set({ isPremium });
            
            // Sync with profile store locally and Supabase if logged in
            if (profile && profile.id !== 'local') {
              const tier = isPremium ? 'premium' : 'free';
              const status = isPremium ? 'active' : 'inactive';
              
              await useProfileStore.getState().updateProfile({
                subscription_tier: tier,
                subscription_status: status
              });
            }
          }
          
          return isPremium;
        } catch (error) {
          console.error('[SubscriptionStore] Error checking subscription:', error);
          return get().isPremium;
        }
      },

      purchase: async (offering: SubscriptionOffering) => {
        set({ isLoading: true });
        try {
          const success = await revenueCat.purchasePackage(offering);
          if (success) {
            set({ isPremium: true });
            
            // Synchronize with Supabase database and profile store
            const profile = useProfileStore.getState().profile;
            if (profile) {
              await useProfileStore.getState().updateProfile({
                subscription_tier: 'premium',
                subscription_status: 'active'
              });
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('[SubscriptionStore] Purchase failed:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      restore: async () => {
        set({ isLoading: true });
        try {
          const success = await revenueCat.restorePurchases();
          if (success) {
            set({ isPremium: true });
            
            // Synchronize with Supabase database and profile store
            const profile = useProfileStore.getState().profile;
            if (profile) {
              await useProfileStore.getState().updateProfile({
                subscription_tier: 'premium',
                subscription_status: 'active'
              });
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('[SubscriptionStore] Restore failed:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        // Reset local simulation
        revenueCat.setSimulatedPremium(false);
        set({
          isPremium: false,
          isLoading: false,
          offerings: [],
        });
      },
    }),
    {
      name: 'lectorapp-subscription',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
