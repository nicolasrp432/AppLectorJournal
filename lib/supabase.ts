import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const NOOP_RESULT = { data: null, error: null };

/** Chainable no-op that resolves to { data: null, error: null } for any method chain. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function noopQuery(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: any = {};
  const chainMethods = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'order', 'limit', 'single', 'maybeSingle', 'contains', 'or', 'in', 'is', 'filter'];
  for (const m of chainMethods) {
    self[m] = () => self;
  }
  self.then   = (resolve: (v: typeof NOOP_RESULT) => unknown) => Promise.resolve(NOOP_RESULT).then(resolve);
  self.catch  = (reject: (reason: unknown) => unknown) => Promise.resolve(NOOP_RESULT).catch(reject);
  return self;
}

function makeClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return {
      auth: {
        getSession:         async () => ({ data: { session: null }, error: null }),
        onAuthStateChange:  () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp:             async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut:            async () => ({ error: null }),
      },
      from: () => ({
        select: () => noopQuery(),
        insert: () => noopQuery(),
        update: () => noopQuery(),
        delete: () => noopQuery(),
        upsert: () => noopQuery(),
      }),
      storage: {
        from: () => ({
          upload:       async () => ({ data: null, error: null }),
          getPublicUrl: ()      => ({ data: { publicUrl: '' } }),
          remove:       async () => ({ data: null, error: null }),
        }),
      },
      rpc: () => noopQuery(),
    } as unknown as SupabaseClient;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

export const supabase = makeClient();

/**
 * Invoca de forma segura una Supabase Edge Function usando fetch nativo directo.
 * Esto evita que un token de sesión de usuario corrupto/expirado en AsyncStorage
 * provoque errores 403 Forbidden a nivel de API Gateway en Supabase.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    if (!SUPABASE_URL) {
      return { data: null, error: new Error('Supabase URL no configurada') };
    }

    // Las Edge Functions ahora exigen un usuario autenticado (validan el JWT en
    // su cuerpo). Enviamos el access_token real del usuario; la clave anon ya no
    // sirve como credencial de usuario, solo como apikey de enrutado del gateway.
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { data: null, error: new Error('Debes iniciar sesión para usar las funciones de IA.') };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Propaga el motivo real del fallo (cuerpo del edge function) para poder
      // diagnosticar (clave inválida, API no habilitada, modelo no disponible…)
      // en vez de un genérico "estado 500".
      let detail = '';
      try {
        const raw = await response.text();
        try {
          const body = JSON.parse(raw);
          const d = body?.error?.message ?? body?.error ?? body?.message ?? raw;
          detail = typeof d === 'string' ? d : JSON.stringify(d);
        } catch {
          detail = raw;
        }
      } catch { /* sin cuerpo legible */ }
      return {
        data: null,
        error: new Error(
          `Edge Function falló con estado ${response.status}${detail ? `: ${detail.slice(0, 400)}` : ''}`,
        ),
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
