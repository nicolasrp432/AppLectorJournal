import { supabase } from './supabase';

/**
 * Capa reutilizable de suscripciones en tiempo real.
 *
 * La liga fue la primera funcionalidad en vivo del proyecto, y su store empezó
 * gestionando el canal a mano. Al extraerlo aquí, cualquier otra parte de la app
 * (notificaciones, mazos compartidos, progreso de un amigo) puede suscribirse sin
 * repetir el ciclo de vida ni arriesgarse a dejar canales colgando.
 *
 * Los canales viven en un registro por clave: suscribirse dos veces con la misma
 * clave reemplaza el canal anterior en lugar de acumularlo. Un canal huérfano no
 * da error visible — simplemente sigue consumiendo la conexión y aplicando
 * cambios de una cohorte o una fila que ya no se está mirando.
 */

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface TableSubscription<Row> {
  /** Clave única de la suscripción. Reutilizarla sustituye el canal anterior. */
  key: string;
  table: string;
  schema?: string;
  event?: RealtimeEvent;
  /** Filtro PostgREST, p. ej. `cohort_id=eq.<uuid>`. */
  filter?: string;
  /** Recibe la fila nueva (o la vieja en un DELETE). */
  onChange: (row: Row, eventType: string) => void;
  /** Cambios de estado de conexión, para pintar un indicador "en vivo". */
  onStatus?: (connected: boolean) => void;
}

const channels = new Map<string, ReturnType<typeof supabase.channel>>();

/**
 * Abre (o reemplaza) una suscripción. Devuelve la función para darse de baja.
 *
 * La RLS se sigue aplicando a Realtime: cada usuario solo recibe eventos de las
 * filas que su política le deja leer, así que el filtro es una optimización de
 * tráfico, no la barrera de seguridad.
 */
export function subscribeTable<Row = Record<string, unknown>>(
  sub: TableSubscription<Row>,
): () => void {
  unsubscribeKey(sub.key);

  const channel = supabase
    .channel(`rt:${sub.key}`)
    .on(
      // El SDK tipa este literal de forma muy estrecha y no acepta la unión
      // genérica que exponemos aquí.
      'postgres_changes' as never,
      {
        event: sub.event ?? '*',
        schema: sub.schema ?? 'public',
        table: sub.table,
        ...(sub.filter ? { filter: sub.filter } : {}),
      } as never,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        // En un DELETE la fila viene en `old`; en el resto, en `new`.
        const row = (payload?.new ?? payload?.old) as Row | undefined;
        if (row) sub.onChange(row, payload?.eventType ?? 'UPDATE');
      },
    )
    .subscribe((status: string) => {
      sub.onStatus?.(status === 'SUBSCRIBED');
    });

  channels.set(sub.key, channel);

  return () => unsubscribeKey(sub.key);
}

/** Cierra la suscripción de una clave, si existe. */
export function unsubscribeKey(key: string): void {
  const existing = channels.get(key);
  if (existing) {
    supabase.removeChannel(existing);
    channels.delete(key);
  }
}

/** Cierra todas las suscripciones. Se llama al cerrar sesión. */
export function unsubscribeAll(): void {
  for (const key of Array.from(channels.keys())) {
    unsubscribeKey(key);
  }
}

/** Claves activas. Útil para depurar fugas de canales. */
export function activeSubscriptions(): string[] {
  return Array.from(channels.keys());
}
