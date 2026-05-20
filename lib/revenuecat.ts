import { Platform } from 'react-native';

// Dynamic lazy import to avoid crashes in non-supported environments (like web)
let Purchases: any = null;
if (Platform.OS !== 'web') {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    console.warn('RevenueCat SDK is not available in this environment. Falling back to simulation mode.', e);
  }
}

const REVENUECAT_API_KEY = 'test_mMwJlApULxvfBOJGjozWyjLUbEs';
const ENTITLEMENT_ID = 'LectorApp Pro';

export interface SubscriptionOffering {
  id: string;
  title: string;
  priceString: string;
  description: string;
  rawPackage?: any;
}

class RevenueCatService {
  private isConfigured = false;
  private simulatedPremium = false;

  async configure(): Promise<boolean> {
    if (this.isConfigured) return true;

    if (Platform.OS === 'web' || !Purchases) {
      console.log('[RevenueCat] Running in Simulation Mode (Web/Expo Go).');
      this.isConfigured = true;
      return true;
    }

    try {
      // Configure RevenueCat Purchases SDK
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.isConfigured = true;
      console.log('[RevenueCat] SDK Configured successfully.');
      return true;
    } catch (error) {
      console.error('[RevenueCat] Failed to configure SDK:', error);
      return false;
    }
  }

  async checkPremiumEntitlement(): Promise<boolean> {
    await this.configure();

    if (Platform.OS === 'web' || !Purchases) {
      return this.simulatedPremium;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error) {
      console.error('[RevenueCat] Error checking premium entitlement:', error);
      return false;
    }
  }

  async getOfferings(): Promise<SubscriptionOffering[]> {
    await this.configure();

    if (Platform.OS === 'web' || !Purchases) {
      // Simulated mock packages for testing
      return [
        { id: 'monthly', title: 'Mensual Pro', priceString: '$4.99 / mes', description: 'Acceso completo de renovación automática mensual.' },
        { id: 'yearly', title: 'Anual Pro', priceString: '$29.99 / año', description: 'La opción más elegida para un año de entrenamiento cognitivo.' },
        { id: 'lifetime', title: 'Vitalicio Pro', priceString: '$79.99 total', description: 'Acceso ilimitado para siempre con un solo pago.' }
      ];
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages.map((pkg: any) => {
          const prod = pkg.product;
          let label = prod.title || 'LectorApp Pro';
          if (pkg.packageType === 'MONTHLY') label = 'Mensual Pro';
          if (pkg.packageType === 'ANNUAL') label = 'Anual Pro';
          if (pkg.packageType === 'LIFETIME') label = 'Vitalicio Pro';

          return {
            id: pkg.identifier,
            title: label,
            priceString: prod.priceString,
            description: prod.description || 'Desbloquea el entrenamiento cerebral ilimitado.',
            rawPackage: pkg
          };
        });
      }
      return [];
    } catch (error) {
      console.error('[RevenueCat] Error getting offerings:', error);
      return [];
    }
  }

  async purchasePackage(offering: SubscriptionOffering): Promise<boolean> {
    await this.configure();

    if (Platform.OS === 'web' || !Purchases) {
      console.log(`[RevenueCat] Simulating purchase of package: ${offering.id}`);
      this.simulatedPremium = true;
      return true;
    }

    try {
      if (!offering.rawPackage) {
        throw new Error('Native raw package is missing for this offering.');
      }
      const { customerInfo } = await Purchases.purchasePackage(offering.rawPackage);
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[RevenueCat] User cancelled the purchase.');
      } else {
        console.error('[RevenueCat] Purchase failed:', error);
      }
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    await this.configure();

    if (Platform.OS === 'web' || !Purchases) {
      console.log('[RevenueCat] Simulating restore purchases.');
      this.simulatedPremium = true;
      return true;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error) {
      console.error('[RevenueCat] Failed to restore purchases:', error);
      return false;
    }
  }

  // Developer backdoor / Admin method to force set state
  setSimulatedPremium(value: boolean) {
    this.simulatedPremium = value;
  }
}

export const revenueCat = new RevenueCatService();
