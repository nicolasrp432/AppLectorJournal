# Fase 2 — Optimización y Pulido de LectorApp Neuro-Journey

Después de completar la Fase 1 (esqueleto completo de la app con ejercicios, sistema de XP, lecciones, tienda y flashcards), esta etapa se enfoca en **corregir bugs críticos**, **simplificar interfaces sobrecargadas** y **añadir funcionalidades reales** que mejoran la experiencia del usuario.

---

## User Review Required

> [!IMPORTANT]
> **Palacio de la Memoria con imágenes IA**: La Fase 5 propone usar **Google Imagen 3** (vía Gemini API con `imageGenerationConfig`) para generar escenas visuales en el Palacio de la Memoria. Esto tiene un **costo por imagen generada**. ¿Prefieres esta opción, o limitarnos a emojis/ilustraciones estáticas por ahora?

> [!WARNING]
> **Tabla `notifications` en Supabase**: La Fase 4 creará una nueva tabla en tu base de datos. Una vez aplicada la migración, la tabla `notifications` estará en producción.

## Open Questions

1. **Centro de notificaciones**: ¿Prefieres un **icono de campana** en el header de `ruta.tsx` que abra un panel deslizante (bottom sheet), o una **pantalla dedicada** accesible desde las tabs?
2. **Palacio de la Memoria**: ¿Cuántas imágenes generadas por sesión consideras razonable? (Propuesta: máximo 5, una por habitación)
3. **RSVP — barra de progreso**: El usuario pidió eliminar una de las dos barras. Propuesta: conservar **solo la barra inferior** (más detallada, muestra conteo de palabras) y eliminar la del `ExerciseTopBar`. ¿Correcto?

---

## Proposed Changes

Las 5 fases se ejecutan en orden de dependencia. Cada fase es independientemente deployable.

---

### FASE 1 — Corrección de Bugs Críticos

Dos crashes detectados en producción: el error HTTP 500 en la Edge Function `ai-analyze-reading` y el crash de `CSSStyleDeclaration` en Expo Web.

---

#### Bug 1A: Edge Function `ai-analyze-reading` — HTTP 500

**Diagnóstico**: La función falla cuando:
- `GEMINI_API_KEY` no está configurado como secreto de la Edge Function
- El texto enviado contiene comillas sin escapar que rompen el JSON del prompt
- La respuesta de Gemini incluye `candidates` vacío o `finishReason: "SAFETY"`

##### [MODIFY] [index.ts](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/supabase/functions/ai-analyze-reading/index.ts)

**Cambios:**

1. **Escapar el texto del usuario** (L32-36): Reemplazar la interpolación directa `"${text}"` por un escape seguro con `JSON.stringify(text)` dentro del prompt para evitar romper la estructura JSON.

2. **Manejar respuestas vacías de Gemini** (L66-67): Agregar validación defensiva antes de acceder a `result.candidates[0]`:
```diff
-    const textResponse = result.candidates[0].content.parts[0].text;
-    const parsed = JSON.parse(textResponse);
+    const candidate = result.candidates?.[0];
+    if (!candidate || candidate.finishReason === 'SAFETY' || !candidate.content?.parts?.[0]?.text) {
+      return new Response(JSON.stringify({
+        difficulty: 'medio',
+        explanation: 'No se pudo analizar el texto. Usando valores predeterminados.',
+        suggestedWpm: 280,
+      }), {
+        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
+      });
+    }
+    const textResponse = candidate.content.parts[0].text;
+    const parsed = JSON.parse(textResponse);
```

3. **Envolver `JSON.parse` en try-catch** (L67): Si Gemini devuelve JSON malformado a pesar del `responseMimeType`, retornar valores por defecto.

##### [MODIFY] [FocalReading.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/exercises/FocalReading.tsx) — L82-100

**Cambio**: En el `catch` de `analyzeText()`, en lugar de solo `console.warn`, aplicar valores por defecto silenciosamente para que la pantalla de configuración siga siendo funcional:

```diff
       } catch (err) {
-        console.warn('AI reading analysis failed:', err);
+        console.warn('AI reading analysis failed, using defaults:', err);
+        if (active) {
+          setAiAnalysis({ difficulty: 'medio', explanation: 'Análisis no disponible.', suggestedWpm: 280 });
+        }
       } finally {
```

---

#### Bug 1B: `CSSStyleDeclaration` Crash en Expo Web

