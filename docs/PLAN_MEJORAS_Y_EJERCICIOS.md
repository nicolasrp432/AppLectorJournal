# Plan de trabajo — Mejoras técnicas + Lógica de ejercicios

> Dos líneas de trabajo **en paralelo**:
> - **Track A — Aplicar mejoras técnicas** (deuda y seguridad de `docs/AUDITORIA.md`).
> - **Track B — Lógica de ejercicios**: hacerla sólida, robusta para todos los usuarios y de dificultad progresiva, con un **rediseño profundo del Método Loci**.
>
> Este documento es el plan; la implementación se ejecuta por fases con hitos verificables.

---

## Estado de ejecución

✅ **Hecho** (en esta rama, con `tsc` limpio y 51 tests verdes):
- **A1 — CI**: workflow `typecheck`+`test` (gates) y `lint` (advisory).
- **A2 — Seguridad de edge functions**: validación de JWT de usuario, CORS por allowlist y rate limiting por usuario (`_shared/guard.ts`, migración `009`, cliente). ⚠️ requiere `supabase functions deploy` + aplicar la migración.
- **B1 — Motor adaptativo**: histéresis/confirmación, umbrales por ejercicio, uso real de `mastery` (`lib/adaptLevel.ts` + 14 tests).
- **B2 — Estudio autoguiado del Loci**: eliminado el auto-avance por temporizador (el "pasa muy rápido").
- **B2 — Lógica de recuerdo** (`lib/loci.ts`): matching difuso + scoring ordenado/libre (15 tests).
- **B2 — Recuerdo libre en el ejercicio principal**: niveles 3+ recorren la ruta y eligen el objeto de un banco barajado; niveles bajos siguen con reconocimiento.
- **B2 — Palacios pre-hechos**: 3 palacios de ejemplo jugables sin crear nada.
- **B2 — Creación guiada**: el usuario escribe sus propias asociaciones (IA opcional).
- **B2 — Modo tutorial**: enseña los 4 principios con un mini-ejemplo activo.
- **B2 — Recuerdo ordenado/demorado + repaso SM-2**: nivel 5 con recorrido ordenado sin pista y fase distractora antes del recuerdo; el resultado programa el repaso espaciado del palacio con `lib/sm2.ts` (`scoreToQuality`/`isDue` en `lib/loci.ts`, `reviewPalace`/`getDuePalaces` en `useLociStore`, migración `010`, sección "Repasar hoy" + badge en `app/loci/view.tsx`). ⚠️ requiere aplicar la migración `010`. (20 tests de `loci.ts`.)

⬜ **Pendiente**: Track A restante (A3 logger, A4 `any`, A5 refactor pantallas).

---

## Contexto

La app ya tiene la base de P0+P1 hecha (limpieza + tooling). Ahora el foco es la **calidad funcional**: que los ejercicios funcionen bien para cualquier usuario, que la dificultad suba de forma progresiva y justa, y que el **Método Loci** deje de ser un drill pasivo que "pasa las imágenes muy rápido" y se convierta en una **verdadera experiencia de construir palacios mentales** de lo que el usuario quiera memorizar — con palacios ya creados para practicar de inmediato.

Ambos tracks son independientes en el código (Track A toca config/seguridad/tipos; Track B toca `components/exercises/`, `lib/adaptLevel.ts`, `constants/`), por lo que pueden avanzar sin bloquearse.

---

# Track A — Aplicar mejoras técnicas

Orden por impacto/esfuerzo. Detalle completo en `docs/AUDITORIA.md`.

