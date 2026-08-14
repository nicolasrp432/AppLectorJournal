/**
 * Resolución del entitlement premium — fuente de verdad única del cliente.
 *
 * Antes había dos "premium" independientes y desincronizados:
 *   - `useProfileStore.isPremium()`  → leía profile.subscription_tier
 *   - `useSubscriptionStore.isPremium` → leía RevenueCat
 * `app/exercise/[id].tsx` (vidas y límite diario) solo consultaba el primero,
 * así que un usuario que compraba por RevenueCat seguía gastando vidas si la
 * sincronía con el perfil fallaba. Y ninguno de los dos miraba la caducidad:
 * un `status: 'active'` viejo concedía premium para siempre.
 *
 * Estas funciones son puras para poder testearlas sin Supabase ni el SDK nativo.
 * El servidor sigue siendo la autoridad real (`public.is_premium()` en
 * 012_subscription_entitlements.sql); esto es la lectura de cliente.
 */

/** Estados que cuentan como suscripción vigente. `in_grace` = fallo de cobro en reintento. */
const ACTIVE_STATUSES = new Set(['active', 'in_grace']);

export interface EntitlementInput {
  tier?: string | null;
  status?: string | null;
  /** ISO date. null/undefined = sin caducidad (p. ej. compra vitalicia). */
  expiresAt?: string | null;
}

export interface Entitlement {
  isPremium: boolean;
  /** Motivo por el que NO es premium; útil para la UI y para depurar. */
  reason?: 'no_tier' | 'inactive_status' | 'expired';
  /** true si la suscripción caduca en menos de EXPIRY_WARNING_DAYS. */
  expiringSoon: boolean;
}

export const EXPIRY_WARNING_DAYS = 3;

/**
 * Decide si un perfil tiene premium vigente.
 *
 * Se exige tier='premium' Y estado vigente Y no caducado. Antes bastaba con
 * `tier === 'premium' || status === 'active'` (un OR), de forma que una fila a
 * medio actualizar concedía premium por accidente.
 */
export function resolveEntitlement(
  input: EntitlementInput | null | undefined,
  now: Date = new Date(),
): Entitlement {
  if (!input) return { isPremium: false, reason: 'no_tier', expiringSoon: false };

  if (input.tier !== 'premium') {
    return { isPremium: false, reason: 'no_tier', expiringSoon: false };
  }
  if (!ACTIVE_STATUSES.has(String(input.status ?? ''))) {
    return { isPremium: false, reason: 'inactive_status', expiringSoon: false };
  }

  if (input.expiresAt) {
    const exp = new Date(input.expiresAt).getTime();
    // Una fecha ilegible no debe conceder premium silenciosamente.
    if (Number.isNaN(exp)) {
      return { isPremium: false, reason: 'expired', expiringSoon: false };
    }
    if (exp <= now.getTime()) {
      return { isPremium: false, reason: 'expired', expiringSoon: false };
    }
    const daysLeft = (exp - now.getTime()) / 86_400_000;
    return { isPremium: true, expiringSoon: daysLeft <= EXPIRY_WARNING_DAYS };
  }

  return { isPremium: true, expiringSoon: false };
}

/** Atajo booleano para los sitios que no necesitan el motivo. */
export function isEntitled(input: EntitlementInput | null | undefined, now?: Date): boolean {
  return resolveEntitlement(input, now).isPremium;
}
