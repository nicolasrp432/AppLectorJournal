# Análisis profundo, estrategia de caching y procesamiento asíncrono

> App: **LectorApp** (Expo SDK 54 / React Native 0.81 / expo-router 6) · Backend **Supabase** · Estado **Zustand + AsyncStorage**

Este documento es el resultado de una auditoría dirigida del proyecto: queries, índices,
operaciones de render y red. Incluye **qué funciona bien**, **qué no**, una **estrategia de
caching** para no reprocesar lo mismo "mil veces", y un plan para mover **operaciones pesadas a
segundo plano** sin romper nada de lo ya construido.

La **Fase 0** (capa de caché + cola de tareas + arranque diferido) ya está implementada en este
mismo PR. El resto son patches incrementales listos para aplicar.

---

## 1. Arquitectura actual (resumen)

```
UI (expo-router screens) ──► Zustand stores ──► Supabase (Postgres + Auth + Edge Functions)
                                  │
                                  └──► persist() → AsyncStorage  (caché local automática)
```

- **14 stores Zustand**, todos con `persist()` a AsyncStorage (`lectorapp-*`). Esto ya da
  hidratación instantánea offline-first: la UI nunca espera a la red para mostrar datos.
- **Patrón de escritura optimista** en casi todos los stores: primero `set(...)` local, luego
  `await supabase...`. Bien planteado, pero el `await` remoto sigue en el camino crítico.
- **IA vía Edge Functions** (Gemini 2.5 Flash): análisis de lectura, generación de preguntas,
  flashcards, loci e imágenes, chat. Son las operaciones **más caras y lentas**.
- **`process-pdf`**: extracción de texto de PDF subido.

---

## 2. Qué funciona BIEN ✅

| Área | Por qué está bien |
|------|-------------------|
| **Persistencia offline-first** | `persist()` en los 14 stores → la UI se hidrata desde AsyncStorage al instante. |
| **Escrituras optimistas** | `library`, `profile`, `sessions`, `flashcards`, `loci` aplican el cambio local antes de la red. |
| **Índices de BD bien elegidos** | `sessions (user_id, finished_at DESC)`, `library_items (user_id, created_at DESC)`, `flashcards (deck_id, next_due)`, `decks/flashcard_sessions/notifications (user_id, … DESC)`. Cubren los filtros+orden reales. |
| **Caché persistente de IA (parcial)** | `reading_analyses` (UNIQUE por `library_item_id`) y `custom_reading_quizzes` (UNIQUE por `library_item_id, text_slice_hash`) evitan regenerar con Gemini. |
| **Selects parciales donde importa** | `useNodeStore` (`select('node_id')`), `useRewardsStore` (`reward_id, equipped`), `useAchievementsStore` (`reward_id`). |
| **Sin N+1** | `useLociStore` agrupa memorias con `.in('palace_id', […])` en vez de un query por palacio. |
| **`progreso.tsx` memoiza** | Las agregaciones de estadísticas usan `useMemo`. |
| **Límite de memoria en sesiones** | El store recorta a 200 sesiones. |

---

## 3. Qué NO funciona bien ⚠️ (hallazgos priorizados)

### 🔴 P0 — Re-fetch completo en cada evento de auth (el "mil veces" real)
**`app/_layout.tsx`** → `onAuthStateChange` llamaba a `syncUser` en **cada** evento de sesión.
Supabase emite `TOKEN_REFRESHED` periódicamente (cada ~1 h y al volver del background), y cada
uno disparaba **8 lecturas a Supabase** aunque los datos locales fueran de hace segundos. Además
el `getSession()` de arranque siempre re-leía todo.
**Impacto:** tráfico y trabajo redundante constante; jank en el primer frame.
**Estado:** ✅ **CORREGIDO en Fase 0** (ver §5).

### 🔴 P0 — Parsing de texto pesado en el hilo de UI
**`app/(tabs)/libros.tsx:27-56`** `handleCatalogPress`: por cada libro añadido del catálogo hace
`content.split(/\s+/).filter(Boolean).length` sobre **todo** el contenido del libro, en el tap.
Para libros grandes esto bloquea la UI.
**Fix:** mover el conteo de palabras a `runInBackground` o calcularlo una sola vez al importar y
persistir `words`. (Patch en §6.B)

### 🟠 P1 — `useSessionStore.list()` copia y **ordena** en cada llamada
**`store/useSessionStore.ts:29-36`**: cada `list()` hace `[...sessions]` + `.sort()`.
**`app/(tabs)/progreso.tsx`** lo llama 7 veces (`wpmTrend`), 7 veces (`sessionsByDay`) y otra para
el heatmap de 130 días → hasta ~15 ordenamientos de ~200 ítems por render del panel.
**Fix:** calcular **una** lista ordenada y bucketizar por día en una sola pasada O(n). (Patch §6.C)