**Diagnóstico**: El error `TypeError: Failed to set an indexed property [0] on 'CSSStyleDeclaration'` ocurre porque el web stub de Reanimated (`lib/reanimated.web.stub.js`) mapea `Animated.View` → RN `View`, y cuando se pasan style arrays (ej: `style={[rsvpStyles.container, flashStyle]}`) a un `<View>` renderizado como `<div>` en web, React DOM intenta setear estilos indexados en `CSSStyleDeclaration` en lugar de mergeados.

##### [MODIFY] [reanimated.web.stub.js](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/lib/reanimated.web.stub.js) — L1-3, L123-130

**Cambios:**

1. Importar `StyleSheet` de React Native (L2):
```diff
-const { View, Text, ScrollView, Image, FlatList } = require('react-native');
+const { View, Text, ScrollView, Image, FlatList, StyleSheet } = require('react-native');
```

2. Crear wrappers que aplanan style arrays antes de pasarlos al componente nativo. Reemplazar los componentes raw del namespace `Animated` (L123-130):

```diff
-var Animated = {
-  View:    View,
-  Text:    Text,
-  ScrollView: ScrollView,
-  Image:   Image,
-  FlatList: FlatList,
-  createAnimatedComponent: function (Comp) { return Comp; },
-};
+function flattenStyle(s) {
+  if (s == null) return s;
+  if (Array.isArray(s)) return StyleSheet.flatten(s);
+  return s;
+}
+
+function wrapComponent(Comp) {
+  var wrapped = React.forwardRef(function(props, ref) {
+    var flatStyle = flattenStyle(props.style);
+    return React.createElement(Comp, Object.assign({}, props, { ref: ref, style: flatStyle }));
+  });
+  wrapped.displayName = 'Animated(' + (Comp.displayName || Comp.name || 'Component') + ')';
+  return wrapped;
+}
+
+var Animated = {
+  View:       wrapComponent(View),
+  Text:       wrapComponent(Text),
+  ScrollView: wrapComponent(ScrollView),
+  Image:      wrapComponent(Image),
+  FlatList:   wrapComponent(FlatList),
+  createAnimatedComponent: function (Comp) { return wrapComponent(Comp); },
+};
```

Esto intercepta todos los `style={[a, b, c]}` y los aplana a un objeto plano antes de que lleguen al DOM.

---

### FASE 2 — Simplificación del Ejercicio RSVP (Lectura Focal)

La pantalla de lectura RSVP está visualmente saturada. El usuario pidió:
- ❌ Quitar el `WpmMeter` (velocímetro circular)
- ❌ Quitar las líneas laser verticales, puntos laser, fondo gris y lente focal
- ✅ Conservar solo el texto con ORP highlighting (letra naranja en el centro)
- ❌ Eliminar la barra de progreso superior (dejar solo la inferior)

##### [MODIFY] [FocalReading.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/exercises/FocalReading.tsx)

**Cambio 1 — Eliminar WpmMeter del render** (L264-267):
```diff
             {mode === 'rsvp'  && (
-              <View style={{ alignItems: 'center', gap: 24, width: '100%' }}>
-                <WpmMeter wpm={wpm} accent={accent} />
-                <RSVPDisplay word={words[idx]} accent={accent} />
-              </View>
+              <RSVPDisplay word={words[idx]} accent={accent} />
             )}
```

**Cambio 2 — Ocultar progress bar del ExerciseTopBar** (L260):
Pasar `progress={-1}` o crear prop `hideProgress` en `ExerciseTopBar` para que no renderice la barra. Opción más limpia: pasar `progress` como `undefined`:
```diff
-        <ExerciseTopBar progress={idx / words.length} accent={accent} onQuit={onQuit} title={`${wpm} WPM`} />
+        <ExerciseTopBar progress={-1} accent={accent} onQuit={onQuit} title={`${wpm} WPM`} />
```

**Cambio 3 — Simplificar `RSVPDisplay`** (L382-441):
Reescribir el componente completo. Eliminar todos los elementos decorativos y dejar solo el texto limpio:

```tsx
function RSVPDisplay({ word, accent }: { word: string; accent: string }) {
  if (!word) return <View />;
  const orpIdx = Math.max(0, Math.min(word.length - 1, Math.floor(word.length * 0.35)));
  const prefix = word.slice(0, orpIdx);
  const orpLetter = word[orpIdx];
  const suffix = word.slice(orpIdx + 1);

  return (
    <View style={rsvpStyles.container}>
      <View style={rsvpStyles.wordContainer}>
        <View style={rsvpStyles.prefixAlign}>
          <Text style={rsvpStyles.wordTextSide}>{prefix}</Text>
        </View>
        <Text style={[rsvpStyles.wordTextORP, { color: accent }]}>{orpLetter}</Text>
        <View style={rsvpStyles.suffixAlign}>
          <Text style={rsvpStyles.wordTextSide}>{suffix}</Text>
        </View>
      </View>
    </View>
  );
}
```