| Fase | Tarea | Ficheros clave | Hito verificable |
|------|-------|----------------|------------------|
| A1 | **CI** (`typecheck + lint + test`) en cada PR | `.github/workflows/ci.yml` | El workflow corre verde en la PR |
| A2 | **Seguridad edge functions**: validar JWT del usuario, rate limiting por `user.id`, CORS restringido | `supabase/functions/*/index.ts`, `lib/supabase.ts` (dejar de usar anon como token de fallback) | Llamada sin sesión válida → 401; con sesión → 200 |
| A3 | **Logger** que se silencia con `__DEV__` (sustituir 85 `console.*`) | nuevo `lib/logger.ts`, sustituciones | `eslint` sin `no-console`; consola limpia en prod |
| A4 | **Reducir `any`** (~103) priorizando `store/` y capa de datos; tipar `noopQuery()` | `lib/supabase.ts`, `store/*` | baseline de `eslint` baja de 46 errores |
| A5 | **Refactor de pantallas gigantes** (extraer subcomponentes/hooks/estilos) | `app/(tabs)/ruta.tsx` (2.5k), `perfil.tsx`, `lesson/[id].tsx` | ningún fichero de pantalla > ~600 líneas |

> A1 y A2 primero: fijan el baseline de calidad y cierran el mayor riesgo (abuso de coste de las APIs de IA de pago).

---

# Track B — Lógica de ejercicios

## B1 · Motor de dificultad sólido y progresivo

### Diagnóstico (estado actual)
- `lib/adaptLevel.ts` usa **una sola heurística global** (`score≥0.85` sube, `<0.55` baja, resto mantiene) idéntica para todos los ejercicios, cuyo "score" significa cosas distintas en cada uno.
- **Sin confirmación/histéresis**: un único intento afortunado salta de nivel; uno malo lo baja. El parámetro `_mastery` se recibe pero **no se usa**.
- **Sin calibración por usuario** más allá del `reading_test`; los niveles de WPM (200→500) son fijos, no personalizados desde el diagnóstico.
- En **Loci** solo se adapta `count`; el `studyMs` está **hardcodeado a 4000ms** (`app/exercise/[id].tsx:151`) en todos los niveles.

### Rediseño propuesto
1. **Motor adaptativo con confianza (histéresis).** Sustituir el salto inmediato por una media móvil de los últimos N intentos + racha:
   - Subir nivel solo tras **2 resultados consecutivos** ≥ umbral-subida (evita saltos por suerte).
   - Bajar tras 2 consecutivos < umbral-bajada (evita frustración por un mal día).
   - Usar de verdad `mastery` (0–1) como acumulador que decide cuándo consolidar el nivel.
2. **Umbrales por ejercicio** en `constants/difficulty.ts` (cada ejercicio define `thresholdUp`/`thresholdDown`), no constantes globales.
3. **Calibración inicial**: el `reading_test` fija el nivel de partida de `reading` (y un offset global de dificultad) en `useProfileStore`, en vez de empezar todos en nivel 1.
4. **Parámetros progresivos completos por nivel**: que cada nivel module *todas* las variables relevantes (en Loci: `count`, presupuesto de estudio, modo de recuerdo, pistas), no solo una.
5. **Robustez para todos los usuarios**: clamping de niveles, manejo de `score` indefinido/cero-intentos, y un "modo accesible" (más tiempo) ligado a `useReducedMotion`/prefs.

| Ficheros | Cambio |
|----------|--------|
| `lib/adaptLevel.ts` | Nueva lógica con histéresis + uso de `mastery`; tests unitarios (extiende el patrón de `lib/__tests__/`). |
| `constants/difficulty.ts` | Umbrales por ejercicio + parámetros por nivel completos (Loci incluye `studyMs`/modo de recuerdo). |
| `app/exercise/[id].tsx` | Leer `studyMs`/modo desde el nivel, no hardcodeado. |
| `store/useProfileStore.ts` | Persistir nivel de partida calibrado por el test. |

**Hito B1:** tests de `adaptLevel` verdes que cubren subida/bajada con confirmación, clamping y uso de mastery; Loci recibe parámetros por nivel.

---

## B2 · Rediseño del Método Loci (foco principal)

