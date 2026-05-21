# AppLectorJournal — Plan Maestro de Rediseño y Nuevas Features

## Contexto

AppLectorJournal es una app de lectura veloz, memoria y comprensión en React Native / Expo con:
- **Tech Stack**: Expo 54, React Native Reanimated 4, Zustand + AsyncStorage, Supabase, expo-router
- **7 ejercicios completos**: Schulte, RSVP/Focal Reading, Word Span, Loci, Comprensión, Free Reading, Boss
- **Gamificación**: XP, niveles, streaks, achievements, cosmetics shop
- **Sin IA real** (toda la generación es local estática)
- **Problema central**: Los ejercicios están funcionales pero les falta pulido visual, dinamismo y contenido infinito. El dashboard existe pero no es suficientemente interactivo. No hay flashcards SRS ni IA real.

**Objetivo**: Construir SOBRE el proyecto existente. Cero ruptura de lo que ya funciona.

---

## Principios de Implementación

1. **Construir encima, nunca reemplazar** — Cada cambio es aditivo. Los componentes existentes se extienden.
2. **Mismo sistema de diseño** — Usar `COLORS`, `FONTS`, `typography` de `constants/`. Sin nuevas librerías de UI.
3. **Reanimated para todo** — Todas las animaciones nuevas usan `react-native-reanimated`. Sin CSS keyframes nuevos.
4. **Zustand stores existentes** — Extender los stores actuales. Solo crear stores nuevos si el dominio es completamente nuevo (flashcards).
5. **Supabase para persistencia** — Nuevas tablas en Supabase + AsyncStorage fallback.
6. **Claude API para IA** — `@anthropic-ai/sdk` en el backend/edge functions de Supabase.

---

## Fase 1 — Mejoras UX de Ejercicios Existentes
**Duración estimada: 3-4 semanas**
**Archivos principales a tocar**: `components/exercises/*.tsx`, `lib/ex-*.jsx`

---

### 1.1 Tabla Schulte — `components/exercises/SchulteGrid.tsx`

**Problema actual**: La grilla es funcional pero el feedback visual es básico. No hay guía visual de dónde buscar, y el "fever mode" no está suficientemente aprovechado.

**Cambios**:

#### A) Highlight de cuadrante
- Agregar un overlay translúcido que divide la grilla en 4 cuadrantes
- El número que el usuario DEBE tocar próximo activa un glow sutil en su cuadrante (no revela posición exacta, solo zona)
- Implementar con `Animated.View` como overlay absoluto sobre la grilla
- Prop: `showQuadrantHint` (activado por nivel)

```tsx
// En SchulteGrid.tsx — agregar después de la grilla existente
{showQuadrantHint && (
  <Animated.View style={[styles.quadrantOverlay, quadrantGlowStyle]} />
)}
```

#### B) Cel-tap animation mejorada
- Al tocar correctamente: la celda hace `scale → 0` con color del exercise (`COLORS.focus`) y desaparece con partícula pequeña
- Al tocar incorrectamente: shake más dramático + flash rojo momentáneo en toda la celda
- Usar `withSequence(withTiming(1.3), withTiming(0))` para el correcto
- Usar `withSequence(withTiming(-5, {duration:50}), withTiming(5, {duration:50}), withTiming(0))` para shake

#### C) Timer circular periférico
- Reemplazar el StatPill de tiempo por un `CircularTimer` que rodea la grilla
- Usar `react-native-svg` (ya instalado) para un círculo de progreso
- Color cambia: verde → naranja → rojo según tiempo transcurrido vs benchmark del nivel
- Archivo nuevo: `components/exercises/shared/CircularTimer.tsx`

#### D) "Perfect Streak" counter
- Si el usuario completa N números sin error → banner temporal "¡Racha perfecta! 🔥" 
- Se muestra como un toast en la parte superior del ejercicio
- Usa el componente toast existente del proyecto

#### E) Modo "Schulte inverso" (nueva variante, nivel avanzado)
- En niveles 5+: los números aparecen y el usuario debe tocarlos de MAYOR a MENOR
- Solo cambiar la lógica de `nextTarget` en el estado existente
- Agregar en `constants/difficulty.ts` la variante

---

### 1.2 Lectura Focal / RSVP — `components/exercises/FocalReading.tsx`

**Problema actual**: El modo RSVP funciona, pero la experiencia visual es plana. No hay sensación de velocidad ni fluidez. El quiz aparece abruptamente.

**Cambios**:

