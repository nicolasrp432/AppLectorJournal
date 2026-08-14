# Diagnóstico y rediseño — LectorApp

Análisis del estado de producción, hallazgos de investigación aplicados y hoja de
ruta. Fecha: agosto 2026. Base: 33.257 líneas de TypeScript, 8 suites de test,
12 migraciones.

---

## 1. Fortalezas reales

**La arquitectura aguanta.** Typecheck limpio en modo `strict`, 92 tests verdes,
cero `TODO`/`FIXME` en el código de ejercicios. Nueve stores de Zustand con
persistencia en AsyncStorage y un `taskQueue` que reintenta escrituras: la app
funciona offline y sincroniza después. Esto es infraestructura cara de construir
y ya está hecha.

**El motor adaptativo está bien pensado.** `lib/adaptLevel.ts` exige confirmación
(dos resultados consecutivos o mastery alto) antes de mover a alguien de nivel, y
`ADAPT_THRESHOLDS` afina los umbrales por ejercicio porque el "score" de Schulte
y el de Loci no significan lo mismo. Es más sofisticado que lo que hacen muchas
apps del sector.

**Los ejercicios están completos, no son maquetas.** Siete ejercicios con lógica
real: Schulte con modo fever, RSVP/guía/chunk con resaltado ORP, Loci con recuerdo
libre/ordenado/demorado y repaso SM-2, jefes de zona por rondas.

**La identidad visual es coherente.** Tokens en `constants/`, `StyleSheet` puro
sin dependencias de estilo, cinco fondos animados por zona, mascotas propias.
Se sostiene sin depender de una librería de componentes.

**Seguridad de las Edge Functions ya endurecida.** `_shared/guard.ts` aplica
JWT, CORS por lista blanca y rate limiting por usuario. Alguien ya pensó en el
abuso de las APIs de IA de pago.

---

## 2. Debilidades — por gravedad

### 2.1 Crítico: el premium era auto-otorgable *(corregido en esta sesión)*

`001_initial_schema.sql` creaba:

```sql
CREATE POLICY "profiles: owner update" ON profiles FOR UPDATE USING (auth.uid() = id);
```

Sin `WITH CHECK` y, sobre todo, sin restringir columnas. Supabase concede
`GRANT ALL ON profiles TO authenticated` por defecto, y no había ni un solo
`GRANT`/`REVOKE` en las 11 migraciones. Con la clave anon —que viaja dentro del
bundle de la app— cualquier usuario autenticado podía ejecutar:

```js
supabase.from('profiles').update({ subscription_tier: 'premium' }).eq('id', uid)
supabase.from('profiles').update({ reading_lives: 5 }).eq('id', uid)
```

Premium gratis, y vidas infinitas saltándose por completo los RPC de
`011_reading_lives.sql`. Toda la economía de la app era decorativa.

Agravantes encontrados en el mismo camino:

| Hallazgo | Efecto |
|---|---|
| Las columnas `subscription_*` no existían en ninguna migración | El cliente las escribía; en un proyecto recreado desde cero esos writes fallaban en silencio y premium solo vivía en AsyncStorage |
| `purchasePackage()` devolvía `true` en web/Expo Go | Abrir la web y pulsar "comprar" concedía premium **real y permanente** en la base de datos |
| Clave `test_mMwJlApULxvfBOJGjozWyjLUbEs` fija en el fuente | Las builds de producción salían con credenciales de test; además una sola clave para iOS y Android, cuando RevenueCat emite una por tienda |
| Nunca se llamaba a `Purchases.logIn(userId)` | Las compras quedaban en un id anónimo por instalación: no sobrevivían a un reinstall ni llegaban a un segundo dispositivo |
| `isPremium()` era `tier === 'premium' \|\| status === 'active'` | Un OR: una fila a medio actualizar concedía premium. Y nunca miraba `subscription_expires_at`, así que un `active` obsoleto era premium para siempre |
| Dos fuentes de verdad desincronizadas | `app/exercise/[id].tsx` solo consultaba `useProfileStore`, así que quien compraba por RevenueCat seguía gastando vidas si la sincronía fallaba |

**Corregido**: `012_subscription_entitlements.sql` revoca el UPDATE global y lo
reconcede por columna (los `GRANT` por columna sí existen en Postgres y PostgREST
los respeta), dejando fuera `subscription_*` y `reading_lives*`. `is_premium()`
en SQL con control de caducidad, `get_entitlement()` para leer y
`set_entitlement()` restringida a `service_role`. Nuevo webhook
`revenuecat-webhook` como única vía de escritura. `lib/premium.ts` unifica la
resolución en cliente con 12 tests.

> **Acción pendiente para ti**: aplicar la migración 012, desplegar el webhook con
> `--no-verify-jwt`, fijar `REVENUECAT_WEBHOOK_SECRET` y las claves
> `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`. Hasta entonces las compras no
> conceden premium (que es el comportamiento correcto: mejor no conceder que
> conceder a cualquiera).

