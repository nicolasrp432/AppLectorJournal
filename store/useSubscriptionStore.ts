import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCat, SubscriptionOffering, PurchaseResult } from '../lib/revenuecat';
import { useProfileStore } from './useProfileStore';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  offerings: SubscriptionOffering[];
  /** Último motivo de fallo de compra/restauración, para que la UI lo explique. */
  lastError: PurchaseResult['reason'] | null;
  initialize: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  purchase: (offering: SubscriptionOffering) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  reset: () => void;
}

/**
 * Estado de suscripción del cliente.
 *
 * Regla clave: este store NO decide quién es premium; solo *dispara* la compra
 * y luego pregunta al servidor. Antes escribía él mismo
 * `subscription_tier: 'premium'` en la tabla `profiles`, lo que combinado con la
 * política RLS abierta convertía cualquier "compra" simulada (web/Expo Go) en
 * premium real y permanente en la base de datos.
 */
export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      isLoading: false,
      offerings: [],
      lastError: null,

      initialize: async () => {
        set({ isLoading: true });
        try {
          await revenueCat.configure();

          // Vincula las compras al usuario de Supabase antes de leer nada:
          // sin esto RevenueCat trabaja con un id anónimo por instalación.
          const profile = useProfileStore.getState().profile;
          if (profile && profile.id !== 'local') {
            await revenueCat.identify(profile.id);
          }

          await Promise.all([get().fetchOfferings(), get().checkSubscription()]);
        } catch (error) {
          console.warn('[SubscriptionStore] Fallo al inicializar:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchOfferings: async () => {
        try {
          set({ offerings: await revenueCat.getOfferings() });
        } catch (error) {
          console.error('[SubscriptionStore] Error obteniendo offerings:', error);
        }
      },

      /**
       * El servidor manda. Se consulta `get_entitlement()`; RevenueCat solo
       * sirve de señal para forzar un refresco cuando el webhook aún no ha
       * aterrizado (hay unos segundos de latencia tras comprar).
       */
      checkSubscription: async () => {
        try {
          const profileStore = useProfileStore.getState();
          let entitled = await profileStore.refreshEntitlement();

          if (!entitled) {
            const rcEntitled = await revenueCat.checkPremiumEntitlement();
            if (rcEntitled) {
              // RevenueCat ya lo ve activo pero el webhook no ha escrito todavía:
              // reintenta una vez tras un margen corto.
              await new Promise(r => setTimeout(r, 1500));
              entitled = await useProfileStore.getState().refreshEntitlement();
              if (!entitled) {
                console.warn(
                  '[SubscriptionStore] RevenueCat reporta entitlement activo pero el ' +
                    'servidor no. ¿Está desplegado el webhook que llama a set_entitlement?',
                );
              }
            }
          }

          if (get().isPremium !== entitled) set({ isPremium: entitled });
          return entitled;
        } catch (error) {
          console.error('[SubscriptionStore] Error comprobando la suscripción:', error);
          return get().isPremium;
        }
      },

      purchase: async (offering: SubscriptionOffering) => {
        set({ isLoading: true, lastError: null });
        try {
          const result = await revenueCat.purchasePackage(offering);

          if (!result.ok) {
            set({ lastError: result.reason ?? 'failed' });
            return result;
          }

          if (result.simulated) {
            // Compra de desarrollo: se refleja solo en memoria, jamás en la BD.
            set({ isPremium: true });
            return result;
          }

          // Compra real: el entitlement lo escribe el webhook con service_role,
          // así que aquí solo releemos.
          const entitled = await get().checkSubscription();
          return entitled ? result : { ok: false, reason: 'not_entitled' as const };
        } catch (error) {
          console.error('[SubscriptionStore] Compra fallida:', error);
          set({ lastError: 'failed' });
          return { ok: false, reason: 'failed' as const };
        } finally {
          set({ isLoading: false });
        }
      },

      restore: async () => {
        set({ isLoading: true, lastError: null });
        try {
          const result = await revenueCat.restorePurchases();
          if (!result.ok) {
            set({ lastError: result.reason ?? 'failed' });
            return result;
          }
          if (result.simulated) {
            set({ isPremium: true });
            return result;
          }
          const entitled = await get().checkSubscription();
          return entitled ? result : { ok: false, reason: 'not_entitled' as const };
        } catch (error) {
          console.error('[SubscriptionStore] Restaurar falló:', error);
          set({ lastError: 'failed' });
          return { ok: false, reason: 'failed' as const };
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        revenueCat.setSimulatedPremium(false);
        void revenueCat.signOut();
        set({ isPremium: false, isLoading: false, offerings: [], lastError: null });
      },
    }),
    {
      name: 'lectorapp-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      // `isPremium` NO se persiste: es estado derivado del servidor. Persistirlo
      // dejaba premium "pegado" en el dispositivo tras caducar o cerrar sesión.
      partialize: state => ({ offerings: state.offerings }),
    },
  ),
);