**Cambio 4 — Simplificar `rsvpStyles`** (L483-569):
Eliminar estilos de `laserLineTop`, `laserDotTop`, `laserLineBottom`, `laserDotBottom`, `focalLens`, `orpCenterContainer`. Simplificar `container` quitando fondo gris, borde y border-radius:

```tsx
const rsvpStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    minHeight: 120,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  prefixAlign: { flex: 1, alignItems: 'flex-end' },
  suffixAlign: { flex: 1, alignItems: 'flex-start' },
  wordTextSide: {
    fontFamily: FONTS.body,
    fontSize: 34,
    color: '#475569',
    letterSpacing: 0.5,
  },
  wordTextORP: {
    fontFamily: FONTS.heading,
    fontSize: 36,
    fontWeight: '900',
    marginHorizontal: 2,
  },
});
```

**Cambio 5 — Eliminar import de WpmMeter** (L16):
```diff
-import { WpmMeter } from './shared/WpmMeter';
```

##### [MODIFY] [ExerciseTopBar.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/exercises/ExerciseTopBar.tsx) — L15-43

**Cambio**: Ocultar la barra de progreso cuando `progress < 0`:
```diff
       {title ? <Text style={styles.titleText}>{title}</Text> : null}
+      {progress >= 0 && (
         <View style={styles.progressTrack} onLayout={...}>
           <Animated.View style={[styles.progressFill, ...]} />
         </View>
+      )}
```

---

### FASE 3 — Rediseño del Ejercicio de Enfoque (Visión Periférica)

El `PeripheralVisionGame` tiene problemas de encuadre en Expo Web. El `configContainer` con `justifyContent: 'center'` empuja el botón "Iniciar práctica" fuera de viewport cuando combinado con el `SafeAreaView` padre.

##### [MODIFY] [id.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/app/lesson/[id].tsx)

**Cambio 1 — Convertir config panel en ScrollView** (L321-376):
Envolver el contenido del `configContainer` en un `ScrollView` para que sea scrolleable en viewports pequeños:

```diff
   if (isConfiguring) {
     return (
-      <View style={styles.configContainer}>
+      <ScrollView contentContainerStyle={styles.configContainer}>
         <Ionicons name="eye-outline" size={54} ... />
         ...
         <Pressable style={...} onPress={() => setIsConfiguring(false)}>
           <Text ...>Iniciar práctica</Text>
         </Pressable>
-      </View>
+      </ScrollView>
     );
   }
```

**Cambio 2 — Ajustar `configContainer` style** (L1096-1103):
Cambiar de `flex: 1` centrado a un layout que respete scroll:

```diff
   configContainer: {
-    flex: 1,
     width: '100%',
     maxWidth: 400,
-    paddingHorizontal: 10,
+    paddingHorizontal: 20,
+    paddingVertical: 30,
     alignItems: 'center',
-    justifyContent: 'center',
+    alignSelf: 'center',
+    flexGrow: 1,
   },
```

**Cambio 3 — Responsivizar el `gameContainer`** (L1090-1094):
Agregar `maxWidth` y `alignSelf: 'center'` para que en pantallas anchas (web) el juego no se estire:

```diff
   gameContainer: {
     flex: 1,
     paddingHorizontal: 20,
     paddingTop: 20,
     alignItems: 'center',
+    maxWidth: 500,
+    alignSelf: 'center',
+    width: '100%',
   },
```

**Cambio 4 — Responsivizar `playboard`**: Agregar `aspectRatio: 1` y `maxWidth/maxHeight` al board de juego para que no se deforme en pantallas grandes.

---

### FASE 4 — Sistema de Notificaciones desde Supabase

Reemplazar el banner "MISIÓN DE HOY" fijo en la parte superior de `ruta.tsx` con un **Centro de Notificaciones** accesible desde un icono de campana en el header. Las misiones pasarán a ser notificaciones serverside.

---

#### 4A. Nueva tabla `notifications`

##### [NEW] [004_notifications.sql](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/supabase/migrations/004_notifications.sql)

