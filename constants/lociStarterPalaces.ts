import type { UserMemoryPalace } from '../store/useLociStore';

/**
 * Palacios de memoria PRE-CONSTRUIDOS, listos para practicar sin tener que
 * crear uno primero (ver `docs/PLAN_MEJORAS_Y_EJERCICIOS.md`, B2).
 *
 * Las etiquetas de `room` coinciden exactamente con las de `ROOM_THEMES.casa`
 * en `components/exercises/LociExercise.tsx`, de modo que el mapa de la casa
 * ubica cada locus correctamente. Las historias son vívidas y absurdas a
 * propósito: así es como funciona el método (imágenes exageradas y memorables).
 *
 * Son de solo lectura: no se borran ni se sincronizan con Supabase.
 */

export const STARTER_PALACE_IDS = {
  solar: 'starter_solar',
  compra: 'starter_compra',
  arcoiris: 'starter_arcoiris',
} as const;

function mem(palaceId: string, idx: number, room: string, item: string, story: string) {
  return { id: `${palaceId}_m${idx}`, palace_id: palaceId, room, item, story, image_url: undefined };
}

export const STARTER_PALACES: UserMemoryPalace[] = [
  {
    id: STARTER_PALACE_IDS.solar,
    topic: 'El Sistema Solar (8 planetas)',
    theme: 'casa',
    created_at: '2020-01-01T00:00:00.000Z',
    memories: [
      mem(STARTER_PALACE_IDS.solar, 0, 'Entrada', 'Mercurio', 'En la ENTRADA, un termómetro gigante con patas (Mercurio) corre a toda velocidad chamuscando el felpudo: es el más rápido y el más cercano al Sol.'),
      mem(STARTER_PALACE_IDS.solar, 1, 'Cocina', 'Venus', 'En la COCINA, una diosa de mármol (Venus) se da un baño de vapor ardiente entre ollas: Venus es abrasador y está envuelto en nubes.'),
      mem(STARTER_PALACE_IDS.solar, 2, 'Sala', 'Tierra', 'En la SALA, una pelota azul y verde (la Tierra) rebota en el sofá mientras una hormiguita-humano la saluda: nuestro hogar.'),
      mem(STARTER_PALACE_IDS.solar, 3, 'Dormitorio', 'Marte', 'En el DORMITORIO, un robot oxidado y rojo (Marte) duerme con polvo marciano por todas las sábanas: el planeta rojo.'),
      mem(STARTER_PALACE_IDS.solar, 4, 'Oficina', 'Júpiter', 'En la OFICINA, un jefe gigantesco con una tormenta-ojo en la camisa (Júpiter) grita: es el planeta más grande, con su Gran Mancha Roja.'),
      mem(STARTER_PALACE_IDS.solar, 5, 'Baño', 'Saturno', 'En el BAÑO, un salvavidas con anillos de hula-hoop (Saturno) flota en la tina: famoso por sus anillos.'),
      mem(STARTER_PALACE_IDS.solar, 6, 'Jardín', 'Urano', 'En el JARDÍN, una bola de hielo turquesa rueda de lado (Urano) congelando las plantas: gira tumbado.'),
      mem(STARTER_PALACE_IDS.solar, 7, 'Ático', 'Neptuno', 'En el ÁTICO, un tridente azul tormenta (Neptuno) provoca vientos huracanados entre las cajas: el más lejano y ventoso.'),
    ],
  },
  {
    id: STARTER_PALACE_IDS.compra,
    topic: 'Lista de la compra',
    theme: 'casa',
    created_at: '2020-01-01T00:00:00.000Z',
    memories: [
      mem(STARTER_PALACE_IDS.compra, 0, 'Entrada', 'Leche', 'En la ENTRADA, una cascada de LECHE blanca sale del buzón e inunda el felpudo de espuma.'),
      mem(STARTER_PALACE_IDS.compra, 1, 'Cocina', 'Huevos', 'En la COCINA, una docena de HUEVOS con gafas de sol bailan claqué sobre la encimera.'),
      mem(STARTER_PALACE_IDS.compra, 2, 'Sala', 'Pan', 'En la SALA, una barra de PAN gigante hace de sofá y cruje cada vez que alguien se sienta.'),
      mem(STARTER_PALACE_IDS.compra, 3, 'Dormitorio', 'Manzanas', 'En el DORMITORIO, MANZANAS rojas rebotan en la cama como si fuera una cama elástica.'),
      mem(STARTER_PALACE_IDS.compra, 4, 'Oficina', 'Café', 'En la OFICINA, una taza de CAFÉ humeante teclea sola en el ordenador a toda prisa.'),
    ],
  },
  {
    id: STARTER_PALACE_IDS.arcoiris,
    topic: 'Colores del arcoíris',
    theme: 'casa',
    created_at: '2020-01-01T00:00:00.000Z',
    memories: [
      mem(STARTER_PALACE_IDS.arcoiris, 0, 'Entrada', 'Rojo', 'En la ENTRADA, un extintor ROJO escupe pintura por todas partes.'),
      mem(STARTER_PALACE_IDS.arcoiris, 1, 'Cocina', 'Naranja', 'En la COCINA, una NARANJA gigante rueda y aplasta las sillas.'),
      mem(STARTER_PALACE_IDS.arcoiris, 2, 'Sala', 'Amarillo', 'En la SALA, un sol AMARILLO sonriente se columpia de la lámpara.'),
      mem(STARTER_PALACE_IDS.arcoiris, 3, 'Dormitorio', 'Verde', 'En el DORMITORIO, una rana VERDE enorme usa la almohada como trampolín.'),
      mem(STARTER_PALACE_IDS.arcoiris, 4, 'Oficina', 'Azul', 'En la OFICINA, una ola AZUL irrumpe y los papeles surfean.'),
      mem(STARTER_PALACE_IDS.arcoiris, 5, 'Baño', 'Índigo', 'En el BAÑO, tinta ÍNDIGO oscura llena la bañera de tinta de calamar.'),
      mem(STARTER_PALACE_IDS.arcoiris, 6, 'Jardín', 'Violeta', 'En el JARDÍN, flores VIOLETA gigantes cantan ópera al viento.'),
    ],
  },
];

export function getStarterPalace(id: string): UserMemoryPalace | undefined {
  return STARTER_PALACES.find((p) => p.id === id);
}

export function isStarterPalaceId(id: string): boolean {
  return STARTER_PALACES.some((p) => p.id === id);
}
