# Guía de Integración y Variables de Entorno en Producción: LectorApp

Esta guía detalla la configuración técnica completa, las variables de entorno necesarias y los pasos para llevar **LectorApp** a producción de forma robusta y 100% funcional.

---

## 📋 Lista Maestra de Credenciales y API Keys

Para que todos los flujos de la aplicación funcionen en producción (Autenticación con Google, Correo con Resend, Pagos con Stripe/RevenueCat, y Base de Datos con Supabase), debes configurar los siguientes valores.

### 1. Variables de Cliente (Expo / Frontend)
Crea o actualiza el archivo `.env.local` en la raíz de tu proyecto Expo con las siguientes variables:

```env
# ── CONFIGURACIÓN DE SUPABASE ───────────────────────────────────────
# URL del proyecto y clave anónima pública de Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── AUTENTICACIÓN DE GOOGLE (OAuth 2.0) ──────────────────────────────
# IDs de cliente obtenidos en Google Cloud Console para cada plataforma
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=tu-google-client-id-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=tu-google-client-id-ios.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=tu-google-client-id-android.apps.googleusercontent.com

# ── PASARELA DE PAGOS DE STRIPE (WEB) ───────────────────────────────
# Clave pública de Stripe para procesar los tokens de tarjeta de crédito
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# ── COMPRAS IN-APP CON REVENUECAT (MÓVIL) ───────────────────────────
# Claves públicas de SDK de RevenueCat para sincronizar compras móviles
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=rc_ios_...
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=rc_android_...
```

---

### 2. Variables de Servidor (Supabase Edge Functions / Backend)
Estas variables **nunca** deben exponerse en el cliente Expo. Se configuran dentro del panel de Supabase (Settings > API > Edge Function Secrets) o usando la CLI de Supabase:

```bash
# Ejecutar desde tu terminal local para subir secretos a Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set RESEND_API_KEY=re_...
```

---

## 🛠️ Guía Paso a Paso para Obtener las Credenciales

### Paso 1: Configurar Supabase
1. Ingresa a tu panel en [Supabase Console](https://supabase.com).
2. Crea un proyecto nuevo o selecciona el actual.
3. Ve a **Project Settings > API** para copiar tu `SUPABASE_URL` y tu `anon public` key.
4. Para habilitar **Resend/SMTP**:
   * Ve a **Settings > Providers > Email**.
   * Habilita el envío SMTP usando los servidores de Resend (`smtp.resend.com`, puerto `587`, usuario `resend`, contraseña tu `RESEND_API_KEY`).
   * Configura tu dominio verificado para evitar que los correos caigan en spam.

### Paso 2: Autenticación con Google (Google Sign-In)
1. Entra a [Google Cloud Console](https://console.cloud.google.com).
2. Crea un proyecto nuevo para **LectorApp**.
3. Ve a **API & Services > Credentials** y pulsa **Create Credentials > OAuth client ID**:
   * **Cliente Web**: Utilizado para despliegues web y desarrollo Expo local. Agrega `https://auth.expo.io` y el dominio de Vercel a los orígenes autorizados.
   * **Cliente iOS**: Configura el ID del bundle de tu app (ej. `com.lectorapp.app`).
   * **Cliente Android**: Configura el nombre del paquete de Android y agrega la firma SHA-1 (puedes obtenerla ejecutando `eas credentials` en tu terminal).

### Paso 3: Configurar Stripe (Suscripciones y Webhooks)
1. Entra a tu dashboard de [Stripe](https://dashboard.stripe.com).
2. Obtén tus claves `pk_live_` (pública) y `sk_live_` (privada).
3. Crea un **Producto recurrente** (ej. "LectorApp Premium" a **$4.99/mes**).
4. Configura el **Webhook de Stripe**:
   * Apunta la URL a tu Edge Function de Supabase: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`.
   * Agrega los siguientes eventos para escuchar actualizaciones de pago:
     * `customer.subscription.created`
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
     * `invoice.payment_succeeded`
   * Copia el **Signing Secret** (`whsec_...`) y súbelo a Supabase Edge Secrets.

### Paso 4: Configurar Resend (Correos Transaccionales)
1. Regístrate en [Resend](https://resend.com).
2. Ve a **Domains** y verifica el dominio de tu aplicación agregando los registros DNS indicados (SPF, DKIM, MX).
3. Ve a **API Keys** y genera una clave con permisos de envío. Esta clave se usará tanto en Supabase SMTP como en tus Edge Functions.

---

## 👑 Cómo Otorgar Acceso Premium Manualmente (Bypass de Pasarela)

Diseñamos una arquitectura flexible en el Zustand store (`useProfileStore.ts`) que valida el estado Premium basándose en dos campos en la tabla `public.profiles`:
1. `subscription_tier`: `'free'` o `'premium'`.
2. `subscription_status`: `'active'`, `'inactive'`, etc.

Si deseas regalar la suscripción Premium a cualquier usuario manualmente (sin que pase por Stripe o RevenueCat), sigue estos pasos:

### Opción A: Desde el Editor de Tabla de Supabase (Fácil)
1. Ve a **Supabase Dashboard > Table Editor > profiles**.
2. Localiza la fila del usuario usando su correo electrónico o su ID.
3. Cambia el valor de la columna `subscription_tier` de `'free'` a `'premium'`.
4. Cambia el valor de `subscription_status` a `'active'`.
5. Pulsa **Save**. El usuario tendrá acceso inmediato e ilimitado la próxima vez que abra o actualice la aplicación.

### Opción B: Ejecutando una Consulta SQL
Si prefieres hacerlo mediante código o base de datos, entra a **Supabase SQL Editor** y ejecuta:

```sql
UPDATE public.profiles
SET 
  subscription_tier = 'premium',
  subscription_status = 'active',
  subscription_expires_at = NULL -- Acceso ilimitado de por vida
WHERE email = 'correo-del-usuario@gmail.com';
```

---

## 🚀 Checklist Final de Lanzamiento

* [ ] Las tablas de Supabase tienen habilitadas políticas RLS (Row Level Security).
* [ ] Las variables de entorno de producción están configuradas en Vercel (para Web).
* [ ] Las variables de entorno están cargadas en Expo Application Services (`eas.json` o EAS Secrets).
* [ ] El webhook de Stripe está activo y en modo "Live".
* [ ] Has verificado que `isPremium()` se resuelve instantáneamente en el cliente al modificar la base de datos.
