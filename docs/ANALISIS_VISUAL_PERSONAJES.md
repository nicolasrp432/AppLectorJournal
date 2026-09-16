# Auditoría visual y rediseño de personajes

## Diagnóstico

### Fortalezas que se preservan

- **Lenguaje propio:** la familia de formas y su color por habilidad hacen que la
  ruta se entienda sin depender únicamente de texto.
- **Implementación escalable:** las mascotas son vectores, funcionan en web,
  Android e iOS y no agregan descargas de imágenes pesadas.
- **Expresiones contextuales:** los estados `calm`, `happy`, `wow`, `sleepy`,
  `wink`, `fast`, `serious`, `angry` y `defeated` permiten que el personaje
  responda al resultado de cada ejercicio.
- **Identidad consistente:** la paleta de las mascotas ya coincide con ejercicios,
  zonas, recompensas y dificultad.

### Debilidades encontradas

- La silueta y el color diferenciaban a cada personaje, pero les faltaban
  atributos propios. En tamaños pequeños podían percibirse como variaciones de
  la misma figura.
- La respiración era casi el único movimiento ambiental visible. Todos respiraban
  con la misma cadencia, por lo que un grupo se sentía sincronizado y artificial.
- El movimiento dependía demasiado de una lectura corporal humana; para estas
  figuras abstractas conviene comunicar intención mediante forma, ritmo y luz.
- Los gradientes SVG usaban identificadores globales. Al renderizar varias
  mascotas juntas en web podían colisionar y tomar el gradiente de otra instancia.
- La preferencia de movimiento reducido no llegaba al componente de personaje.

## Rediseño aplicado

1. **Volumen de tres capas.** Cada cuerpo combina iluminación radial, ribete de
   luz, brillo diagonal y sombra lateral. Se conserva la estética clay original,
   pero se mejora la lectura del volumen.
2. **Figuras con personalidad, no personajes humanizados.** Cada integrante usa
   un glifo geométrico: apertura de enfoque, onda serena, rayos de alegría,
   líneas de velocidad, constelación de memoria, órbita Loci y facetas del jefe.
   No se utilizan brazos, manos, ropa ni gestos humanos.
3. **Movimiento orgánico.** Respiración, flotación y balanceo de la propia forma
   tienen una cadencia diferente por personaje. La variación es determinista para
   evitar saltos visuales entre renders.
4. **Elenco como escena.** El grupo de bienvenida ahora vive sobre un halo con
   destellos, creando profundidad y una composición de equipo en lugar de una
   simple fila de figuras.
5. **Accesibilidad.** Si el usuario activa movimiento reducido, se detienen los
   bucles de respiración, balanceo y parpadeo; las expresiones y la identidad
   visual permanecen intactas.
6. **SVG seguro por instancia.** Cada gradiente recibe un identificador único, de
   modo que varias mascotas pueden convivir sin contaminación de estilos en web.

## Plan completado y criterios de continuidad

- Las intenciones `celebrate`, `coach`, `focus` y `defeat` ya están conectadas a
  resultados, lectura, lecciones, flashcards, enfoque y batalla de jefe. El
  movimiento ahora comunica el estado de la experiencia.
- La complejidad visual responde al tamaño: por debajo de 52 px se ocultan los
  glifos finos, conservando silueta, color, rostro y volumen legibles.
- No se añadió sonido automático: la aplicación todavía no ofrece una preferencia
  independiente para efectos. Introducirlo sin ese control contradiría el criterio
  de accesibilidad; debe llegar junto con su ajuste de encendido y volumen.
- Extraer los escenarios extensos de `ruta.tsx` en componentes para facilitar el
  diseño y prueba independiente de cada zona.
