# Plan de Implementación: Estadísticas Universales (Web & Móvil) y Auditoría de Login Profesional

Este plan detalla las soluciones técnicas para resolver dos problemas críticos identificados en la plataforma:
1. **Gráficos de Estadísticas en Web**: Actualmente las estadísticas usan `victory-native` que depende del motor nativo de Canvas/Skia, haciendo que fallen o no se muestren en la versión web. Habilitaremos gráficos hermosos, ligeros, responsivos e interactivos en ambas plataformas.
2. **Redirección de Login con Google (OAuth)**: El error de redirección a `localhost` en producción ocurre cuando la URL solicitada no coincide con los dominios permitidos en el panel de control de Supabase, activando el fallback por defecto. Crearemos una arquitectura de login universal robusta y explicaremos los ajustes de configuración de URLs en Supabase.

---

## 🙋 Revisión y Ajustes Requeridos del Usuario

> [!IMPORTANT]
> **Configuración en el Dashboard de Supabase (Indispensable para Google OAuth)**
> Para que el inicio de sesión con Google funcione tanto en desarrollo local como en producción sin redirigir a `localhost`, debes configurar los siguientes campos en tu **Supabase Dashboard → Authentication → URL Configuration**:
> 1. **Site URL**: Configura la URL base de tu aplicación web de producción: `https://lectorapp.space` (y `https://www.lectorapp.space` si aplica).
> 2. **Redirect URLs** (Additional Redirect URLs): Añade las URLs de redirección permitidas para desarrollo y entorno nativo:
>    - `http://localhost:8081` (Desarrollo Web en puerto Expo 8081)
>    - `http://localhost:19006` (Puerto secundario Expo Web)
>    - `lectorapp://google-auth` (Redirección para la aplicación móvil nativa)

---

## 🛠️ Cambios Propuestos

### Componente: Estadísticas Universales

#### [MODIFY] [progreso.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/app/(tabs)/progreso.tsx)
Reemplazar la dependencia de Skia/`victory-native` con implementaciones de gráficos customizadas que funcionan de forma idéntica y con alto rendimiento (60 FPS) tanto en Web como en Móvil:

1. **`UniversalLineChart` (Gráfico de Línea de WPM - SVG Puro)**:
   - Utilizaremos `react-native-svg` (compatible de forma nativa en web y móvil).
   - Generaremos un trazado suave (`Path`) conectando las lecturas WPM diarias de la semana.
   - Añadiremos un gradiente translúcido en la zona inferior de la curva usando `<LinearGradient>` para dar un acabado Dribbble premium.
   - Añadiremos líneas guía horizontales discontinuas y puntos de datos (círculos) con brillo de neón.
   - Usaremos `viewBox` responsivo de SVG para que el gráfico se adapte automáticamente al tamaño de cualquier pantalla.

2. **`UniversalBarChart` (Gráfico de Barras de Sesiones - Flexbox/CSS)**:
   - Crearemos un gráfico de barras interactivo de alto impacto utilizando contenedores estándar de React Native y estilos Flexbox.
   - Cada barra representará las sesiones diarias, con bordes redondeados (`borderTopLeftRadius` y `borderTopRightRadius`) y sombras suaves.
   - Cada barra tendrá interacción al tacto/hover, mostrando un pequeño globo de texto flotante con la cantidad exacta de sesiones al ser pulsada.
   - Totalmente responsivo en móvil y navegadores de escritorio.

---

### Componente: Login y Registro Profesional (Universal OAuth)

#### [MODIFY] [login.tsx](file:///c:/Users/TP412/Dropbox/PC/Documents/LectorApp_Neuro-Journey/lectorapp/app/(auth)/login.tsx)
Reestructurar la lógica de inicio de sesión con Google (`handleGoogle`) para implementar un flujo híbrido según la plataforma:

1. **Flujo para Navegadores Web (Platform.OS === 'web')**:
   - Evitar el uso de `WebBrowser.openAuthSessionAsync` (que abre molestas ventanas emergentes propensas a ser bloqueadas por el navegador).
   - Utilizar el redireccionamiento directo nativo del navegador mediante `supabase.auth.signInWithOAuth`.
   - Calcular la URL de redirección dinámicamente usando `window.location.origin`, permitiendo que funcione sin modificaciones en desarrollo (`localhost`) y en producción.
   - Supabase detectará automáticamente el hash `#access_token` en la URL al retornar al origen y autenticará la sesión de manera transparente.

2. **Flujo para Aplicaciones Móviles (iOS / Android)**:
   - Mantener el flujo in-app seguro con `WebBrowser.openAuthSessionAsync` para abrir la sesión OAuth de Google sin salir de la aplicación.
   - Utilizar el esquema deep-link de la aplicación (`lectorapp://google-auth`) para un regreso limpio.

3. **Retroalimentación de Carga y Manejo de Errores**:
   - Asegurar que el spinner de carga persista visualmente durante toda la transacción.
   - Sanitizar errores técnicos y presentarlos al usuario en español legible.

---

## 🧪 Plan de Verificación

### 1. Pruebas en Web (Local & Producción)
- **Estadísticas**: Abrir la página `/progreso` en un navegador web y verificar que la gráfica de línea de WPM y las barras de actividad diaria se rendericen con perfecta resolución, colores HSL nítidos y sin causar crashes en la consola.
- **Login de Google**: Pulsar "Google Sign-In" en la web. Verificar que redirija al formulario de consentimiento de Google y retorne correctamente a la ruta de la aplicación activa (`/ruta`), sincronizando el perfil del usuario.

### 2. Pruebas en Dispositivos Móviles
- **Estadísticas**: Abrir en Expo Go o build nativo. Verificar que los mismos componentes de gráficos SVG y Flexbox se rendericen a 60 FPS sin ralentizar el scroll.
- **Login de Google**: Verificar que se abra el modal seguro de `WebBrowser` y regrese exitosamente a la aplicación a través de `lectorapp://google-auth`.

### 3. Validación de Tipados
- Ejecutar `npx tsc --noEmit` para garantizar la integridad absoluta de las modificaciones de TypeScript.