### 2.2 Alto: la ruta ignoraba el motor adaptativo *(corregido)*

Cada nodo llevaba `level: N` fijo y se pasaba como `?level=N`; en
`app/exercise/[id].tsx` el `pinnedLevel` ganaba siempre a `prog.current_level`.
El motor adaptativo movía el nivel del usuario y **la ruta no lo usaba nunca**.
Quien dominaba Schulte seguía repitiendo 3×3 para siempre.

**Corregido**: el nivel del nodo pasa a ser suelo curricular, no techo
(`lib/nodeDifficulty.ts`, 10 tests). Tope de +1 la primera vez para que la subida
sea gradual, +2 al rejugar un nodo completado.

### 2.3 Alto: el enfoque de velocidad contradice la evidencia *(mitigado)*

Ver sección 3. La app empujaba WPM hasta 800 mediante RSVP. La literatura es
consistente en que eso compra velocidad pagando con comprensión.

### 2.4 Medio: código muerto identificado

Cinco módulos con **cero referencias** en todo el proyecto:

| Archivo | Líneas | Nota |
|---|---|---|
| `components/exercises/shared/WpmMeter.tsx` | 236 | Sustituido por los medidores embebidos en cada ejercicio |
| `components/ui/PremiumGate.tsx` | ~30 | Sustituido por `PremiumPaywall` |
| `hooks/useStreak.ts` | — | La racha se calcula en `useProfileStore` |
| `hooks/useDB.ts` | — | Sustituido por los stores de Zustand |
| `constants/content.ts` | 21 | Barrel de `passages.ts` + un `LOCI_ROOMS` duplicado que compite con `lociPresets.ts` |

Borrarlos es seguro. No lo he hecho porque el borrado de archivos quedó bloqueado
por el clasificador de permisos de esta sesión; la orden exacta es:

```bash
git rm components/exercises/shared/WpmMeter.tsx components/ui/PremiumGate.tsx \
       hooks/useStreak.ts hooks/useDB.ts constants/content.ts
```

**Falsos positivos que NO debes borrar**: `PushButton.web.tsx`,
`OutlineButton.web.tsx`, `GlassNavbar.web.tsx`. No aparecen importados porque
Metro los resuelve por plataforma automáticamente.

**Lint**: 40 errores y 222 warnings. Los errores son casi todos `no-var` en
`lib/reanimated.web.stub.js` y `metro.config.js` (archivos de infraestructura,
ruido de bajo riesgo). Los warnings útiles: variables sin usar en
`useDailyMissionStore.ts` (`ExerciseId`) y directivas `eslint-disable` obsoletas
en `lib/supabase.ts`.

### 2.5 Medio: volumen de contenido

`constants/passages.ts` tiene 364 líneas para **todos** los pasajes de lectura.
Un usuario constante los agota en días y empieza a reconocer los textos, lo que
invalida la medida de comprensión. Es el cuello de botella más probable para la
retención a partir de la segunda semana.

### 2.6 Bajo: dos archivos superan las 2.000 líneas

`ruta.tsx` (2.526) y `perfil.tsx` (2.011). Funcionan, pero los cinco backdrops
animados de `ruta.tsx` son componentes autónomos que saldrían limpiamente a
`components/backdrops/`. No es urgente.

---

## 3. Lo que dice la investigación (y qué hacer con ello)

Busqué literatura reciente antes de tocar los ejercicios. Tres conclusiones
cambian el diseño:

### 3.1 RSVP compra velocidad pagando comprensión

Las revisiones de Rayner, Schotter, Masson, Potter y Treiman (2016) concluyen que
**no hay atajo** para el tiempo que exige leer: los movimientos oculares suponen
como mucho un 10% del tiempo de lectura, así que eliminarlos ahorra poco y cuesta
mucho. Los meta-análisis de RSVP reportan caídas de comprensión del 20–40% frente
a lectura normal a la misma velocidad, y por encima de 500 WPM la comprensión cae
por debajo del 50% en textos complejos. Un estudio específico sobre apps modernas
de lectura rápida lo titula sin rodeos: no fomentan la comprensión.

**Aplicado**: techo de 600 WPM en la sugerencia de ritmo. RSVP se conserva —es
buen entrenamiento de reconocimiento visual— pero deja de ser la métrica que
define el progreso.

### 3.2 Fijar el objetivo antes de leer funciona mejor que entrenar velocidad

