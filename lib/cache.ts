import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Capa de frescura para "stale-while-revalidate" (SWR).
 *
 * Los stores de Zustand ya persisten sus datos en AsyncStorage, de modo que la UI
 * se hidrata al instante al abrir la app. El problema que resuelve este módulo es
 * el REFETCH redundante: hoy `syncUser` golpea Supabase (8 lecturas) en cada arranque
 * y en cada evento de auth, aunque los datos locales sean recientes.
 *
 * Aquí guardamos, por clave lógica, el timestamp del último fetch exitoso. Con eso
 * cualquier consumidor puede preguntar `isStale(key, ttl)` y decidir si vale la pena
 * volver a la red o servir lo que ya hay en caché.
 *
 * Diseño deliberadamente aditivo: nada de esto altera los datos existentes; sólo
 * añade metadatos de frescura bajo el namespace `lectorapp-fresh:`.
 */

const FRESH_PREFIX = 'lectorapp-fresh:';

/** TTLs por defecto (ms). Ajustables por llamada. */
export const TTL = {
  /** Datos de usuario que cambian poco entre sesiones (perfil, prefs, biblioteca…). */
  USER_DATA: 5 * 60 * 1000, // 5 min
  /** Datos muy estables (recompensas, logros, nodos completados). */
  SLOW: 30 * 60 * 1000, // 30 min
  /** Datos volátiles que conviene refrescar a menudo (conteo diario de sesiones). */
  VOLATILE: 60 * 1000, // 1 min
} as const;

/** Cache en memoria para evitar leer AsyncStorage repetidas veces en una misma sesión. */
const memTimestamps: Record<string, number> = {};

/**
 * ¿Los datos asociados a `key` están obsoletos (más viejos que `ttl`)?
 * Devuelve `true` si nunca se han marcado como frescos.
 */
export async function isStale(key: string, ttl: number = TTL.USER_DATA): Promise<boolean> {
  const cached = memTimestamps[key];
  if (cached != null) {
    return Date.now() - cached > ttl;
  }
  try {
    const raw = await AsyncStorage.getItem(FRESH_PREFIX + key);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    memTimestamps[key] = ts;
    return Date.now() - ts > ttl;
  } catch {
    // Ante cualquier error de almacenamiento, tratamos como obsoleto (fail-open hacia la red).
    return true;
  }
}

/** Marca `key` como recién sincronizada (ahora). */
export async function markFresh(key: string): Promise<void> {
  const now = Date.now();
  memTimestamps[key] = now;
  try {
    await AsyncStorage.setItem(FRESH_PREFIX + key, String(now));
  } catch {
    /* noop: la marca en memoria es suficiente para esta sesión */
  }
}

/** Edad de la última sincronización en ms, o `Infinity` si nunca ocurrió. */
export async function freshnessAge(key: string): Promise<number> {
  const cached = memTimestamps[key];
  if (cached != null) return Date.now() - cached;
  try {
    const raw = await AsyncStorage.getItem(FRESH_PREFIX + key);
    if (!raw) return Infinity;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return Infinity;
    memTimestamps[key] = ts;
    return Date.now() - ts;
  } catch {
    return Infinity;
  }
}

/**
 * Borra todas las marcas de frescura. Llamar al cerrar sesión para forzar
 * que el próximo usuario re-sincronice desde cero.
 */
export async function clearFreshness(): Promise<void> {
  for (const k of Object.keys(memTimestamps)) delete memTimestamps[k];
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter(k => k.startsWith(FRESH_PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    /* noop */
  }
}

/**
 * Helper "stale-while-revalidate": si los datos están frescos no hace nada;
 * si están obsoletos ejecuta `revalidate()` y marca la clave como fresca al terminar.
 *
 * No lanza: cualquier error de `revalidate` se traga para no romper el arranque.
 */
export async function swr(
  key: string,
  ttl: number,
  revalidate: () => Promise<void>,
  opts: { force?: boolean } = {},
): Promise<void> {
  if (!opts.force && !(await isStale(key, ttl))) return;
  try {
    await revalidate();
    await markFresh(key);
  } catch (err) {
    console.warn(`[cache] revalidate falló para "${key}":`, err);
  }
}