#### A) Speed Meter visual
- Agregar un indicador "velocímetro" debajo de la palabra central en modo RSVP
- Es una barra horizontal con gradiente verde → naranja → rojo
- El punto indicador se mueve según WPM actual (prop ya disponible)
- Implementar con `react-native-svg` inline, sin nueva dependencia
- Archivo: `components/exercises/shared/WpmMeter.tsx`

#### B) Progress bar de texto en RSVP
- Barra muy fina (2px) en la parte inferior de la pantalla mostrando % de texto leído
- Usa `useSharedValue` animado con `wordIndex / totalWords`
- Color con gradiente del ejercicio

#### C) Transición lectura → quiz con animación "page flip" mejorada
- Actualmente hay una transición básica. Mejorar con `withSpring` en la escala del card
- El card de quiz entra desde abajo con `translateY: 600 → 0` con spring suave
- La palabra central hace fade out al terminar la lectura

#### D) Resultado de comprensión más visual
- Al terminar el quiz, mostrar un "scorecard" animado con:
  - WPM grande en el centro (animado contador desde 0 hasta el valor real, 1 segundo)
  - Barra de comprensión % que se llena animada
  - Comparación con mejor marca personal (↑ o ↓ con color)
- Esto se agrega en `exercise-shell.jsx` o como panel antes de cerrar

#### E) Modo "Chunk" mejorado con separadores visuales
- En modo chunk, cada grupo de palabras aparece en un `rounded` box con sombra suave
- Duración ligeramente mayor que el modo RSVP para compensar

---

### 1.3 Palacio de Memoria — `components/exercises/LociExercise.tsx`

**Problema actual**: El SVG del mapa de la casa es plano y estático. Las asociaciones son solo texto. No hay sentido de "viaje" por las habitaciones.

**Cambios**:

#### A) Animación de "viaje entre habitaciones" en fase de estudio
- Actualmente las habitaciones aparecen estáticas con texto
- Agregar un efecto de "caminar hacia la habitación": la habitación activa hace `scale: 1 → 1.1` con un border glow animado
- Usar `withSequence` para que el mapa SVG muestre el recorrido: cada habitación se ilumina secuencialmente antes de mostrar el objeto

#### B) Tarjeta de asociación visual mejorada
- Actualmente: texto "objeto → habitación"
- Nueva: card con fondo degradado (color de la habitación), emoji del objeto grande, nombre de habitación abajo
- Agregar un emoji por cada habitación (🚪 entrada, 🍳 cocina, 🛋️ sala, 🛏️ dormitorio, 💼 oficina, 🚿 baño, 🌿 jardín, 🏠 ático)
- Card hace `scale: 0 → 1` con spring al aparecer cada asociación

#### C) Mapa SVG interactivo mejorado
- Las habitaciones del SVG actual son básicas. Agregar:
  - Colores de fondo distintos por habitación (ya tiene colores, mejorar contraste)
  - Al pasar a fase de recall, las habitaciones no seleccionadas hacen `opacity: 0.4` 
  - La habitación correcta hace `scale: 1.1` + border verde animado al acertar

#### D) "Modo imagen" con IA (conectar a Fase 5)
- Agregar prop `imageMode: boolean` al LociExercise
- Si `imageMode = true`, mostrar una imagen generada por IA de la escena bizarre en lugar del texto
- La imagen se genera previamente (no en tiempo real) usando `constants/lociImages.ts` como caché
- **Esto se activa en Fase 5**, aquí solo preparar la prop y el espacio visual

#### E) Palacio personalizable — nueva feature mediana
- Agregar pantalla `/exercise/loci-setup` donde el usuario puede:
  - Elegir su "palacio" entre 3 templates: Casa, Oficina, Naturaleza
  - Cada template tiene 8 habitaciones distintas con diferentes emojis
- Agregar a `constants/palaces.ts`:
```ts
export const PALACES = {
  casa: { rooms: [...], theme: COLORS.loci },
  oficina: { rooms: [...], theme: '#0EA5E9' },
  naturaleza: { rooms: [...], theme: '#22C55E' }
}
```
- Guardar preferencia en `usePrefsStore` con `loci_palace: 'casa' | 'oficina' | 'naturaleza'`

---

### 1.4 Word Span — `components/exercises/WordSpan.tsx`

**Problema actual**: Las palabras aparecen con animación básica. La fase de recall es funcional pero aburrida.

**Cambios**:

#### A) "Card flip" reveal en fase de memorización
- Cada palabra aparece como una tarjeta que da vuelta (flip animation usando `rotateY`)
- Front: fondo con color del ejercicio
- Back: la palabra en blanco grande
- Duración del flip: 300ms, luego espera el tiempo restante antes del next
- Implementar con `useSharedValue` y `interpolate` para `rotateY: '0deg' → '90deg' → '0deg'`