Klimovich, Tiffin-Richards y Richter (2023, *Journal of Research in Reading*)
compararon entrenamiento de lectura rápida contra entrenamiento **metacognitivo**.
El metacognitivo logró ganancias de velocidad equivalentes, **sin pérdida de
comprensión** y con bastante menos tiempo de entrenamiento. Los datos de
seguimiento ocular muestran que el aumento vino de fijaciones menos numerosas y
más cortas en el procesamiento léxico tardío. El mecanismo no es mover el ojo más
rápido: es recalibrar el umbral de auto-vigilancia, reduciendo las regresiones
improductivas sin eliminar las útiles.

**Aplicado**: `lib/readingGoals.ts` + `ReadingGoalStep`. Antes de leer, el usuario
declara para qué lee (captar la idea / buscar datos / estudiar a fondo). Eso
cambia el WPM sugerido, el énfasis de las preguntas y el listón de comprensión.
Al terminar, `calibrate()` contrasta lo declarado con lo logrado. **El contraste
es el ingrediente activo**: sin él, elegir objetivo es un clic decorativo.

Detalle que importa: "estudiar a fondo" aplica un factor de **0,85** sobre el WPM
base. Va más lento a propósito. Era justo el caso donde la app empujaba en la
dirección contraria a lo que el usuario necesitaba.

### 3.3 El span visual sí se entrena — vía reducción de crowding

Aquí la evidencia sí acompaña, pero no por donde promete la lectura rápida. Los
cursos de lectura rápida **no** expanden el span perceptual. Lo que sí funciona es
el entrenamiento perceptual adaptativo: cuatro días aumentaron el span visual en
6,44 bits con un **63,6% de aumento de la velocidad máxima de lectura**, y el
efecto se explica principalmente por la reducción del *crowding* (la interferencia
entre letras vecinas), no por mover el ojo.

**Implicación para Schulte**: la tabla de Schulte ya entrena visión periférica,
así que la app está en el terreno correcto. Lo que falta es que la dificultad
module el **crowding** (espaciado entre celdas, ruido visual, similitud de
símbolos), no solo el tamaño de la rejilla. Es la mejora de mayor retorno
pendiente en el ejercicio.

### 3.4 Flashcards con IA: el humano tiene que quedarse en el bucle

La repetición espaciada funciona (80% de recuerdo frente a 60% del atracón). Las
flashcards generadas por IA son más ambiguas: en el benchmark *Memory Machines*
(Kirkby y Matuschak, 2026) el mejor modelo generaba tarjetas inservibles el **36%**
de las veces —demasiado ambiguas, largas o dependientes del contexto para
sobrevivir a un calendario de repaso largo—. Un estudio de Stanford (2024) encontró
que los estudiantes con flashcards aumentadas por IA dedicaban un 31% más de tiempo
por sesión **sin mejora** en recuerdo diferido a 7 y 30 días. Y formular la pregunta
uno mismo tiene beneficio de codificación propio.

**Implicación de diseño**: la IA debe **proponer** tarjetas y el usuario
**editarlas y aprobarlas** antes de que entren al mazo. Volcado automático al
mazo, nunca. Esto ya conviene aplicarlo a `ai-flashcards`.

---

## 4. Qué se implementó en esta sesión

| Commit | Contenido |
|---|---|
| `7f94a89` | Entitlement premium autoritativo en servidor: migración 012, `lib/premium.ts`, RevenueCat con `logIn`/claves por plataforma, webhook, 12 tests |
| `983276d` | Dificultad progresiva en la ruta: `lib/nodeDifficulty.ts`, nivel de nodo como suelo, UI del nivel efectivo, 10 tests |
| `2fdb85a` | Objetivo metacognitivo y calibración: `lib/readingGoals.ts`, `ReadingGoalStep`, feedback en resultado, 11 tests |
| `527dc41` | Liga competitiva real: migración 013, `lib/league.ts`, `useLeagueStore` con Realtime, componentes en `components/league/`, 31 tests |
| `ce308e6` | Capa de Realtime reutilizable (`lib/realtime.ts`) e integración de la liga en progreso |

De 59 a 123 tests. Typecheck limpio en todo momento.

### 4.1 La liga era una maqueta

Vivía entera dentro de `perfil.tsx`:

- Cuatro rivales con XP constante escrito a mano (Camila 750, Carlos 620, Mateo
  320, Sofía 210). Nunca cambiaban.
- El literal `'3d 12h'` como temporizador. No corría.
- El tier salía de `profile.level`, no de competir: subir de nivel te "ascendía
  de liga" aunque no hubieras entrenado esa semana.
- El indicador de ascenso y descenso no ascendía ni descendía a nadie.

Ahora: cohortes semanales de hasta 30 por tier, ciclo lunes→domingo en UTC, y
ascenso/descenso resuelto al entrar en el ciclo nuevo. La resolución es perezosa
a propósito — un cron sería un punto de fallo extra para algo que solo tiene que
ser correcto en el momento de consultarlo.

Dos decisiones que conviene conocer:

