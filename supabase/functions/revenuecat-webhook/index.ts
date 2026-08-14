// Webhook de RevenueCat → entitlement premium en Supabase.
//
// Es la pieza que faltaba para cerrar el circuito de pagos. Antes el *cliente*
// escribía `subscription_tier: 'premium'` en la tabla `profiles` tras una
// compra; como la política RLS de 001 permitía a cualquiera actualizar sus
// propias columnas, eso convertía el premium en auto-otorgable. Desde
// 012_subscription_entitlements.sql el cliente ya no puede escribir esas
// columnas: solo esta función, con la service key, vía `set_entitlement()`.
//
// CONFIGURACIÓN (RevenueCat → Project Settings → Integrations → Webhooks):
//   URL              https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
//   Authorization    el mismo valor que el secreto REVENUECAT_WEBHOOK_SECRET
//
// Secretos requeridos:
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET="<cadena larga aleatoria>"
//   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta la plataforma)
//
// Desplegar SIN verificación de JWT — RevenueCat no envía un JWT de Supabase:
//   supabase functions deploy revenuecat-webhook --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/** Tipos de evento que dejan al usuario con la suscripción vigente. */
const GRANTING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
  "PRODUCT_CHANGE",
]);

/** Eventos que revocan el acceso de inmediato. */
const REVOKING_EVENTS = new Set([
  "EXPIRATION",
  "REFUND",
  "SUBSCRIPTION_PAUSED",
]);

/**
 * CANCELLATION no revoca: el usuario canceló la renovación pero conserva el
 * acceso hasta `expiration_at_ms`. Tratarlo como revocación era quitarle el
 * premio a alguien que aún ha pagado por él.
 */
const BILLING_ISSUE_EVENT = "BILLING_ISSUE";

interface RCEvent {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  expiration_at_ms?: number | null;
  entitlement_ids?: string[] | null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // --- Autenticación del webhook ------------------------------------------
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expected) {
    console.error("[rc-webhook] Falta REVENUECAT_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }
  // RevenueCat manda el valor tal cual en la cabecera Authorization.
  if (req.headers.get("Authorization") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  let event: RCEvent;
  try {
    const body = await req.json();
    event = body?.event ?? {};
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const type = event.type ?? "";
  // `app_user_id` es el id de Supabase gracias a `Purchases.logIn(user.id)`.
  // Si sigue siendo anónimo ($RCAnonymousID:...) no hay a quién conceder nada.
  const rcUserId = event.app_user_id ?? event.original_app_user_id ?? "";

  if (!isUuid(rcUserId)) {
    // 200 para que RevenueCat no reintente eternamente un evento inservible.
    console.warn(`[rc-webhook] app_user_id no es un UUID de Supabase: ${rcUserId}`);
    return new Response(JSON.stringify({ ok: true, skipped: "anonymous_user" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let tier: string;
  let status: string;

  if (GRANTING_EVENTS.has(type)) {
    tier = "premium";
    status = "active";
  } else if (REVOKING_EVENTS.has(type)) {
    tier = "free";
    status = type === "REFUND" ? "cancelled" : "expired";
  } else if (type === BILLING_ISSUE_EVENT) {
    // Periodo de gracia: se mantiene el acceso mientras se reintenta el cobro.
    tier = "premium";
    status = "in_grace";
  } else if (type === "CANCELLATION") {
    // Conserva el acceso hasta la fecha de expiración ya conocida.
    tier = "premium";
    status = "cancelled";
  } else {
    return new Response(JSON.stringify({ ok: true, ignored: type }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { error } = await admin.rpc("set_entitlement", {
    p_user_id:    rcUserId,
    p_tier:       tier,
    p_status:     status,
    p_expires_at: expiresAt,
    p_rc_user_id: rcUserId,
  });

  if (error) {
    console.error("[rc-webhook] set_entitlement falló:", error);
    // 500 → RevenueCat reintenta, que es lo que queremos ante un fallo transitorio.
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, type, tier, status }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
