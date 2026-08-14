import { Platform } from 'react-native';

// Import perezoso: el SDK nativo no existe en web ni en Expo Go.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Purchases: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    console.warn('[RevenueCat] SDK no disponible en este entorno; modo simulación.', e);
  }
}

/**
 * Claves por plataforma. RevenueCat emite una clave distinta para iOS (App Store)
 * y otra para Android (Play Store); usar una sola hace que la otra tienda falle
 * silenciosamente al pedir offerings.
 *
 * Antes había una clave `test_...` hardcodeada en el fuente, así que las builds
 * de producción salían con credenciales de test y las compras nunca se
 * registraban de verdad.
 */
const API_KEY = Platform.select({
  ios:     process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'premium';

/**
 * La simulación solo existe en desarrollo. En una build de release sin SDK
 * (p. ej. la web) comprar debe *fallar*, no conceder premium: antes
 * `purchasePackage()` devolvía true en web y el store escribía
 * `subscription_tier: 'premium'` en Supabase, de modo que cualquiera podía
 * auto-otorgarse premium abriendo la versión web y pulsando "comprar".
 */
const SIMULATION_ALLOWED = __DEV__;

export interface SubscriptionOffering {
  id: string;
  title: string;
  priceString: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawPackage?: any;
}

export interface PurchaseResult {
  /** true solo si el entitlement quedó realmente activo. */
  ok: boolean;
  /** Motivo cuando ok=false, para que la UI dé un mensaje útil. */
  reason?: 'cancelled' | 'unavailable' | 'failed' | 'not_entitled';
  /** true si viene de la simulación de desarrollo (NO debe persistirse). */
  simulated?: boolean;
}

class RevenueCatService {
  private isConfigured = false;
  private simulatedPremium = false;
  private currentAppUserId: string | null = null;

  /** true si estamos en el camino simulado (sin SDK nativo). */
  private get isSimulated(): boolean {
    return Platform.OS === 'web' || !Purchases || !API_KEY;
  }

  async configure(): Promise<boolean> {
    if (this.isConfigured) return true;

    if (this.isSimulated) {
      if (!API_KEY && Platform.OS !== 'web') {
        console.warn(
          '[RevenueCat] Falta EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY. ' +
            'Las compras quedan deshabilitadas.',
        );
      }
      this.isConfigured = true;
      return true;
    }

    try {
      await Purchases.configure({ apiKey: API_KEY });
      this.isConfigured = true;
      return true;
    } catch (error) {
      console.error('[RevenueCat] Fallo al configurar el SDK:', error);
      return false;
    }
  }

  /**
   * Asocia las compras al usuario de Supabase.
   *
   * Sin esto RevenueCat usa un id anónimo por instalación: la suscripción no
   * sobrevive a un reinstall ni sigue al usuario a un segundo dispositivo, y el
   * webhook no puede saber a qué fila de `profiles` corresponde la compra.
   * Debe llamarse justo después del login y antes de leer el entitlement.
   */
  async identify(userId: string): Promise<void> {
    await this.configure();
    this.currentAppUserId = userId;
    if (this.isSimulated) return;

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('[RevenueCat] logIn falló:', error);
    }
  }

  /** Desasocia al cerrar sesión para no mezclar compras entre cuentas. */
  async signOut(): Promise<void> {
    this.currentAppUserId = null;
    this.simulatedPremium = false;
    if (this.isSimulated || !this.isConfigured) return;

    try {
      await Purchases.logOut();
    } catch (error) {
      console.warn('[RevenueCat] logOut falló:', error);
    }
  }

  getAppUserId(): string | null {
    return this.currentAppUserId;
  }

  async checkPremiumEntitlement(): Promise<boolean> {
    await this.configure();

    if (this.isSimulated) {
      return SIMULATION_ALLOWED && this.simulatedPremium;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error) {
      console.error('[RevenueCat] Error leyendo el entitlement:', error);
      return false;
    }
  }

  async getOfferings(): Promise<SubscriptionOffering[]> {
    await this.configure();

    if (this.isSimulated) {
      // Catálogo de maqueta para poder maquetar el paywall en web/dev.
      if (!SIMULATION_ALLOWED) return [];
      return [
        { id: 'monthly',  title: 'Mensual Pro',   priceString: '$4.99 / mes',   description: 'Acceso completo con renovación mensual.' },
        { id: 'yearly',   title: 'Anual Pro',     priceString: '$29.99 / año',  description: 'La opción más elegida para un año de entrenamiento.' },
        { id: 'lifetime', title: 'Vitalicio Pro', priceString: '$79.99 total',  description: 'Acceso ilimitado para siempre con un solo pago.' },
      ];
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return offerings.current.availablePackages.map((pkg: any) => {
          const prod = pkg.product;
          let label = prod.title || 'LectorApp Pro';
          if (pkg.packageType === 'MONTHLY')  label = 'Mensual Pro';
          if (pkg.packageType === 'ANNUAL')   label = 'Anual Pro';
          if (pkg.packageType === 'LIFETIME') label = 'Vitalicio Pro';

          return {
            id: pkg.identifier,
            title: label,
            priceString: prod.priceString,
            description: prod.description || 'Desbloquea el entrenamiento ilimitado.',
            rawPackage: pkg,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('[RevenueCat] Error obteniendo offerings:', error);
      return [];
    }
  }

  async purchasePackage(offering: SubscriptionOffering): Promise<PurchaseResult> {
    await this.configure();

    if (this.isSimulated) {
      if (!SIMULATION_ALLOWED) {
        // Release sin SDK: no hay forma legítima de cobrar, así que no se concede nada.
        return { ok: false, reason: 'unavailable' };
      }
      this.simulatedPremium = true;
      return { ok: true, simulated: true };
    }

    try {
      if (!offering.rawPackage) {
        return { ok: false, reason: 'unavailable' };
      }
      const { customerInfo } = await Purchases.purchasePackage(offering.rawPackage);
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      const active = entitlement !== undefined && entitlement.isActive;
      return active ? { ok: true } : { ok: false, reason: 'not_entitled' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.userCancelled) return { ok: false, reason: 'cancelled' };
      console.error('[RevenueCat] Compra fallida:', error);
      return { ok: false, reason: 'failed' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    await this.configure();

    if (this.isSimulated) {
      if (!SIMULATION_ALLOWED) return { ok: false, reason: 'unavailable' };
      this.simulatedPremium = true;
      return { ok: true, simulated: true };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      const active = entitlement !== undefined && entitlement.isActive;
      return active ? { ok: true } : { ok: false, reason: 'not_entitled' };
    } catch (error) {
      console.error('[RevenueCat] Restaurar compras falló:', error);
      return { ok: false, reason: 'failed' };
    }
  }

  /** Solo para desarrollo: fuerza el estado simulado. No-op en release. */
  setSimulatedPremium(value: boolean) {
    if (!SIMULATION_ALLOWED) return;
    this.simulatedPremium = value;
  }
}

export const revenueCat = new RevenueCatService();
