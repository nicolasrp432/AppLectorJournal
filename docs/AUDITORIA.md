# Auditoría técnica — AppLectorJournal

> Análisis de estructura, calidad y seguridad. Hallazgos priorizados por impacto/esfuerzo.
> Stack: Expo SDK 54 · React Native 0.81 · expo-router 6 · React 19 · Zustand · Supabase · RevenueCat.

**Leyenda de estado:** ✅ resuelto en esta rama · ⬜ pendiente (seguimiento)

---

## 🔴 P0 — Limpieza de repositorio  ✅ resuelto

| # | Hallazgo | Acción |
|---|----------|--------|
| 1 | ✅ 17 MB de artefactos de build commiteados (`bundle.js`, `exact_bundle.js`) y sin gitignore. | Eliminados + añadidos a `.gitignore`. |
| 2 | ✅ 6.085 líneas de código muerto: 24 ficheros `lib/*.jsx` (prototipos del handoff) con **0 referencias**. | Eliminados. La lógica viva en `lib/` es TS. |
| 3 | ✅ Plantilla Expo por defecto sin usar (`App.tsx`, `index.ts`); entrypoint real es `expo-router/entry`. | Eliminados. |
| 4 | ✅ Ficheros sueltos de scratch y `.md` de planificación en la raíz. | Movidos a `docs/`; scratch eliminado. |

## 🟠 P1 — Tooling de calidad  ✅ resuelto (base)

| # | Hallazgo | Acción |
|---|----------|--------|
| 5 | ✅ Sin ESLint ni Prettier (pese a comentarios `eslint-disable` en el código). | `eslint-config-expo` (flat) + Prettier + scripts `lint`/`format`/`typecheck`. |
| 6 | ✅ Cero tests sobre lógica pura crítica (`sm2.ts`, `xpEngine.ts`, `adaptLevel.ts`). | `jest-expo` + 14 tests semilla (sm2, xpEngine), verde. |
| 7 | ⬜ Sin CI. | Pendiente: workflow `typecheck + lint + test` en cada PR. |

> Baseline actual de `eslint .`: **46 errores / 223 warnings** de código preexistente. Es el punto de partida a reducir (ver P2).

## 🟡 P2 — Disciplina de TypeScript / runtime  ⬜ pendiente

| # | Hallazgo | Acción sugerida |
|---|----------|-----------------|
| 8 | ~103 usos de `any` explícito; erosiona el `strict: true`. Origen frecuente: `noopQuery()` en `lib/supabase.ts`. | Tipar progresivamente; priorizar `store/` y capa de datos. |
| 9 | 85 `console.*` en 29 ficheros sin abstracción. | Logger silenciado con `__DEV__` o `babel-plugin-transform-remove-console` en build de producción. |
| 10 | ✅ Validación de entorno: `lib/supabase.ts` cae a cliente "noop" silencioso si faltan vars. | Añadido `.env.example`. ⬜ Pendiente: aviso visible en builds no-dev. |

## 🟢 P3 — Arquitectura / mantenibilidad  ⬜ pendiente

| # | Hallazgo | Acción sugerida |
|---|----------|-----------------|
| 11 | Pantallas gigantes que mezclan lógica, estilos y datos: `app/(tabs)/ruta.tsx` (2.526 líneas), `perfil.tsx` (2.011), `lesson/[id].tsx` (1.971), `exercise/[id].tsx` (1.472), `progreso.tsx` (1.022). | Extraer subcomponentes, hooks de lógica y `StyleSheet` a ficheros aparte. |
| 12 | 14 stores Zustand. **Sin colisión** de persistencia (claves distintas: `lectorapp-progress`/`-nodes`/`-sessions`), pero solapamiento conceptual de responsabilidades. | Documentar el modelo de dominio y consolidar donde aplique. |
| 13 | ✅ Mezcla de extensiones. Tras P0, el único `.js` restante es `lib/reanimated.web.stub.js` (justificado). | Mantener todo en TS. |

---

## 🔒 P1.5 — Seguridad backend (Supabase)  — análisis profundo

### Positivo
- **RLS habilitado en las 15 tablas** (migraciones 001–006) con políticas por `auth.uid()`.
- `process-pdf` **limita el input a 120.000 caracteres** (evita crash por memoria / coste desbocado).

### ⬜ Riesgo: edge functions de IA sin autorización de usuario ni rate limiting

Las 7 edge functions (`ai-chat`, `ai-flashcards`, `ai-questions`, `ai-analyze-reading`,
`ai-loci-split`, `ai-loci-images`, `process-pdf`) **no validan el usuario en su cuerpo**
(no hay `supabase.auth.getUser()` ni `createClient` con el token entrante). El cliente las
invoca con la clave **anon pública** como fallback (`lib/supabase.ts`:
`const token = session?.access_token ?? SUPABASE_ANON`), por lo que cualquiera con esa clave
pública puede invocarlas.

Combinado con:
- `Access-Control-Allow-Origin: '*'` en todas,
- **sin rate limiting** por usuario,
- cada llamada consume **APIs de Gemini de pago**,

se expone un vector de **abuso de coste** (un tercero puede agotar la cuota/facturación de Gemini).

**Mitigaciones sugeridas (orden de impacto):**
1. Validar el JWT del usuario dentro de cada función:
   ```ts
   const authHeader = req.headers.get('Authorization');
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
     global: { headers: { Authorization: authHeader! } },
   });
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
   ```
   y dejar de usar la clave anon como token de fallback en `invokeEdgeFunction`.
2. Rate limiting por `user.id` (tabla de contadores o Upstash/Redis).
3. Restringir `Access-Control-Allow-Origin` al dominio de la app en producción.
4. Validar tamaño/forma del payload (`messages`) antes de llamar al modelo.

---

## Resumen ejecutivo

- **Hecho en esta rama:** P0 completo (repo 17 MB más ligero, 6 k líneas muertas fuera) + base de P1 (lint, format, typecheck, tests, `.env.example`).
- **Mayor riesgo abierto:** abuso de coste en las edge functions de IA (P1.5) → recomendado abordar pronto.
- **Mayor deuda de mantenibilidad:** pantallas de 1–2,5 k líneas (P3) y ~103 `any` (P2).
- **Siguiente paso de menor esfuerzo/mayor valor:** workflow de CI (P1 #7) para fijar el baseline de calidad y evitar regresiones.