```sql
-- ─── notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'mission'
                          CHECK (category IN ('mission','achievement','system','streak','tip')),
  icon        TEXT        DEFAULT 'notifications-outline',
  xp_reward   INT         DEFAULT 0,
  claimed     BOOLEAN     NOT NULL DEFAULT FALSE,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: owner read"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications: owner update"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Auto-generate daily mission notification via cron or edge function
-- (Phase 4B handles this via the existing useDailyMissionStore logic)
```

Se ejecutará con el MCP de Supabase (`apply_migration` o `execute_sql`).

---

#### 4B. Store de notificaciones

##### [NEW] [useNotificationStore.ts](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/store/useNotificationStore.ts)

Nuevo Zustand store que:
- `fetchNotifications()`: lee de `notifications` tabla filtrado por `user_id`
- `markAsRead(id)`: actualiza `read = true`
- `claimReward(id)`: si `xp_reward > 0`, llama a `addXP()` y setea `claimed = true`
- `unreadCount`: selector derivado para el badge del icono campana
- Polling con `setInterval` cada 60s o Supabase Realtime subscription

---

#### 4C. Componente NotificationCenter

##### [NEW] [NotificationCenter.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/ui/NotificationCenter.tsx)

Bottom sheet o modal que:
- Muestra lista de notificaciones ordenadas por `created_at DESC`
- Cada item tiene icono, título, mensaje, badge de XP si aplica
- Swipe-to-dismiss marca como leída
- Botón "Reclamar" para notificaciones con recompensa
- Diseño premium con gradientes sutiles por categoría

---

#### 4D. Integrar campana en el header de Ruta

##### [MODIFY] [ruta.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/app/(tabs)/ruta.tsx)

**Cambio 1 — Eliminar banner "MISIÓN DE HOY"** (L591-642):
Eliminar el bloque JSX completo del `{mission && (...)}` renderizado dentro del `ScrollView`.

**Cambio 2 — Agregar icono de campana en el header** (L574-583):
```diff
       <View style={styles.header}>
         <Text style={styles.headerTitle}>Ruta de aprendizaje</Text>
-        {profile && (
-          <View style={styles.xpBadge}>
-            <Ionicons name="flash" size={13} color="#78350F" />
-            <Text style={styles.xpText}>{profile.xp} XP</Text>
-          </View>
-        )}
+        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
+          {profile && (
+            <View style={styles.xpBadge}>
+              <Ionicons name="flash" size={13} color="#78350F" />
+              <Text style={styles.xpText}>{profile.xp} XP</Text>
+            </View>
+          )}
+          <Pressable onPress={() => setShowNotifications(true)} hitSlop={8}>
+            <Ionicons name="notifications-outline" size={22} color={COLORS.ink} />
+            {unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount}</Text></View>}
+          </Pressable>
+        </View>
       </View>
```

**Cambio 3 — Migrar misiones a notificaciones**: Modificar `useDailyMissionStore.checkOrGenerate()` para que además de generar la misión local, inserte un registro en la tabla `notifications` de Supabase (solo si no existe una notificación de misión para hoy). Esto preserva la compatibilidad con el tracking local de progreso.

**Cambio 4 — Limpiar imports no utilizados**: Eliminar `useDailyMissionStore` imports si la lógica de misión se delega completamente a notificaciones, o mantenerlo como motor de tracking con la UI en el notification center.

---

### FASE 5 — Palacio de la Memoria con Imágenes IA

Transformar las "asociaciones imaginarias" del Palacio de la Memoria de texto puro a **tarjetas visuales con imágenes generadas por IA**.

---

#### 5A. Nueva Edge Function para generación de imágenes

##### [MODIFY] [index.ts](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/supabase/functions/ai-loci-images/index.ts)

Reescribir la función para que además de generar la descripción textual, genere una imagen usando **Google Gemini con Imagen 3**:

```typescript
// POST body: { room: string, hook: string }
// 1. Usar Gemini para generar un prompt de imagen basado en el hook
// 2. Llamar a Gemini Imagen 3 via generateContent con imageGenerationConfig
// 3. Retornar { description: string, imageBase64: string, mimeType: string }
```

El flujo concreto:
1. Recibir `room` y `hook` (la asociación textual del Loci)
2. Usar Gemini Flash para generar un prompt de imagen descriptivo y artístico
3. Llamar a `gemini-2.0-flash-exp` (o modelo con imagen) con `responseModalities: ['IMAGE', 'TEXT']`
4. Retornar la imagen en base64 + la descripción textual