### 🟠 P1 — `perfil.tsx`: agregaciones sin memoizar en cada render
**`app/(tabs)/perfil.tsx:157-162, 283-309`**: `totalMinutes`, `wpmSessions`, `maxWpm`,
`booksFinished`, `masteryAvg`, `getWeeklyXP`, `competitors` (¡con `.sort()`!) se recalculan en
**cada** render, incluido durante animaciones.
**Fix:** envolver en `useMemo` con deps correctas. (Patch §6.A)

### 🟠 P1 — IA sin dedup de llamadas en vuelo
Si un `useEffect` se re-dispara (cambio de deps, StrictMode, doble focus) puede invocar dos veces
la misma Edge Function antes de que la primera persista en caché → doble coste Gemini + latencia.
**Fix:** `dedupe(key, fn)` de `lib/taskQueue.ts`. (Patch §6.D)

### 🟡 P2 — Caché de análisis de lectura por `library_item_id`, no por contenido
**`components/exercises/FocalReading.tsx:87-126`** + migración `005`: `reading_analyses` es UNIQUE
por `library_item_id`. Si un mismo ítem tiene varios pasajes/fragmentos, todos comparten el mismo
análisis cacheado (posible análisis equivocado). El quiz sí lo hace bien (hash del slice).
**Fix:** añadir `text_slice_hash` a `reading_analyses` igual que en quizzes. (Patch §6.E)

### 🟡 P2 — Escrituras remotas en el camino crítico
Varios flujos hacen `await supabase...update/insert` tras el `set` optimista (`addXP`,
`updateProfile`, `library.insert/update`, `sessions.insert`). Si la red está lenta, el `await`
retrasa el `await` del llamador. Tampoco hay reintento si falla.
**Fix:** cola de mutaciones persistente con reintento (`enqueueMutation`). (Patch §6.F)

### 🟡 P2 — `select('*')` por defecto en listas grandes
`library_items`, `sessions`, `flashcards`, `notifications`, `loci_memories` traen todas las
columnas. `library_items.content` y `loci_memories.image_url` (base64) pueden ser **enormes**.
**Fix:** en listados, seleccionar sólo columnas de tarjeta; cargar `content`/`image_url` on-demand
al abrir el detalle. (Patch §6.G)

### 🟡 P2 — Sin paginación
`library`, `notifications`, `flashcards`, `decks`, `loci` traen **todo** el histórico. Hoy ok por
volumen bajo, pero crecerá. `sessions` sí limita a 50.
**Fix:** `.range()` + scroll infinito cuando los volúmenes suban.

### 🟢 P3 — Índices faltantes para queries existentes
- `loci_memories` se consulta por `.in('palace_id', …)` pero no hay índice en `palace_id`.
- `custom_reading_quizzes` / `reading_analyses` se consultan por `library_item_id` (cubierto por
  el UNIQUE en quizzes; ok).
**Fix:** `CREATE INDEX … ON loci_memories(palace_id);`. (Patch §6.H)

---

## 4. Estrategia de caching (principios)

El objetivo: **procesar/leer una vez y reutilizar**. Tres niveles, de más barato a más caro:

1. **Render (in-memory):** `useMemo`/`useCallback` para que las agregaciones se calculen una vez
   por cambio de datos, no por cada render. → §6.A, §6.C
2. **Sesión de app (in-memory):** `dedupe()` colapsa llamadas idénticas en vuelo (IA). → §6.D
3. **Persistente (AsyncStorage / Supabase):**
   - **Datos de usuario:** ya en AsyncStorage vía `persist()`. Lo que faltaba era **no
     revalidar si está fresco** → patrón **stale-while-revalidate (SWR)** con TTL por dataset
     (`lib/cache.ts`). La UI sirve la caché al instante; la red sólo se toca si el TTL expiró o si
     el usuario fuerza refresh. → §5
   - **Resultados de IA:** cachear por **hash del contenido** en Supabase (público), no por id de
     ítem, para reutilizar entre usuarios y entre pasajes. → §6.E

### TTLs propuestos (`lib/cache.ts`)
| Dataset | TTL | Razón |
|---------|-----|-------|
| profile, prefs, library, progress, sessions | **5 min** | Cambian dentro de la sesión del propio usuario. |
| rewards, achievements, nodes completados | **30 min** | Cambian rara vez. |
| conteo diario de sesiones | **1 min** | Volátil (límite free). |

`force: true` se usa en login explícito y en pull-to-refresh.

---

## 5. Fase 0 — Implementado en este PR ✅

### `lib/cache.ts` — frescura SWR/TTL
API: `isStale(key, ttl)`, `markFresh(key)`, `freshnessAge(key)`, `clearFreshness()`,
`swr(key, ttl, revalidate, {force})`. Guarda timestamps por clave bajo `lectorapp-fresh:` (con
caché en memoria). No toca ningún dato existente.

### `lib/taskQueue.ts` — trabajo en segundo plano
- `runInBackground(fn)` / `runAfterInteractions(fn)`: difieren con `InteractionManager` para no
  competir con el primer render ni con animaciones de navegación.
