export const FONTS = {
  heading:     'Nunito_900Black',
  headingBold: 'Nunito_800ExtraBold',
  headingSemi: 'Nunito_700Bold',
  body:        'Lexend_500Medium',
  bodyLight:   'Lexend_400Regular',
  bodyBold:    'Lexend_700Bold',
} as const;

export const FONT_SIZE = {
  xs:  10,
  sm:  12,
  md:  14,
  base: 15,
  lg:  16,
  xl:  18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
} as const;

export type FontSizeKey = keyof typeof FONT_SIZE;

/**
 * Tracking (letter-spacing) por tamaño.
 *
 * El tracking no es un valor de marca: es específico del tamaño, y va en
 * direcciones OPUESTAS según cuánto mide el texto.
 *
 *  - Texto grande: las letras se leen demasiado separadas a medida que crecen,
 *    así que hay que apretarlas. Negativo, en torno a -0.02em.
 *  - Texto de cuerpo: cero. Cualquier ajuste aquí perjudica la lectura.
 *  - Texto diminuto: ligeramente positivo, porque a 10-12px las letras se
 *    empastan entre sí.
 *
 * Un único `letterSpacing` para toda la app está mal en algún sitio por
 * definición. Estos valores salen de aplicar ~-0.022em al texto grande.
 */
export const TRACKING = {
  xs:  0.5,
  sm:  0.3,
  md:  0.1,
  base: 0,
  lg:  0,
  xl:  -0.2,
  '2xl': -0.45,
  '3xl': -0.55,
  '4xl': -0.7,
} as const;

/**
 * Leading (line-height) como multiplicador del tamaño.
 *
 * Va al revés que el tamaño: apretado en titulares grandes, holgado en cuerpo.
 * Un titular de 32px con el interlineado por defecto de la fuente —calibrado
 * para párrafos— se abre demasiado y deja de leerse como un bloque.
 */
export const LEADING = {
  xs:  1.4,
  sm:  1.4,
  md:  1.5,
  base: 1.55,
  lg:  1.5,
  xl:  1.35,
  '2xl': 1.25,
  '3xl': 1.2,
  '4xl': 1.12,
} as const;

/**
 * Los tres valores de un tamaño, ya coordinados.
 *
 *   <Text style={[styles.title, type('3xl')]}>
 *
 * `lineHeight` se omite a propósito en texto de una sola línea que vive dentro
 * de un contenedor de altura fija (una palabra de RSVP, un dígito, un emoji):
 * ahí no aporta nada y puede descolocar el centrado vertical. Para eso está
 * `typeInline`.
 */
export function type(size: FontSizeKey) {
  const fontSize = FONT_SIZE[size];
  return {
    fontSize,
    letterSpacing: TRACKING[size],
    lineHeight: Math.round(fontSize * LEADING[size]),
  };
}

/** Como `type`, pero sin `lineHeight`: para texto de una línea centrado a mano. */
export function typeInline(size: FontSizeKey) {
  return {
    fontSize: FONT_SIZE[size],
    letterSpacing: TRACKING[size],
  };
}

/**
 * Tracking para un tamaño arbitrario en px, para los muchos sitios que declaran
 * `fontSize` a pelo en vez de usar la escala. Misma curva que `TRACKING`.
 */
export function trackingFor(fontSize: number): number {
  if (fontSize >= 20) return Math.round(fontSize * -0.022 * 20) / 20;
  if (fontSize >= 17) return -0.2;
  if (fontSize >= 14) return 0;
  if (fontSize >= 12) return 0.3;
  return 0.5;
}
