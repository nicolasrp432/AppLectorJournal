import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Utilidades para mover trabajo pesado / no urgente fuera del hilo crítico de la UI.
 *
 * Tres piezas independientes:
 *   1. `runInBackground` / `runAfterInteractions` — diferir trabajo para que no
 *      compita con el primer render ni con animaciones de navegación.
 *   2. `dedupe` — compartir una sola promesa entre llamadas idénticas en vuelo
 *      (clave para no invocar dos veces la misma Edge Function de IA, que es lo
 *      más caro y lento de la app).
 *   3. Cola de mutaciones persistente — escrituras a Supabase que sobreviven a
 *      reinicios y se reintentan cuando vuelve la red (modo offline-first real).
 *
 * Todo es aditivo: no cambia el comportamiento de quien no lo use.
 */

// ─────────────────────────────────────────────────────────────
// 1. Diferir trabajo
// ─────────────────────────────────────────────────────────────

/**
 * Ejecuta `fn` después de que terminen las interacciones/animaciones en curso.
 * Fire-and-forget: nunca lanza hacia el llamador.
 */
export function runInBackground(fn: () => void | Promise<void>): void {
  InteractionManager.runAfterInteractions(() => {
    Promise.resolve()
      .then(fn)
      .catch(err => console.warn('[taskQueue] tarea en segundo plano falló:', err));
  });
}

/** Versión que devuelve una promesa resoluble (para `await` opcional). */
export function runAfterInteractions<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      fn().then(resolve, reject);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 2. Dedup de llamadas en vuelo
// ─────────────────────────────────────────────────────────────

const inFlight = new Map<string, Promise<any>>();

/**
 * Garantiza que sólo exista UNA ejecución de `fn` para una `key` dada a la vez.
 * Las llamadas concurrentes con la misma clave reciben la misma promesa.
 *
 * Útil para Edge Functions de IA: si dos efectos disparan el mismo análisis,
 * sólo se paga un viaje de red en lugar de N.
 */
export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}

// ─────────────────────────────────────────────────────────────
// 3. Cola de mutaciones persistente (offline-first)
// ─────────────────────────────────────────────────────────────

const QUEUE_KEY = 'lectorapp-mutation-queue';
const MAX_ATTEMPTS = 5;

export type MutationType = 'insert' | 'update' | 'upsert' | 'delete';

export interface Mutation {
  id: string;
  table: string;
  type: MutationType;
  payload?: Record<string, any>;
  /** Filtro de igualdad para update/delete: { columna: valor }. */
  match?: Record<string, any>;
  onConflict?: string;
  attempts: number;
  enqueuedAt: number;
}

let memQueue: Mutation[] | null = null;
let flushing = false;

async function loadQueue(): Promise<Mutation[]> {
  if (memQueue) return memQueue;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    memQueue = raw ? (JSON.parse(raw) as Mutation[]) : [];
  } catch {
    memQueue = [];
  }
  return memQueue;
}

async function saveQueue(q: Mutation[]): Promise<void> {
  memQueue = q;
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* noop */
  }
}

/**
 * Encola una escritura a Supabase. El cambio local (optimista) lo hace el store;
 * esto sólo garantiza que la mutación remota se intente y se reintente hasta
 * confirmarse, incluso si la app se cierra o no hay red.
 *
 * Devuelve de inmediato y dispara el flush en segundo plano.
 */
export async function enqueueMutation(
  m: Omit<Mutation, 'id' | 'attempts' | 'enqueuedAt'>,
): Promise<void> {
  const q = await loadQueue();
  q.push({
    ...m,
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    attempts: 0,
    enqueuedAt: Date.now(),
  });
  await saveQueue(q);
  runInBackground(flushMutations);
}

async function applyMutation(m: Mutation): Promise<{ ok: boolean; retry: boolean }> {
  try {
    const table = supabase.from(m.table);
    let query: any;
    switch (m.type) {
      case 'insert':
        query = table.insert(m.payload ?? {});
        break;
      case 'upsert':
        query = table.upsert(m.payload ?? {}, m.onConflict ? { onConflict: m.onConflict } : undefined);
        break;
      case 'update':
        query = table.update(m.payload ?? {});
        break;
      case 'delete':
        query = table.delete();
        break;
    }
    if (m.match) {
      for (const [col, val] of Object.entries(m.match)) {
        query = query.eq(col, val);
      }
    }
    const { error } = await query;
    if (error) {
      // Errores de validación/permiso (4xx lógicos) no se resuelven reintentando.
      const status = (error as any).code;
      const permanent = typeof status === 'string' && /^(22|23|42)/.test(status);
      return { ok: false, retry: !permanent };
    }
    return { ok: true, retry: false };
  } catch {
    // Probablemente red caída → reintentar luego.
    return { ok: false, retry: true };
  }
}

/**
 * Procesa la cola pendiente. Idempotente y seguro de llamar varias veces:
 * un sólo flush corre a la vez. Las mutaciones que agotan reintentos se
 * descartan (y se loguean) para no bloquear la cola indefinidamente.
 */
export async function flushMutations(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let q = await loadQueue();
    const remaining: Mutation[] = [];
    for (const m of q) {
      const { ok, retry } = await applyMutation(m);
      if (ok) continue;
      if (retry && m.attempts + 1 < MAX_ATTEMPTS) {
        remaining.push({ ...m, attempts: m.attempts + 1 });
      } else {
        console.warn(`[taskQueue] mutación descartada tras ${m.attempts + 1} intentos:`, m.table, m.type);
      }
    }
    await saveQueue(remaining);
  } finally {
    flushing = false;
  }
}

/** Nº de mutaciones pendientes (para indicadores de "sincronizando…"). */
export async function pendingMutationCount(): Promise<number> {
  return (await loadQueue()).length;
}
