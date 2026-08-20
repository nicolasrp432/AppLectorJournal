/**
 * Vocabulario de movimiento de la app.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * Antes había 29 configuraciones de muelle distintas repartidas por la app, cada
 * una inventada en su sitio de llamada: damping entre 5 y 20, stiffness entre 75
 * y 300, sin ninguna repetición intencionada. Dos problemas:
 *
 * 1. Esos números están en la escala de Reanimated 3. La 4 usa `GentleSpringConfig`
 *    por defecto (`damping:120, mass:4, stiffness:900`) y un config parcial se
 *    esparce sobre él, así que `mass` seguía siendo 4 mientras damping/stiffness
 *    venían de la escala de mass 1. Resultado: `{damping:6, stiffness:300}` da un
 *    ratio de amortiguación de 0.087 — el elemento rebotaba durante ~5 segundos.
 *
 * 2. Aunque estuvieran bien, un muelle por sitio de llamada no es un sistema.
 *
 * CÓMO SE PIENSA EL MOVIMIENTO AQUÍ
 * ---------------------------------
 * Apple sustituyó deliberadamente el trío de física (masa/rigidez/amortiguación)
 * por dos parámetros de diseñador, y Reanimated 4 los acepta directamente:
 *
 *   dampingRatio — cuánto rebota. 1 = crítico, sin sobrepaso. <1 = oscila.
 *   duration     — duración *percibida* en ms. La real es 1.5× este valor.
 *
 * Son ramas excluyentes en el tipo `SpringConfig`: o pasas {stiffness, damping} o
 * pasas {duration, dampingRatio}, nunca ambas. Usamos siempre la segunda porque
 * es independiente de la masa y por tanto no se rompe al actualizar la librería.
 *
 * LA REGLA QUE DECIDE CUÁL USAR
 * -----------------------------
 * `smooth` por defecto. `momentum` SOLO cuando el gesto traía inercia — un flick,
 * soltar un arrastre. Un menú que apareció con un fade y rebota se siente mal;
 * una tarjeta que lanzaste con el dedo y rebota se siente bien.
 */
import { Easing, ReduceMotion } from 'react-native-reanimated';
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Los tres muelles de la app. No añadas un cuarto sin una razón que puedas
 * defender: la variedad de muelles no es riqueza visual, es ruido.
 *
 * `reduceMotion: System` es el valor por defecto de Reanimated, pero se declara
 * explícitamente para que quede en el sitio donde alguien lo va a leer.
 */
export const SPRING = {
  /**
   * Por defecto. Críticamente amortiguado: llega y se queda, sin rebotar.
   * Para todo lo que no venga de un gesto con inercia.
   */
  smooth: {
    duration: 400,
    dampingRatio: 1,
    reduceMotion: ReduceMotion.System,
  } as WithSpringConfig,

  /**
   * Con un punto de rebote. Solo tras un gesto que llevaba velocidad.
   * Pásale la velocidad de salida del dedo: `{ ...SPRING.momentum, velocity }`.
   */
  momentum: {
    duration: 400,
    dampingRatio: 0.8,
    reduceMotion: ReduceMotion.System,
  } as WithSpringConfig,

  /**
   * Sheets, drawers y paneles. Un poco más rápido que `momentum` porque la
   * superficie es grande y una entrada lenta se lee como lag.
   */
  sheet: {
    duration: 300,
    dampingRatio: 0.8,
    reduceMotion: ReduceMotion.System,
  } as WithSpringConfig,
} as const;

/**
 * Curvas. Las integradas de Reanimated son tan flojas como las de CSS
 * (`Easing.quad` apenas se distingue de lineal), así que se declaran a mano.
 *
 * Nunca `ease-in` en UI: empieza lento justo en el momento que el usuario está
 * mirando, y se lee como retardo.
 */
export const EASE = {
  /** Entradas y salidas. El valor por defecto para casi todo. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** Algo que se mueve o se transforma dentro de la pantalla. */
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** La curva de los sheets de iOS. */
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

/**
 * Duraciones. Todo lo que el usuario toca decenas de veces al día vive en la
 * franja de abajo; nada de UI pasa de 300 ms.
 */
export const DURATION = {
  /** Hundir/soltar un pulsable. Por debajo del umbral de "esto tardó". */
  press: 120,
  /** Un interruptor, un chip, un cambio de estado pequeño. */
  toggle: 180,
  /** Algo que aparece. */
  enter: 240,
  /** Algo que se va. Siempre ≤ que su entrada: irse rápido no se echa de menos. */
  exit: 200,
} as const;

/** Config de timing lista para usar, con la curva correcta ya puesta. */
export const TIMING = {
  press: { duration: DURATION.press, easing: EASE.out, reduceMotion: ReduceMotion.System } as WithTimingConfig,
  toggle: { duration: DURATION.toggle, easing: EASE.out, reduceMotion: ReduceMotion.System } as WithTimingConfig,
  enter: { duration: DURATION.enter, easing: EASE.out, reduceMotion: ReduceMotion.System } as WithTimingConfig,
  exit: { duration: DURATION.exit, easing: EASE.out, reduceMotion: ReduceMotion.System } as WithTimingConfig,
  /** Para lo que se desplaza o se redimensiona dentro de la pantalla. */
  move: { duration: DURATION.toggle, easing: EASE.inOut, reduceMotion: ReduceMotion.System } as WithTimingConfig,
} as const;

/**
 * Escala al pulsar. 0.97 es un 3%: se lee como físico sin caer en dibujo animado.
 * El valor anterior en la app era 0.90 — un 10%, que hunde el elemento de forma
 * muy visible y convierte cada pulsación en un evento.
 *
 * La escala se lleva el icono y el texto con ella, y por eso funciona en móvil
 * donde no hay hover: es lo que hace que el elemento se lea como un objeto.
 */
export const PRESS_SCALE = 0.97;

/** Para superficies grandes (tarjetas, filas anchas), donde un 3% es demasiado. */
export const PRESS_SCALE_LARGE = 0.985;

/**
 * Margen para que un dedo que se desplaza unos píxeles no cancele una pulsación
 * que el usuario sí quería. Se pasa tal cual a `pressRetentionOffset`.
 */
export const PRESS_RETENTION = { top: 12, bottom: 12, left: 12, right: 12 } as const;

/**
 * Área táctil mínima: 44pt en iOS, 48dp en Android. Cuando el elemento visual es
 * más pequeño se compensa con `hitSlop`, nunca agrandando el visual.
 */
export const MIN_TOUCH_TARGET = 44;

/** Calcula el hitSlop necesario para llegar al mínimo desde un tamaño visual dado. */
export function hitSlopFor(visualSize: number): number {
  return Math.max(0, Math.round((MIN_TOUCH_TARGET - visualSize) / 2));
}