#### B) Color coding por posición
- A cada palabra en la secuencia asignarle un color de orden: posición 1 → azul, 2 → verde, 3 → naranja, etc.
- Usar array de colores en loop: `['#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', ...]`
- En la fase de recall, los slots de respuesta también tienen el mismo color (pista posicional)

#### C) Animación de "colocación" en recall
- Al seleccionar una palabra, la palabra "vuela" desde el banco hasta el slot correcto
- Usar `LayoutAnimation` o simplemente `withTiming` en la posición del elemento
- Si la posición es correcta al final: todos los slots hacen un "wave" animation secuencial

#### D) Historial de palabras vistas (bonus sutil)
- Después de completar la fase de memorización y antes del recall: mostrar por 1 segundo el título de la historia surreal que ya se genera
- Esto sirve como puente narrativo entre ver las palabras y recordarlas

---

### 1.5 Boss Exercise — `components/exercises/BossExercise.tsx`

**Problema actual**: Las rondas son muy simples. La ronda de "velocidad" es solo tocar un botón. No hay variedad real.

**Cambios**:

#### A) Ronda de velocidad real — Reaction Tap
- Reemplazar el botón de "Siguiente" por un sistema de reaction time real:
  - Aparece una palabra/número en una posición aleatoria de la pantalla
  - El usuario debe tocarla antes de que desaparezca (1.5s timer)
  - 5 intentos, score = aciertos / 5
- Mantener el mismo contrato de `score: 0-1` para no romper la lógica del boss

#### B) Animaciones de daño mejoradas
- El número de daño que aparece (ej: "33 DMG") debe hacer un arc más dramático
- Usar `withSpring` en `translateY` y `withTiming` en opacity para que suba y desaparezca
- Agregar un `shakeX` breve al boss cuando recibe daño (ya hay animación similar en Schulte)

#### C) "Critical Hit" para scores perfectos
- Si score de ronda = 1.0: mostrar "CRÍTICO! 🎯" en rojo + damage aumentado × 1.5
- Animación: flash de pantalla blanca por 100ms + texto de crítico más grande

---

## Fase 2 — Sistema de Flashcards con Repetición Espaciada
**Duración estimada: 2-3 semanas**
**Feature completamente nueva — sin tocar código existente**

Este es el sistema de aprendizaje más poderoso de todos. Implementar el **algoritmo SM-2** (SuperMemo 2) para repetición espaciada.

---

### 2.1 Modelo de Datos

#### Nuevas tablas Supabase

```sql
-- Mazos de flashcards
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  source_text TEXT -- texto original si fue generado por IA
);

-- Flashcards individuales
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  -- SM-2 fields
  easiness_factor FLOAT DEFAULT 2.5,  -- EF: 1.3 - 2.5+
  interval INTEGER DEFAULT 1,         -- días hasta siguiente review
  repetitions INTEGER DEFAULT 0,      -- número de reviews exitosas consecutivas
  due_date DATE DEFAULT CURRENT_DATE, -- cuándo mostrar
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de review
CREATE TABLE flashcard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  deck_id UUID REFERENCES decks(id),
  cards_reviewed INTEGER,
  cards_correct INTEGER,
  time_seconds INTEGER,
  finished_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Nuevo Zustand Store

**Archivo**: `store/useFlashcardStore.ts`

```typescript
interface FlashcardStore {
  decks: Deck[]
  cards: Record<string, Flashcard[]>  // deck_id → cards
  dueToday: Flashcard[]               // cards para revisar hoy
  fetchDecks: () => Promise<void>
  fetchCards: (deckId: string) => Promise<void>
  createDeck: (data: CreateDeckInput) => Promise<Deck>
  addCard: (deckId: string, card: CardInput) => Promise<void>
  reviewCard: (cardId: string, quality: 0|1|2|3|4|5) => Promise<void>  // SM-2 quality
  getDueCards: () => Flashcard[]
}
```

---

### 2.2 Algoritmo SM-2

**Archivo**: `lib/sm2.ts`

```typescript
export interface SM2Card {
  easiness_factor: number   // EF, empieza en 2.5
  interval: number          // días
  repetitions: number       // repeticiones consecutivas exitosas
}

export function sm2Update(card: SM2Card, quality: number): SM2Card {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  // 0 = complete blackout, 3 = correct with effort, 5 = perfect
  
  let { easiness_factor: ef, interval, repetitions } = card
  
  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * ef)
    
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }
  
  // Actualizar EF
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (ef < 1.3) ef = 1.3
  
  return { easiness_factor: ef, interval, repetitions }
}