- `dedupe(key, fn)`: comparte una sola promesa entre llamadas idénticas en vuelo (clave para IA).
- **Cola de mutaciones persistente** (`enqueueMutation`, `flushMutations`, `pendingMutationCount`):
  escrituras a Supabase que sobreviven a reinicios, con reintento (backoff por intentos, máx 5) y
  descarte de errores permanentes (códigos 22/23/42). Es **opt-in**: nada la usa todavía salvo el
  flush de arranque.

### `app/_layout.tsx` — arranque stale-while-revalidate
`syncUser(userId, { force })` ahora:
1. Se ejecuta dentro de `runInBackground` → no bloquea el primer frame.
2. Hace `flushMutations()` para reintentar escrituras pendientes (offline-first).
3. Revalida **cada dataset sólo si su TTL expiró**, con claves namespaced por `userId`.
4. `force` sólo en login explícito (`SIGNED_IN`) o si cambió el usuario. **`TOKEN_REFRESHED` ya no
   re-lee todo.**

> Resultado: la app sigue mostrando los mismos datos al instante (hidratación de AsyncStorage),
> pero deja de golpear Supabase 8 veces en cada refresh de token / arranque caliente.

---

## 6. Patches incrementales propuestos (Fase 1+)

> Cada uno es independiente, aditivo y de bajo riesgo. Orden sugerido por impacto/esfuerzo.

### A. Memoizar agregaciones en `perfil.tsx` (P1, trivial)
Envolver `totalMinutes`, `wpmSessions`, `maxWpm`, `booksFinished`, `masteryAvg`, `getWeeklyXP` y
`competitors` en `useMemo([...], [sessions, libraryItems, progress])`. Cero cambio funcional.

### B. Conteo de palabras fuera del hilo de UI (`libros.tsx`, P0)
```ts
// en handleCatalogPress, en vez de contar en el tap:
runInBackground(async () => {
  const words = content.split(/\s+/).filter(Boolean).length;
  await library.update(id, { words });
});
```
O mejor: precalcular `words` una sola vez al importar y persistirlo (ya hay columna `words`).

### C. `progreso.tsx`: una sola pasada para series temporales (P1)
Reemplazar los ~15 `list()` por **un** `list({ since: hace130días })` ya ordenado y bucketizar por
día con un `Map<fecha, agregado>` en una pasada O(n). Alimenta heatmap, `wpmTrend` y `sessionsByDay`.

### D. Dedup de IA (P1)
```ts
import { dedupe } from '../../lib/taskQueue';
const { data, error } = await dedupe(
  `ai-questions:${book.id}:${sliceHash}`,
  () => invokeEdgeFunction('ai-questions', { text, itemId: book.id }),
);
```
Aplicar en `reader/[id].tsx`, `ComprehensionEx.tsx`, `FocalReading.tsx`, `flashcards/create.tsx`,
`loci/create.tsx`.

### E. Caché de análisis por hash de contenido (P2)
Migración: añadir `text_slice_hash TEXT` a `reading_analyses`, UNIQUE `(library_item_id,
text_slice_hash)`; en `FocalReading.tsx` filtrar también por hash (igual que el quiz).

### F. Migrar escrituras a la cola persistente (P2)
En los stores, sustituir `await supabase.from(t).update(p).eq('id', id)` por
`enqueueMutation({ table: t, type: 'update', payload: p, match: { id } })`. El `set` optimista se
mantiene; la mutación se confirma/reintenta en segundo plano y sobrevive a cierres de app.

### G. Selects parciales en listados (P2)
`library`: `select('id,title,author,kind,words,progress,last_read_at,cover_color,source,created_at')`
(sin `content`); cargar `content` al abrir el lector. `loci`: listar sin `image_url`.

### H. Índice faltante (P3)
```sql
CREATE INDEX IF NOT EXISTS idx_loci_memories_palace ON public.loci_memories(palace_id);
```

---

## 7. Verificación

- `npx tsc --noEmit`: los archivos nuevos y `_layout.tsx` compilan limpio. (Quedan 3 errores
  **preexistentes** ajenos a este cambio: `Haptics` en `progreso.tsx` y `disabled` en
  `AIChatbot.tsx`.)
- Sin `node_modules` el typecheck falla en todo; este PR asume `npm install` previo.
- **Prueba manual sugerida:** abrir la app dos veces seguidas → la segunda no debe disparar las 8
  lecturas (revisar Network/logs); pull-to-refresh y login sí deben forzar.

---

## 8. Roadmap resumido

| Fase | Contenido | Estado |
|------|-----------|--------|
| **0** | `lib/cache.ts`, `lib/taskQueue.ts`, arranque SWR diferido | ✅ Este PR |
| **1** | §6.A (memoización perfil), §6.B (parsing async), §6.C (progreso 1 pasada), §6.D (dedup IA) | Pendiente |
| **2** | §6.E (caché IA por hash), §6.F (cola de escrituras en stores), §6.G (selects parciales) | Pendiente |
| **3** | §6.H (índice), paginación con `.range()` | Pendiente |