- **El cliente no escribe `weekly_xp`.** Misma lección que 012: si pudiera, la
  clasificación sería tan decorativa como la maqueta. Todo pasa por
  `add_league_xp()`, con tope por llamada.
- **Nombre y avatar se copian al entrar en la cohorte** en vez de unir contra
  `profiles`. Unir obligaría a abrir esa tabla a terceros y filtraría el email;
  un marcador solo necesita nombre y avatar.

### 4.2 No existía ninguna integración en tiempo real

Cero usos de Supabase Realtime en todo el proyecto antes de esta sesión. La liga
es la primera: una clasificación que solo se actualiza al recargar la pantalla es
una foto, no una liga.

`lib/realtime.ts` deja la capa lista para reutilizar (registro de canales por
clave, baja automática, `unsubscribeAll()` al cerrar sesión). El cliente no-op de
`supabase.ts` tampoco tenía `channel`, así que cualquier suscripción reventaba
sin variables de entorno configuradas; también está corregido.

---

## 5. Hoja de ruta pendiente, por retorno

### Fase A — desbloquear ingresos (horas)

1. Aplicar la migración 012 y desplegar `revenuecat-webhook --no-verify-jwt`.
2. Fijar los secretos: `REVENUECAT_WEBHOOK_SECRET`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`,
   `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT`.
3. Verificar el circuito completo con una compra sandbox: comprar → webhook →
   `get_entitlement()` → premium activo en la app.

Sin esto, todo lo demás es secundario: la app no puede cobrar.

### Fase A-bis — activar la liga (minutos)

1. Aplicar `013_leagues.sql`.
2. Comprobar en el panel de Supabase que Realtime está habilitado para el
   proyecto y que `league_members` figura en la publicación `supabase_realtime`
   (la migración lo añade, pero conviene verlo).
3. Probar con dos cuentas a la vez: al terminar un ejercicio en una, la
   clasificación de la otra debe moverse sin recargar.

Con una sola cuenta la cohorte tendrá un único miembro y parecerá vacía — es el
comportamiento correcto, no un fallo.

### Fase B — Schulte con crowding adaptativo (1–2 días)

Añadir a `DIFFICULTY.schulte` dos ejes nuevos junto a `size`:

- `spacing`: separación entre celdas, decreciente con el nivel.
- `noise`: distractores de fondo o similitud tipográfica.

Es la única modificación con respaldo experimental directo de una mejora del
63,6% en velocidad máxima de lectura. Reutiliza el componente existente.

### Fase C — contenido (2–3 días)

Multiplicar `passages.ts` por diez, etiquetando cada pasaje por longitud, tema y
dificultad léxica. Alternativa mejor: dejar que el usuario pegue su propio texto
y que `ai-questions` genere el cuestionario —ya existe la Edge Function—, con lo
que el contenido deja de ser finito.

### Fase D — human-in-the-loop en flashcards de IA (1 día)

Pantalla de revisión entre `ai-flashcards` y el mazo: la IA propone, el usuario
edita y aprueba tarjeta a tarjeta. Dado el 36% de tarjetas inservibles medido en
el benchmark, es lo que separa un mazo útil de uno contaminado.

### Fase E — memoria y ritmo (3–5 días)

- **Loci**: el ejercicio ya tiene recuerdo ordenado, demorado y SM-2. Lo que
  falta es que los palacios propios del usuario (`app/loci/create.tsx`) entren en
  la ruta, no solo en la galería.
- **Jefe de zona**: la ronda de velocidad de `BossExercise` es pulsar "Siguiente"
  sin medir tiempo de reacción real. Es el punto más flojo de los ejercicios.
- **Limpieza**: los cinco archivos muertos y los warnings de lint útiles.

---

## Fuentes

- [So Much to Read, So Little Time — Rayner et al., 2016](https://journals.sagepub.com/doi/10.1177/1529100615623267)
- [Does speed-reading training work, and if so, why? — Klimovich, Tiffin-Richards y Richter, 2023](https://onlinelibrary.wiley.com/doi/10.1111/1467-9817.12417)
- [Modern Speed-Reading Apps Do Not Foster Reading Comprehension](https://pubmed.ncbi.nlm.nih.gov/29461715/)
- [Testing the Speed-Accuracy Trade-Off in Reading, 2025](https://www.tandfonline.com/doi/full/10.1080/10888438.2025.2612649)
- [Perceptual Learning of Visual Span Improves Reading Speed — IOVS](https://iovs.arvojournals.org/article.aspx?articleid=2734880)
- [Training peripheral vision to read: reducing crowding through adaptive training](https://pmc.ncbi.nlm.nih.gov/articles/PMC6309521/)
- [Harnessing generative AI to boost active retrieval — ERIC](https://files.eric.ed.gov/fulltext/EJ1481879.pdf)
- [Effectiveness of spaced repetition for clinical problem solving](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11186069/)