export function getNextDue(interval: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + interval)
  return d
}
```

---

### 2.3 Pantallas y Navegación

**Estructura de rutas** (agregar a Expo Router):

```
app/
  flashcards/
    index.tsx          ← Lista de mazos (deck manager)
    [deckId]/
      index.tsx        ← Vista del mazo (cartas, stats)
      review.tsx       ← Sesión de review
      edit.tsx         ← Agregar/editar cartas
    create.tsx         ← Crear mazo (manual o por IA)
```

**Acceso**: Agregar en la tab "progreso" (estadísticas) una sección "Flashcards" con botón directo a `/flashcards`. También accesible desde la ruta de ejercicios.

---

### 2.4 Componentes UI

#### `FlashCard.tsx` — La tarjeta principal

```tsx
// components/flashcards/FlashCard.tsx
// Tarjeta con flip animation usando Reanimated
// Front: pregunta con fondo degradado del color del mazo
// Back: respuesta + hint + botones de calidad (SM-2)
```

**Diseño visual**:
- Card grande (90% del ancho de pantalla)
- Fondo: degradado del color del mazo (usar `expo-linear-gradient`)
- Fuente: `FONTS.heading` para la pregunta, `FONTS.body` para la respuesta
- Flip animation: `rotateY` de 0° → 180° en 400ms con `withTiming` y `Easing.bezier`
- Shadow con `elevation: 8` para efecto de tarjeta física

#### Botones de calidad (después del flip)

4 botones de respuesta (simplificado desde SM-2 de 6 niveles a 4):
- 🔴 **Otra vez** → quality=1 (no recuerdo)
- 🟡 **Difícil** → quality=3 (recuerdo con esfuerzo)
- 🟢 **Bien** → quality=4 (recuerdo correcto)
- 💙 **Fácil** → quality=5 (perfecto)

#### `DeckCard.tsx` — Card del mazo en la lista

- Muestra: título, número de cartas, % de dominio, cuántas cartas vencen hoy (badge rojo)
- Color: el del mazo (configurable al crear)
- Press → navega al mazo

#### Pantalla de sesión de review

```
┌─────────────────────────────┐
│  Mazo: "Biología"    7/20   │
│  ████████░░░░░░░░░░░░░░░░   │
├─────────────────────────────┤
│                             │
│   ¿Cuál es la función       │
│   de la mitocondria?        │
│                             │
│        [Tocar para ver]     │
└─────────────────────────────┘
```

Después de tocar → flip → respuesta visible → 4 botones de calidad

---

### 2.5 Creación de Mazos

**Pantalla** `app/flashcards/create.tsx`:

Dos modos:
1. **Manual**: Formulario con campos front/back para agregar cartas una a una
2. **Con IA** (conecta con Fase 5): Pegar texto → IA genera N cartas automáticamente

---

### 2.6 Integración con Gamificación Existente

- Completar una sesión de flashcards = +30 XP (agregar en `lib/xpEngine.ts`)
- Agregar logro `flashmaster` en `useAchievementsStore`: "Revisar 100 cartas con flashcards"
- Las sesiones se loguean en `useSessionStore` con `exercise_id: 'flashcards'`

---

## Fase 3 — Dashboard Más Animado e Interactivo
**Duración estimada: 1-2 semanas**
**Archivo principal**: `app/(tabs)/ruta.tsx`

---

### 3.1 Parallax Scroll en el Dashboard

**Objetivo**: Que cada zona tenga profundidad visual al hacer scroll.

**Implementación**:
- Usar `useScrollViewOffset` de Reanimated para obtener el scroll offset
- Los backdrops (hojas, estrellas, speedlines) se mueven a `offset × 0.3` (parallax lento)
- Los nodos se mueven a `offset × 0.7` (más rápido)
- Los mascots de zona flotan a `offset × 0.15` (muy lento, sensación de profundidad)

```tsx
// En ruta.tsx
const scrollOffset = useScrollViewOffset(scrollRef)
const backdropTranslate = useDerivedValue(() => scrollOffset.value * 0.3)
```

---

### 3.2 Animación de Completado de Nodo

**Actualmente**: Nodo completado simplemente muestra un checkmark estático.

**Nuevo comportamiento**:
- Al completar un ejercicio y volver al dashboard: detectar nodo recién completado
- Animación de "burst": el checkmark aparece con escala `0 → 1.3 → 1.0` con spring
- Partículas de confeti durante 1.5 segundos en el área del nodo (SVG circles pequeños en colores del ejercicio)
- Si era el último nodo de zona: animación de "zona completada" → toda la zona pulsa con el color de la zona durante 2 segundos

**Implementación**:
- Agregar state `justCompletedNode: string | null` en el componente
- Detectar via `useFocusEffect` cuando se vuelve al dashboard
- Comparar `completedNodes` antes y después del ejercicio

---

### 3.3 Preview de Ejercicio al Presionar Nodo

**Actualmente**: Tapping un nodo navega directamente al ejercicio.

**Nuevo comportamiento**:
1. Primer tap: Aparece un mini bottom sheet con:
   - Nombre del ejercicio y mascot animado
   - "Mejor tiempo / Mejor score" si tiene historial
   - Botón "¡Jugar!" y botón "×" para cerrar
2. Segundo tap (o tap en "¡Jugar!"): Navega al ejercicio

**Implementación**:
- Agregar `previewNode: NodeConfig | null` al state local de `ruta.tsx`
- Mini bottom sheet con `translateY` animado: 300 → 0 (desde abajo)
- Fondo: color del ejercicio con opacity 0.95, border radius top de 24px
- Usar `BackHandler` en Android para cerrar con botón atrás

---

### 3.4 Sección "Misión de Hoy" (Daily Goal)

**Agregar** encima del primer nodo de zona una card "Misión de hoy":
- Muestra un objetivo diario aleatorio: "Completa 2 ejercicios", "Logra >80% en comprensión", "Lee 5 minutos"
- Barra de progreso de la misión
- Al completar: XP bonus (+25) + animación de confeti
- Misión se renueva a medianoche (guardar en `usePrefsStore` con `dailyMission: { id, goal, progress, date }`)

---

### 3.5 Nodos de "Zona" con Animación de Desbloqueo

**Actualmente**: Las zonas 2 y 3 están bloqueadas hasta completar la anterior. El estado bloqueado es estático.

**Nuevo**:
- Zona bloqueada: overlay oscuro con `BlurView` intensity 15, candado animado que "tirita" gentilmente
- Al desbloquear: `BlurView` hace fade out en 1 segundo, candado explota en partículas, texto "¡ZONA DESBLOQUEADA!" aparece con spring

---

### 3.6 Animaciones de Backdrop Mejoradas

Las 5 animaciones de backdrop ya existen. Mejorarlas:

**ForestBackdrop** (Zona 1):
- Agregar 3 tamaños de hojas (pequeñas, medianas, grandes) con velocidades distintas
- Algunas hojas rotan mientras caen (ya tienen drift horizontal)
- Agregar 2-3 "fireflies" que parpadean (pequeños círculos amarillos que aparecen/desaparecen)

**CosmosBackdrop** (Zona 2):
- Agregar una "nebulosa" como gradiente radial muy suave que pulsa lentamente
- Las estrellas tienen 3 tamaños con brillos de duración diferente

**CyberBackdrop** (Zona 3):
- Agregar un efecto de "scan line" horizontal que baja periódicamente
- Las líneas de velocidad tienen grosor variable (crea sensación de profundidad)

---

## Fase 4 — Modo Libre de Ejercicios desde Estadísticas
**Duración estimada: 1 semana**
**Archivo principal**: `app/(tabs)/progreso.tsx`

---

### 4.1 Sección "Práctica Libre" en Estadísticas

**Objetivo**: Que el usuario pueda usar cualquier ejercicio sin estar en el flujo del dashboard de ruta.

**Implementación**:
Agregar una nueva sección al final de `progreso.tsx` (después de las exercise cards existentes):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PRÁCTICA LIBRE
  Entrena sin límites, elige tu ejercicio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Schulte]  [Lectura]  [Palacio]
[Memoria]  [Compr.]   [Flashcards]
```

