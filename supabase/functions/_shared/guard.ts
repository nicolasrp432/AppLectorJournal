// Helper compartido por las Edge Functions: autenticación por JWT de usuario,
// CORS restringible por entorno y rate limiting por usuario.
//
// Antes, las funciones aceptaban cualquier petición (la clave anon pública
// basta para atravesar el gateway) con CORS '*' y sin límite, exponiendo las
// APIs de IA de pago a abuso. Ver docs/AUDITORIA.md (P1.5).
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Lista blanca de orígenes (coma-separada) en el secreto ALLOWED_ORIGINS.
// Si está vacía, se mantiene '*' (compatibilidad), pero conviene fijarla en prod.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  let allowOrigin = '*';
  if (ALLOWED_ORIGINS.length > 0) {
    allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

export interface GuardResult {
  user: { id: string };
  supabase: SupabaseClient;
}

interface GuardOptions {
  /** Nombre lógico de la función (clave del contador de cuota). */
  fn?: string;
  /** Máximo de invocaciones permitidas por ventana. */
  limit?: number;
  /** Tamaño de la ventana en segundos (p.ej. 3600 = 1h). */
  windowSec?: number;
}

/**
 * Valida que la petición venga de un usuario autenticado y, opcionalmente,
 * aplica un límite de uso por usuario. Devuelve `{ user, supabase }` o una
 * `Response` lista para retornar (401/429/500).
 */
export async function guard(req: Request, opts: GuardOptions = {}): Promise<GuardResult | Response> {
  const origin = req.headers.get('Origin');
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return jsonResponse({ error: 'Backend mal configurado: faltan variables de Supabase.' }, 500, origin);
  }
  if (!token) {
    return jsonResponse({ error: 'No autorizado: falta la sesión de usuario.' }, 401, origin);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return jsonResponse({ error: 'No autorizado: sesión inválida o expirada.' }, 401, origin);
  }

  // Rate limiting por usuario (best-effort: si el RPC falla, no bloqueamos).
  if (opts.fn && opts.limit && opts.windowSec) {
    const { data: allowed, error: rlErr } = await supabase.rpc('consume_ai_quota', {
      p_fn: opts.fn,
      p_limit: opts.limit,
      p_window_sec: opts.windowSec,
    });
    if (!rlErr && allowed === false) {
      return jsonResponse(
        { error: 'Has alcanzado el límite de uso de IA por ahora. Inténtalo de nuevo en un rato.' },
        429,
        origin,
      );
    }
  }

  return { user, supabase };
}
