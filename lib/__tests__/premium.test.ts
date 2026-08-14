import { resolveEntitlement, isEntitled, EXPIRY_WARNING_DAYS } from '../premium';

const NOW = new Date('2026-08-14T12:00:00.000Z');
const daysFromNow = (d: number) =>
  new Date(NOW.getTime() + d * 86_400_000).toISOString();

describe('resolveEntitlement', () => {
  it('no concede premium sin perfil', () => {
    expect(resolveEntitlement(null, NOW).isPremium).toBe(false);
    expect(resolveEntitlement(undefined, NOW).reason).toBe('no_tier');
  });

  it('concede premium con tier premium, estado activo y sin caducidad', () => {
    const r = resolveEntitlement({ tier: 'premium', status: 'active' }, NOW);
    expect(r.isPremium).toBe(true);
    expect(r.expiringSoon).toBe(false);
  });

  it('acepta in_grace (fallo de cobro en reintento) como vigente', () => {
    expect(isEntitled({ tier: 'premium', status: 'in_grace' }, NOW)).toBe(true);
  });

  // Regresión del bug original: `tier === 'premium' || status === 'active'`
  // concedía premium con solo una de las dos condiciones.
  it('NO concede premium con estado activo pero tier gratuito', () => {
    const r = resolveEntitlement({ tier: 'free', status: 'active' }, NOW);
    expect(r.isPremium).toBe(false);
    expect(r.reason).toBe('no_tier');
  });

  it('NO concede premium con tier premium pero estado inactivo', () => {
    const r = resolveEntitlement({ tier: 'premium', status: 'inactive' }, NOW);
    expect(r.isPremium).toBe(false);
    expect(r.reason).toBe('inactive_status');
  });

  describe('caducidad', () => {
    it('revoca cuando la fecha ya pasó', () => {
      const r = resolveEntitlement(
        { tier: 'premium', status: 'active', expiresAt: daysFromNow(-1) },
        NOW,
      );
      expect(r.isPremium).toBe(false);
      expect(r.reason).toBe('expired');
    });

    it('mantiene el acceso de una suscripción cancelada hasta su fecha', () => {
      // Cancelar ≠ perder el acceso: se pagó hasta expiresAt.
      expect(
        isEntitled({ tier: 'premium', status: 'in_grace', expiresAt: daysFromNow(10) }, NOW),
      ).toBe(true);
    });

    it('marca expiringSoon dentro de la ventana de aviso', () => {
      const r = resolveEntitlement(
        { tier: 'premium', status: 'active', expiresAt: daysFromNow(EXPIRY_WARNING_DAYS - 1) },
        NOW,
      );
      expect(r.isPremium).toBe(true);
      expect(r.expiringSoon).toBe(true);
    });

    it('no marca expiringSoon si aún queda margen', () => {
      const r = resolveEntitlement(
        { tier: 'premium', status: 'active', expiresAt: daysFromNow(EXPIRY_WARNING_DAYS + 5) },
        NOW,
      );
      expect(r.expiringSoon).toBe(false);
    });

    it('una fecha ilegible revoca en vez de conceder por accidente', () => {
      const r = resolveEntitlement(
        { tier: 'premium', status: 'active', expiresAt: 'no-es-una-fecha' },
        NOW,
      );
      expect(r.isPremium).toBe(false);
      expect(r.reason).toBe('expired');
    });

    it('caducidad exactamente ahora cuenta como caducada', () => {
      expect(
        isEntitled({ tier: 'premium', status: 'active', expiresAt: NOW.toISOString() }, NOW),
      ).toBe(false);
    });
  });

  it('tolera campos nulos sin lanzar', () => {
    expect(isEntitled({ tier: null, status: null, expiresAt: null }, NOW)).toBe(false);
  });
});
