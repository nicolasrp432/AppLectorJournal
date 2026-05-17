# Plan de Implementación: LectorApp Neuro-Journey

> **Estado general:** Fases 1–4 completadas. Quedan 4 fases nuevas para llevar la app a producción.

---

## Estado de las Fases Originales

### ~~Fase 1: Corrección de Diseño~~ ✅ COMPLETADA
- [x] **Login Screen** — `socialRow` centrado, `content` con `maxWidth: 480` y `alignSelf: 'center'`
- [x] **Ruta de Aprendizaje** — `W = Math.min(width, 520) - 40`, scroll centrado, `LociExercise` también corregido

### ~~Fase 2: Backend y Autenticación~~ ✅ COMPLETADA
- [x] **Registro** conectado a `supabase.auth.signUp` con `options.data.name`
- [x] **Aislamiento por usuario** — RLS en todas las tablas, stores leen por `userId`
- [x] **Sesión persistente** — `AsyncStorage` via Zustand persist; `supabase.auth.onAuthStateChange` en `_layout.tsx`
- [x] **Perfil** — foto (`expo-image-picker` + Supabase Storage), nombre, bio, nivel, XP

### ~~Fase 3: Motor de Ejercicios~~ ✅ COMPLETADA
- [x] **7 ejercicios** funcionales: Schulte, FocalReading, WordSpan, Loci, Comprehension, Boss, FreeReading
- [x] **Desbloqueo secuencial** — `resolveNodeLocked()` en `ruta.tsx`; Zona 2 requiere `z1_boss`, Zona 3 requiere `z2_boss`
- [x] **`useNodeStore`** — `completeNode()` persiste en AsyncStorage + Supabase `node_completions`
- [x] **SQL** — `002_node_completions.sql` creado ⚠️ *pendiente ejecutar en Supabase Dashboard*

### ~~Fase 4: Lector Inmersivo~~ ✅ COMPLETADA
- [x] **`reader/[id].tsx`** — Modo RSVP (palabra a palabra, WPM variable) y Scroll (texto continuo)
- [x] **XP al terminar** — `addXP()` llamado al completar capítulo

---

## Nuevas Fases (En desarrollo)

### ~~Fase 5: Logros y Gamificación~~ ✅ COMPLETADA
- [x] **`store/useAchievementsStore.ts`** — 9 condiciones reales, `checkAll()`, `fetchUnlocked()`, persistencia AsyncStorage + Supabase `owned_rewards`
- [x] **`components/ui/AchievementToast.tsx`** — toast animado (slide desde arriba, Reanimated, color violeta, cola de logros múltiples)
- [x] **`perfil.tsx`** — usa `useAchievementsStore` en lugar de condición hardcodeada; badge verde ✓ en logros desbloqueados
- [x] **`exercise/[id].tsx`** — llama `checkAll()` al terminar cada ejercicio; muestra `AchievementToast` en pantalla de resultado
- [x] **`_layout.tsx`** — `fetchUnlocked(userId)` incluido en `syncUser` (carga al iniciar sesión)

### ~~Fase 6: Biblioteca y Lector conectados~~ ✅ COMPLETADA
- [x] **`constants/catalogContent.ts`** — extractos originales en español de ~500 palabras para los 8 libros del catálogo
- [x] **`libros.tsx`** — `handleCatalogPress`: inserta el libro en el store con contenido al primer toque; navega directamente si ya está en biblioteca; spinner de carga; badge "En tu biblioteca"; empty state en "Mis libros"
- [x] **`_layout.tsx`** — `fetchLibrary(userId)` incluido en `syncUser` (restaura biblioteca desde Supabase al login)
- [x] **`reader/[id].tsx`** — reanuda RSVP desde posición guardada (`resumeWordIdx`); botón "Continuar (X% leído)" o "Comenzar desde el principio"

### ~~Fase 7: Tienda funcional~~ ✅ COMPLETADA
- [x] **Equipar tema** — `useRewardsStore.equip()` llama `usePrefsStore.update({ theme_color: value })`; `GlassNavbar` lo recibe vía `app/(tabs)/_layout.tsx`
- [x] **Equipar avatar** — `equip()` llama `useProfileStore.updateProfile({ avatar: mascot })`; persiste en Supabase `profiles`
- [x] **Compra con XP** — verificación `xp < r.cost` en `handleAction`; `addXP(-r.cost)` antes de `buy()`; `buy()` persiste `owned_rewards` en Supabase
- [x] **`fetchOwned(userId)`** — carga IDs comprados desde `owned_rewards` (excluye IDs de achievements); integrado en `syncUser`

### ~~Fase 8: Estadísticas reales (progreso.tsx)~~ ✅ COMPLETADA
- [x] **WPM trend chart** — `wpmTrend` useMemo: un punto por día durante 7 días desde `useSessionStore.list()`
- [x] **Activity heatmap** — 28 celdas con conteo real de sesiones por fecha desde `useSessionStore`
- [x] **KPIs reales** — minutes7d, avgWpm, avgComp calculados desde sesiones reales; streak desde `profile.streak`
- [x] **Mock data eliminado** — `useSessionStore` arranca con `sessions: []`; `fetchRecent(userId)` en `syncUser` carga desde Supabase

---

## Infraestructura Pendiente (No-código)

| Tarea | Dónde |
|-------|-------|
| Ejecutar `002_node_completions.sql` | Supabase Dashboard → SQL Editor |
| Crear bucket `avatars` en Supabase Storage | Supabase Dashboard → Storage |
| Habilitar proveedor Google OAuth (opcional) | Supabase Dashboard → Auth → Providers |

---

## Orden de Ejecución Recomendado

```
Fase 5 (Logros)  →  Fase 8 (Stats reales)  →  Fase 6 (Biblioteca)  →  Fase 7 (Tienda)
```

**Justificación:** Los logros y estadísticas son lo que más retención genera en apps de aprendizaje. La biblioteca y tienda necesitan contenido (libros reales) y XP acumulado que vendrá de completar ejercicios.

---

> Confirma el orden o indica por cuál fase quieres comenzar.