**Grid de 2×3** con `ExerciseTile` components:
- Icono/mascot del ejercicio
- Nombre corto
- Color del ejercicio
- Badge "Mejor: X" si tiene historial
- Press → navega a `/exercise/[id]?mode=free`

**Modo free**: En `exercise-router.jsx` y `exercise-shell.jsx`, detectar el query param `?mode=free`:
- No actualiza nodos completados del dashboard
- Sí cuenta para XP, sesiones, y stats
- El botón de "siguiente" al terminar vuelve a `progreso` en vez del dashboard
- Muestra un modal de resultado simplificado

---

### 4.2 Quick-Launch Modal de Ejercicio

Desde las `exercise cards` existentes en el screen de progreso (las que muestran mastery %):
- Agregar un botón "▶ Practicar" en cada card
- Press directo → navega a `/exercise/[id]?mode=free`
- Esto está muy cerca de lo que ya existe, solo agregar la navegación

---

### 4.3 Sección de Flashcards en Estadísticas

Agregar una card de "Flashcards pendientes" en la parte superior de progreso:
- Número de cartas vencidas hoy (badge rojo si > 0)
- Último mazo estudiado
- Botón "Estudiar ahora" → `/flashcards`

---

## Fase 5 — Integración de Inteligencia Artificial
**Duración estimada: 2-3 semanas**
**Nueva infraestructura + extensión de ejercicios existentes**