### Diagnóstico (por qué "no funciona bien")
1. **Temporizador que auto-avanza** (`LociExercise.tsx:180-187`, `studyMs=4000`): empuja al usuario aunque no haya interiorizado la asociación → *"pasa las imágenes muy rápido"*. Existe botón "Siguiente" pero el timer dispara igual.
2. **Experiencia pasiva**: la app inventa habitaciones (`ROOM_THEMES`), objetos (`LOCI_OBJECTS`), la historia (`getSurrealLociAssociation`) e incluso la imagen IA. El usuario **solo toca** la habitación correcta → entrena reconocimiento espacial, **no** la técnica.
3. **No enseña la técnica**: nunca se explican ni se practican los principios del palacio de memoria (ruta familiar, orden, asociaciones vívidas/absurdas/multisensoriales, recorrido mental para recordar).
4. **Creación desconectada**: `app/loci/create.tsx` + `useLociStore` + edge functions sí permiten crear palacios, pero (a) están separados del ejercicio y (b) la IA hace **toda** la descomposición y las historias — el usuario tampoco construye nada.

### Principios del Método de Loci a respetar (investigación)
El método (Simónides / "journey method" / "mind palace") funciona porque el cerebro recuerda **lugares y rutas** mejor que listas. Reglas clave que el ejercicio debe enseñar y practicar activamente:
- **Ruta familiar y ordenada**: usar un lugar que el usuario conoce, recorrido en un orden fijo y repetible.
- **Un locus, un ítem**: anclar cada dato a una ubicación concreta del recorrido.
- **Asociación memorable**: imágenes **vívidas, exageradas, absurdas, en movimiento y multisensoriales** (el usuario las crea, no se las dan hechas).
- **Recorrido para recordar**: "caminar" mentalmente la ruta en orden para recuperar.
- **Repaso espaciado**: revisitar el palacio en el tiempo (engancha con el motor SM-2 ya existente, `lib/sm2.ts`).

### Nueva experiencia (de pasiva → construcción activa)
El ejercicio se reorganiza en **modos**, con dificultad progresiva (ligada a B1):

**1) Modo Tutorial / Onboarding (primera vez y nivel 1)**
- Enseña los 4 principios con un mini-ejemplo activo de **3 loci**: el usuario elige el palacio, **escribe o elige** su propia asociación para cada locus (con sugerencia IA opcional), y luego recuerda. Cero presión de tiempo.

**2) Modo Construcción guiada ("crea el palacio de lo que quieras")**
- El usuario indica **qué quiere memorizar** (lista libre, tema, o pega texto) y elige/usa un **palacio** (preset o propio).
- Para cada locus, **el usuario construye la asociación**: escribe su imagen mental y, opcionalmente, pide a la IA una **sugerencia** (no la respuesta por defecto) o una imagen generada. La autoría es del usuario → es ahí donde se aprende.
- Reutiliza `useLociStore.createPalace`, `app/loci/create.tsx` (se integra como modo del ejercicio) y, para la sugerencia, `ai-loci-split`/`ai-loci-images` **como ayuda opcional**, no como generador único.

**3) Modo Práctica con palacios pre-construidos**
- Catálogo de **palacios de ejemplo listos** (p.ej. "Los 8 planetas", "Lista de la compra", "Fechas clave") empaquetados a partir de `ROOM_THEMES` + contenidos de `constants/lociPresets.ts`, para practicar **sin tener que crear** uno primero.

**4) Fase de Estudio — autoguiada (arregla el problema central)**
- **Eliminar el auto-avance por timer.** El usuario avanza con "Siguiente" cuando ha fijado la imagen.
- El tiempo pasa a ser un **presupuesto opcional y visible** (barra que se puede pausar), no un corte forzado; en niveles altos se reduce el presupuesto como reto, pero nunca corta a media imagen.
- Botón "Necesito más tiempo" / repetir locus.

**5) Fase de Recuerdo — recuerdo real y progresivo**
- Nivel bajo: reconocimiento (tocar habitación) — como ahora.
- Nivel medio: **recuerdo libre** — el usuario "recorre" la ruta y **escribe/selecciona** el ítem de cada locus (banco barajado), con verificación difusa.
- Nivel alto: **recuerdo ordenado del recorrido completo** sin pistas, y opción de **recuerdo demorado** (tras un distractor) que alimenta el repaso espaciado SM-2.

