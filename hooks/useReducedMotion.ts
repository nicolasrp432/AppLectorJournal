import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated';
import { usePrefsStore } from '../store/usePrefsStore';

/**
 * ¿Debe la interfaz moverse menos?
 *
 * Combina dos señales, y basta con que una diga que sí:
 *
 *  1. El ajuste del sistema ("Reducir movimiento" en Ajustes de iOS / Android).
 *     Lo lee `useReducedMotion` de Reanimated vía AccessibilityInfo.
 *  2. El interruptor propio de la app, para quien lo quiere solo aquí.
 *
 * Antes este hook leía SOLO la preferencia interna. Eso dejaba fuera al usuario
 * que ya había activado el ajuste del sistema —normalmente porque el movimiento
 * le provoca mareo— y que abría la app esperando que se respetara.
 *
 * OJO CON EL ALCANCE: `withTiming`/`withSpring` de Reanimated ya consultan el
 * ajuste del sistema por su cuenta (su `reduceMotion` cae en `ReduceMotion.System`
 * por defecto), así que una animación suelta ya degrada sola. Este hook es para
 * las decisiones que el código toma ANTES de animar: si montar un bucle infinito,
 * si escalonar una entrada, si dibujar partículas. Eso Reanimated no puede
 * saberlo, y es justo donde estaba el hueco.
 */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const preference = usePrefsStore(s => s.prefs.reduce_motion);
  return system || preference;
}