---

### 5.1 Arquitectura de IA

**Approach recomendado**: Supabase Edge Functions como proxy para la API de Anthropic.

**¿Por qué Edge Functions y no llamadas directas desde el cliente?**
- La API key de Anthropic no se expone en el bundle del app
- Permite rate limiting y logging en el servidor
- Permite cachear respuestas costosas (ej: imágenes de palacio)

**Estructura**:

```
supabase/functions/
  ai-questions/       ← Genera preguntas desde texto
    index.ts
  ai-flashcards/      ← Genera mazos de flashcards
    index.ts
  ai-loci-images/     ← Genera descripciones de escenas para palacio
    index.ts
  ai-analyze-reading/ ← Analiza nivel de lectura de texto subido
    index.ts
```

**Cliente en el app**:

```typescript
// lib/ai.ts
const SUPABASE_FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1'

export async function generateQuestions(text: string, count = 5) {
  const { data } = await supabase.functions.invoke('ai-questions', {
    body: { text, count }
  })
  return data.questions
}

export async function generateFlashcards(text: string, count = 10) {
  const { data } = await supabase.functions.invoke('ai-flashcards', {
    body: { text, count }
  })
  return data.cards
}
```

---

### 5.2 Generación de Preguntas para Comprensión

**Flujo del usuario**:
1. En la pantalla de `ComprehensionEx.tsx`, agregar un botón **"+ Usar mi texto"**
2. Modal/pantalla donde el usuario pega su propio texto (TextInput multilínea)
3. Botón "Generar ejercicio" → llama a `ai-questions` Edge Function
4. La función genera: 3-5 preguntas de comprensión con 4 opciones cada una
5. El ejercicio corre con el texto y preguntas generadas, sin tocar la lógica existente