### Progresión de dificultad del Loci (concreta)
| Nivel | Loci | Estudio | Asociación | Recuerdo |
|-------|------|---------|-----------|----------|
| 1 (tutorial) | 3 | Libre, sin límite | IA sugiere, usuario confirma | Tocar habitación |
| 2 | 5 | Libre | Usuario escribe (IA opcional) | Tocar habitación |
| 3 | 6 | Presupuesto suave | Usuario escribe | Recuerdo libre (escribir/banco) |
| 4 | 7 | Presupuesto + ajustado | Usuario escribe, sin pista | Recorrido ordenado |
| 5 | 8–10 | Reto | Usuario escribe, sin pista | Recorrido ordenado + demorado (SM-2) |

### Ficheros clave (Track B2)
| Fichero | Cambio |
|---------|--------|
| `components/exercises/LociExercise.tsx` | Reescritura de la lógica: quitar auto-timer; introducir modos (tutorial/guiado/preset); estudio autoguiado; recuerdo libre/ordenado. Separar lógica de presentación. |
| nuevo `lib/loci.ts` | Lógica pura del Loci (selección de loci, verificación difusa de recuerdo, scoring, planificación de repaso) → **testeable** con Jest. |
| `constants/lociPresets.ts` | Empaquetar **palacios pre-construidos** nombrados, listos para practicar. |
| `app/loci/create.tsx` + `store/useLociStore.ts` | Integrar la creación como **modo del ejercicio**; permitir asociaciones **autoradas por el usuario** (IA opcional). |
| `app/exercise/[id].tsx` | Pasar nivel/modo y parámetros (sin `studyMs` fijo). |
| `lib/sm2.ts` (reutilizar) | Programar el repaso espaciado de palacios. |
| `supabase/functions/ai-loci-*` | Pasar a rol de **asistente opcional** (sugerencia/imagen bajo demanda), tras el endurecimiento de A2. |

**Hito B2:**
- No existe ningún auto-avance temporizado en la fase de estudio.
- El usuario puede crear un palacio de un tema libre **escribiendo sus propias asociaciones**.
- Hay ≥3 palacios pre-construidos jugables sin crear nada.
- El recuerdo incluye recuerdo libre/ordenado además del de tocar.
- `lib/loci.ts` con tests verdes.

---

## Cronograma sugerido (paralelo)

| Sprint | Track A | Track B |
|--------|---------|---------|
| 1 | A1 (CI) + A2 (seguridad edge functions) | B1 motor adaptativo + tests |
| 2 | A3 (logger) | B2 fase estudio autoguiada + recuerdo libre (arregla "muy rápido") |
| 3 | A4 (reducir `any`) | B2 construcción guiada (asociaciones del usuario) + palacios preset |
| 4 | A5 (refactor pantallas) | B2 recuerdo ordenado/demorado + repaso SM-2 |

---

## Verificación end-to-end
- **Track A:** CI verde; `curl` a una edge function sin sesión → 401; consola de producción limpia; `eslint` con menos errores; pantallas < ~600 líneas.
- **Track B1:** `npm test` cubre `adaptLevel` (subida/bajada con confirmación, clamping, mastery).
- **Track B2:** `npm test` cubre `lib/loci.ts`; prueba manual en `expo start`:
  1. Tutorial enseña los principios y deja crear 3 asociaciones propias.
  2. Crear palacio de un tema libre escribiendo asociaciones; persiste (`useLociStore`) y se sincroniza.
  3. Practicar un palacio preset sin crear nada.
  4. La fase de estudio **no auto-avanza**; el recuerdo libre/ordenado puntúa correctamente.

## Riesgos y mitigaciones
- **Coste IA** (sugerencias/imágenes): hacerlas opcionales y bajo demanda; aplicar A2 (auth + rate limiting) antes de exponer más IA.
- **Alcance del rediseño Loci**: entregar por fases (primero quitar el timer + recuerdo libre, que es el dolor inmediato; luego construcción guiada).
- **Compatibilidad de datos**: mantener el esquema de `useLociStore`/migraciones; los palacios existentes deben seguir funcionando.