**Fallback**: Si la generación de imagen falla, retornar solo la descripción textual (comportamiento actual).

---

#### 5B. Actualizar `LociStoryCard` para mostrar imágenes

##### [MODIFY] [LociExercise.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/exercises/LociExercise.tsx) — L440-487

**Cambios en `LociStoryCard`**:
- Agregar prop `imageUri?: string` a la interfaz
- Si `imageUri` existe, renderizar un `<Image>` con bordes redondeados dentro de la tarjeta de gradiente, por encima del texto descriptivo
- Agregar un shimmer/skeleton mientras la imagen carga
- Mantener el emoji como fallback si no hay imagen

```tsx
function LociStoryCard({ text, roomId, imageUri, isLoading }: {
  text: string; roomId: string; imageUri?: string; isLoading?: boolean;
}) {
  // ... existing animation code ...
  return (
    <Animated.View style={[animatedStyle, styles.storyCard, { borderColor: aspect.border }]}>
      <LinearGradient ...>
        <View style={styles.storyCardHeader}>...</View>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.storyCardImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.storyCardContentRow}>
          {!imageUri && <Text style={styles.storyCardEmoji}>{aspect.emoji}</Text>}
          <View style={styles.storyCardTextCol}>
            <Text style={...}>{text}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
```

**Nuevo estilo `storyCardImage`**:
```tsx
storyCardImage: {
  width: '100%',
  height: 160,
  borderRadius: 12,
  marginBottom: 10,
},
```

##### [MODIFY] [LociExercise.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/components/exercises/LociExercise.tsx) — L100-120

Actualizar la llamada a `ai-loci-images` para recibir y almacenar la imagen:

```diff
           const { data, error } = await supabase.functions.invoke('ai-loci-images', {
-            body: { room: item.label, items: [item.word] }
+            body: { room: item.label, hook: getSurrealLociAssociation(item.label, item.word) }
           });
-          if (!error && data?.descriptions?.[0]) {
-            return { id: item.id, story: data.descriptions[0].description };
+          if (!error && data) {
+            return {
+              id: item.id,
+              story: data.description || getSurrealLociAssociation(item.label, item.word),
+              imageUri: data.imageBase64
+                ? `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
+                : undefined,
+            };
           }
```

---

#### 5C. Actualizar el Palacio de la Memoria en `lesson/[id].tsx`

##### [MODIFY] [id.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/app/lesson/[id].tsx) — L436-480

Agregar un campo `imageUri?: string` al tipo `LociRoom` y al state de `LociMemoryPalace`. Cuando el usuario toca una habitación, si tiene imagen generada, mostrarla en la tarjeta overlay.

---

## Verification Plan

### Automated Tests

```bash
# 1. Verificar que la app compila sin errores
cd lectorapp && npx expo start --web --no-dev

# 2. Verificar que la Edge Function responde correctamente
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/ai-analyze-reading \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"text": "Este es un texto de prueba para análisis."}'

# 3. Verificar que la tabla notifications existe
# Via MCP Supabase: execute_sql("SELECT * FROM notifications LIMIT 1")
```

### Manual Verification

**Fase 1:**
- [ ] Abrir la app en Expo Web → no debe aparecer el error `CSSStyleDeclaration` en consola
- [ ] Ir a Lectura Focal → la pantalla de config debe cargar el análisis IA sin error 500
- [ ] Si la API falla, debe mostrar "Dificultad: medio" como fallback

**Fase 2:**
- [ ] Iniciar lectura RSVP → la pantalla muestra SOLO el texto con ORP highlighting
- [ ] No hay velocímetro circular, ni líneas laser, ni lente focal
- [ ] Solo hay UNA barra de progreso (la inferior con conteo de palabras)

**Fase 3:**
- [ ] Abrir lección de Enfoque → la pantalla de config es scrolleable
- [ ] El botón "Iniciar práctica" siempre es visible
- [ ] En pantallas anchas (web), el board de juego no se estira indefinidamente

**Fase 4:**
- [ ] El banner "MISIÓN DE HOY" ya NO aparece en la parte superior de Ruta
- [ ] Hay un icono de campana en el header con badge de conteo
- [ ] Al tocar la campana, se abre un panel con notificaciones

**Fase 5:**
- [ ] Al explorar una habitación del Palacio de la Memoria, se muestra una imagen generada por IA
- [ ] Si la generación falla, se muestra el texto descriptivo con emoji (fallback)