**Edge Function** `ai-questions/index.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

Deno.serve(async (req) => {
  const { text, count = 5 } = await req.json()
  
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
  
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Eres un experto en comprensión lectora. Dado el siguiente texto en español, genera ${count} preguntas de comprensión. 
      
Cada pregunta debe tener 4 opciones (A, B, C, D) y una respuesta correcta.
Responde SOLO con JSON en este formato:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0
    }
  ]
}

Texto: """${text}"""`
    }]
  })
  
  const parsed = JSON.parse(message.content[0].text)
  return new Response(JSON.stringify(parsed), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Integración en ComprehensionEx.tsx**:
- Agregar prop opcional `config.aiPassage?: { text: string, questions: Question[] }`
- Si este prop existe, usar el texto y preguntas de IA en vez de los de `passages.ts`
- La lógica de puntuación/XP no cambia en absoluto

---

### 5.3 Generación de Mazos de Flashcards con IA

**Flujo del usuario**:
1. En `/flashcards/create.tsx`, opción "Generar con IA"
2. TextInput grande: "Pega aquí el texto del que quieres aprender"
3. Slider: "¿Cuántas tarjetas? (5 - 30)"
4. Botón "Generar" → loading state → se crean las flashcards automáticamente
5. Preview del mazo generado → confirmar → guardar en Supabase

**Edge Function** `ai-flashcards/index.ts`: similar a `ai-questions` pero genera pares front/back.

**Prompt template**:
```
Eres un experto en memorización y aprendizaje. Dado el siguiente texto, genera ${count} flashcards de alta calidad para aprender el contenido.

Las flashcards deben:
- Tener preguntas concretas y respuestas concisas
- Cubrir los conceptos más importantes del texto
- Estar en español
- El "front" (pregunta) debe ser específico, no vago

Responde SOLO con JSON:
{
  "title": "Título sugerido para el mazo",
  "cards": [
    { "front": "...", "back": "..." }
  ]
}
```

---

### 5.4 Imágenes/Escenas para el Palacio de Memoria

**Objetivo**: Cuando el usuario practique `LociExercise`, en vez de solo texto pueden ver una "imagen mental" descrita por IA de la escena bizarre.

**Approach (sin coste de generación de imágenes)**:
- En lugar de imágenes reales (costosas y lentas), usar **descripciones ultra-vívidas** generadas por Claude para que el usuario forme su imagen mental
- Esto es más fiel al método de loci original (imaginación activa > imagen pasiva)

**Flujo**:
1. En `LociExercise.tsx`, al mostrar cada objeto-habitación, hay actualmente solo texto
2. Agregar un botón "💫 Ver escena" (disponible para usuarios premium)
3. Al tocar: expandir card con descripción vívida generada (o cacheada)
4. Las descripciones se generan una vez y se cachean en `constants/lociScenes.ts`

**Edge Function** `ai-loci-images/index.ts`:

```typescript
// Genera una escena sensorial vívida para el método de loci
const prompt = `Crea una escena SURREALISTA, EXAGERADA y MEMORABLE en 2-3 oraciones para el método de loci.

Objeto: ${object}
Habitación: ${room}

La escena debe:
- Ser ridículamente exagerada (imposible de olvidar)
- Involucrar todos los sentidos (qué ves, oyes, hueles)
- Ser DIVERTIDA o PERTURBADORA (no aburrida)
- Estar en español
- SIN formato markdown, solo texto`
```

**Cache en app**:
- `constants/lociScenes.ts` con objeto+habitación → escena precalculada
- Para combinaciones dinámicas (nuevos objetos en mazos AI), llamar a la edge function

---

### 5.5 Análisis de Nivel de Lectura

**Feature premium**: Antes de leer un texto personalizado, el usuario puede pedir:
- "¿Qué tan difícil es este texto para mi nivel actual?"
- Respuesta: nivel (básico/intermedio/avanzado), velocidad sugerida de RSVP, estimación de tiempo

**Integración**: Botón opcional en la pantalla de selección de texto en `FocalReading.tsx`

---

## Fase 6 — Mejoras de Analytics y Contenido
**Duración estimada: 1 semana**
**Archivos**: `app/(tabs)/progreso.tsx`, `constants/passages.ts`, `lib/content.jsx`

---

### 6.1 Expandir Banco de Contenido

**Problema**: Solo 4 pasajes de texto para todos los ejercicios. Los usuarios los verán repetidos.

**Solución**: Agregar 15-20 pasajes más en `constants/passages.ts` con:
- Diferentes categorías: ciencia, historia, filosofía, tecnología, narrativa
- Diferentes longitudes: corto (150 palabras), medio (300 palabras), largo (500 palabras)
- Dificultad marcada explícitamente para que `pickPassage()` seleccione bien

**Pasajes sugeridos** (temáticas variadas en español):
1. El efecto de la música en la memoria
2. Los beneficios del ayuno intermitente
3. La historia de los videojuegos
4. Por qué soñamos
5. La paradoja de Fermi
6. El arte de la meditación zen
7. Inteligencia artificial y creatividad
8. El origen del lenguaje humano
9. Por qué viajamos
10. La física del tiempo

---

### 6.2 Gráfica de Radar en Estadísticas

**Actualmente**: Stats muestra barras por ejercicio de forma independiente.

**Nuevo**: Agregar un "perfil de habilidades" como gráfica de radar (spider chart) con 6 ejes:
- Velocidad (avg WPM)
- Comprensión (avg comprehension %)
- Memoria visual (loci mastery)
- Memoria verbal (wordspan mastery)
- Enfoque (schulte mastery)
- Vocabulario (flashcard mastery)

**Implementación**: Con `react-native-svg` (ya instalado), dibujar el hexágono manualmente.
Archivo nuevo: `components/ui/RadarChart.tsx`

---

### 6.3 Sesión de "Calentamiento Diario" Inteligente

**Feature**: Botón "Calentamiento rápido" (5 min) que selecciona automáticamente los 2-3 ejercicios que el usuario ha descuidado más recientemente (menor `last_reviewed` relativo a su frecuencia habitual).

**Lógica** en `lib/dailyWarmup.ts`:
```typescript
export function selectWarmupExercises(progress: ExerciseProgress[]): string[] {
  // Sort by "days since last session" × "mastery gap"
  // Return top 2-3 exercise IDs
}
```

**Acceso**: Botón en `progreso.tsx` bajo las KPI cards, y en `ruta.tsx` encima del primer nodo.

---

## Archivos Críticos a Modificar / Crear

### Modificar (sin romper):
```
app/(tabs)/ruta.tsx          ← Parallax, preview modal, daily mission, animaciones nodo
app/(tabs)/progreso.tsx      ← Práctica libre grid, radar chart, flashcard section
components/exercises/
  SchulteGrid.tsx            ← Quadrant hint, cel animation, circular timer
  FocalReading.tsx           ← Speed meter, progress bar, transition mejorada
  LociExercise.tsx           ← Flip cards, map animation, imageMode prop
  WordSpan.tsx               ← Card flip, color coding, vuelo de palabras
  BossExercise.tsx           ← Reaction tap round, mejores animaciones daño
constants/
  passages.ts                ← +15 pasajes nuevos
  lociScenes.ts (NUEVO)      ← Escenas precalculadas loci
lib/
  sm2.ts (NUEVO)             ← Algoritmo SM-2
  ai.ts (NUEVO)              ← Cliente para Supabase Edge Functions de IA
  dailyWarmup.ts (NUEVO)     ← Lógica calentamiento diario
```

### Crear (nuevos):
```
app/flashcards/
  index.tsx                  ← Lista de mazos
  create.tsx                 ← Crear mazo (manual + IA)
  [deckId]/index.tsx         ← Vista mazo
  [deckId]/review.tsx        ← Sesión de review
  [deckId]/edit.tsx          ← Editar cartas
components/
  flashcards/
    FlashCard.tsx            ← Tarjeta con flip animation
    DeckCard.tsx             ← Card de mazo en lista
    QualityButtons.tsx       ← Botones SM-2 after flip
  exercises/shared/
    CircularTimer.tsx        ← Timer circular para Schulte
    WpmMeter.tsx             ← Velocímetro para RSVP
  ui/
    RadarChart.tsx           ← Gráfica hexagonal de habilidades
store/
  useFlashcardStore.ts       ← Store de flashcards + SM-2
supabase/functions/
  ai-questions/index.ts      ← Edge function generación preguntas
  ai-flashcards/index.ts     ← Edge function generación mazos
  ai-loci-images/index.ts    ← Edge function escenas loci
```

---

## Orden de Implementación (Prioridad)

```
SEMANA 1-2:   Fase 1.1 Schulte + Fase 1.2 RSVP (ejercicios más usados)
SEMANA 3:     Fase 1.3 Loci + Fase 1.4 WordSpan + Fase 1.5 Boss
SEMANA 4-5:   Fase 2 Flashcards completa (store + UI + SM-2 + navegación)
SEMANA 6:     Fase 3 Dashboard animado (parallax + preview + daily mission)
SEMANA 7:     Fase 4 Modo libre desde estadísticas
SEMANA 8-9:   Fase 5 IA (Edge Functions + integración ejercicios)
SEMANA 10:    Fase 6 Analytics + pasajes extra + radar chart
```

---

## Variables de Entorno Necesarias (nuevas)

```env
# En Supabase Dashboard → Edge Functions → Secrets
ANTHROPIC_API_KEY=sk-ant-...

# En .env del app (ya debería haber EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY)
# No se necesitan nuevas env vars en el cliente
```

---

## Verificación por Fase

### Fase 1 (Ejercicios):
- [ ] Schulte: Tocar número correcto → scale+disappear, tocar incorrecto → shake rojo
- [ ] RSVP: Barra de progreso se mueve mientras se lee, speedmeter refleja WPM
- [ ] Loci: Animación de "caminar" en el mapa al estudiar, card flip al pasar objeto
- [ ] WordSpan: Palabras tienen colores por posición, selección "vuela" al slot
- [ ] Boss: Ronda de velocidad muestra target en posición aleatoria, hay reaction timing real

### Fase 2 (Flashcards):
- [ ] Crear mazo manual: agregar cartas, guardar en Supabase
- [ ] Sesión de review: flip funciona, botones SM-2 actualizan `due_date` correctamente
- [ ] Carta con quality=1 aparece de nuevo en la misma sesión (comportamiento SM-2)
- [ ] Carta con quality=5 no aparece por varios días

### Fase 3 (Dashboard):
- [ ] Scroll → backdrop se mueve más lento que nodos (parallax visible)
- [ ] Tocar nodo → bottom sheet de preview aparece desde abajo
- [ ] Completar ejercicio + volver → nodo tiene animación de checkmark + partículas

### Fase 4 (Modo libre):
- [ ] En tab Progreso, grid de ejercicios visible debajo de stats
- [ ] Tocar ejercicio en grid → navega al ejercicio en modo free
- [ ] Al terminar en modo free → vuelve a Progreso (no al dashboard de ruta)

### Fase 5 (IA):
- [ ] En ComprehensionEx, pegar texto → obtener preguntas → ejercicio funciona igual
- [ ] En Flashcards create, pegar texto → mazos generados con estructura correcta
- [ ] Edge functions desplegadas en Supabase, API key configurada como secret
- [ ] Rate limiting básico funcional (no superar 100 requests/día en dev)

### Fase 6 (Analytics):
- [ ] Radar chart muestra 6 ejes con valores correctos de los stores
- [ ] `pickPassage()` retorna variedad de los 20+ pasajes nuevos
- [ ] Calentamiento diario selecciona ejercicios con menor sesión reciente
