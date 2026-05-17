export interface Passage {
  id: string;
  title: string;
  length: 'short' | 'medium' | 'long';
  text: string;
  questions: PassageQuestion[];
}

export interface PassageQuestion {
  q: string;
  opts: string[];
  correct: number;
}

export const PASSAGES: Passage[] = [
  {
    id: 'p_brain',
    title: 'El cerebro que lee',
    length: 'medium',
    text: 'Leer no es una habilidad natural del cerebro humano. A diferencia del habla, que emerge espontáneamente en los niños, la lectura requiere reconvertir áreas cerebrales originalmente destinadas al reconocimiento facial y de objetos. Este proceso, llamado reciclaje neuronal, explica por qué aprender a leer toma años. Los lectores experimentados procesan palabras completas como unidades visuales, no letra por letra. Esta habilidad es la que permite leer rápido sin perder comprensión.',
    questions: [
      { q: '¿Qué significa "reciclaje neuronal"?', opts: ['Crear nuevas neuronas', 'Reutilizar áreas cerebrales para una nueva función', 'Reemplazar células dañadas', 'Dormir para consolidar'], correct: 1 },
      { q: '¿En qué se diferencia leer de hablar?', opts: ['Leer requiere más tiempo', 'Hablar requiere más esfuerzo', 'Hablar emerge solo; leer requiere aprendizaje', 'Leer es más antiguo'], correct: 2 },
      { q: '¿Cómo procesan las palabras los expertos?', opts: ['Letra por letra', 'Como unidades visuales completas', 'Traduciendo a sonidos', 'Solo hemisferio derecho'], correct: 1 },
    ],
  },
  {
    id: 'p_habits',
    title: 'La fuerza de los hábitos pequeños',
    length: 'short',
    text: 'Un cambio del 1% al día no parece mucho, pero acumulado durante un año equivale a ser casi 38 veces mejor. Los hábitos son el interés compuesto de la mejora personal. La clave no está en metas grandes, sino en sistemas pequeños y repetibles. Tu identidad emerge de lo que haces cada día, no de lo que dices que harás.',
    questions: [
      { q: '¿Qué representa un cambio del 1% al día durante un año?', opts: ['Ser 1% mejor', 'Ser 38 veces mejor', 'Ser 365% mejor', 'Sin efecto medible'], correct: 1 },
      { q: 'Según el texto, ¿de qué emerge tu identidad?', opts: ['De tus metas', 'De lo que dices', 'De lo que haces cada día', 'De tu pasado'], correct: 2 },
      { q: '¿En qué insiste el texto como clave del cambio?', opts: ['Metas grandes', 'Sistemas pequeños y repetibles', 'Motivación constante', 'Cambios drásticos'], correct: 1 },
    ],
  },
  {
    id: 'p_attention',
    title: 'Atención dividida',
    length: 'long',
    text: 'La atención humana es un recurso limitado, no infinito. Cuando intentamos hacer múltiples tareas a la vez, lo que realmente ocurre es un cambio rápido entre ellas, no un procesamiento simultáneo. Cada cambio cuesta energía mental y deja un residuo que reduce el rendimiento en la siguiente tarea. Los estudios muestran que la multitarea puede reducir la productividad hasta en un 40 por ciento. La concentración profunda, en cambio, permite que el cerebro entre en estados de flujo donde el aprendizaje y la creatividad florecen. Para entrenar este músculo cognitivo se requieren bloques de tiempo sin interrupciones, donde la mente pueda sostener la atención en un solo objeto durante períodos prolongados.',
    questions: [
      { q: '¿Qué ocurre cuando hacemos varias tareas a la vez?', opts: ['Procesamos en paralelo', 'Cambiamos rápido entre ellas', 'Activamos más neuronas', 'Aumentamos memoria'], correct: 1 },
      { q: '¿Cuánto puede reducir la multitarea la productividad?', opts: ['10%', '20%', 'Hasta 40%', '60%'], correct: 2 },
      { q: '¿Qué se necesita para entrenar la concentración profunda?', opts: ['Más estímulos', 'Bloques sin interrupciones', 'Música constante', 'Tareas variadas'], correct: 1 },
      { q: '¿Qué permite la concentración profunda?', opts: ['Multitarea efectiva', 'Estados de flujo', 'Memorizar más', 'Dormir mejor'], correct: 1 },
    ],
  },
  {
    id: 'p_sleep',
    title: 'Dormir para aprender',
    length: 'short',
    text: 'Durante el sueño profundo, el cerebro consolida lo aprendido durante el día. Las conexiones neuronales débiles se podan y las relevantes se fortalecen. Sin sueño suficiente, la memoria a largo plazo no se forma adecuadamente. Estudiar toda la noche es contraproducente: pierdes la fase en que el conocimiento se cristaliza.',
    questions: [
      { q: '¿Qué hace el cerebro durante el sueño profundo?', opts: ['Descansa pasivamente', 'Consolida lo aprendido', 'Olvida información', 'Repite tareas'], correct: 1 },
      { q: '¿Qué pasa con conexiones neuronales relevantes?', opts: ['Se borran', 'Se podan', 'Se fortalecen', 'Se duplican'], correct: 2 },
      { q: '¿Por qué estudiar toda la noche es contraproducente?', opts: ['Cansa los ojos', 'Pierdes la fase de cristalización', 'Aburre', 'No hay luz'], correct: 1 },
    ],
  },
  {
    id: 'p_flow',
    title: 'El estado de flujo',
    length: 'medium',
    text: 'Mihaly Csikszentmihalyi describió el flujo como un estado de concentración absoluta en el que el tiempo parece detenerse y el esfuerzo se vuelve invisible. Para alcanzarlo necesitas un desafío que supere apenas tu nivel actual: demasiado fácil y te aburres, demasiado difícil y te bloqueas. Los músicos, los atletas y los programadores lo conocen bien. La lectura profunda activa el mismo circuito: cuando el texto desafía exactamente al cerebro, las páginas se leen solas.',
    questions: [
      { q: '¿Quién describió el concepto de flujo?', opts: ['Daniel Kahneman', 'Mihaly Csikszentmihalyi', 'B.F. Skinner', 'William James'], correct: 1 },
      { q: '¿Qué ocurre si el desafío es demasiado fácil?', opts: ['Entras en flujo', 'Te bloqueas', 'Te aburres', 'Lees más rápido'], correct: 2 },
      { q: '¿Qué activa la lectura profunda según el texto?', opts: ['El sistema motor', 'El mismo circuito que el flujo', 'Solo la memoria', 'La visión periférica'], correct: 1 },
    ],
  },
  {
    id: 'p_memory_palace',
    title: 'El palacio de la memoria',
    length: 'long',
    text: 'Los oradores de la antigua Grecia necesitaban memorizar discursos de horas sin notas. Su solución fue el método de los loci: imaginar un recorrido por un lugar conocido —la propia casa, un templo— y depositar mentalmente cada idea en un objeto o rincón del camino. Al recitar, "caminaban" por ese espacio y recogían las ideas en orden. El cerebro está diseñado para recordar lugares y trayectorias, herencia de cientos de miles de años navegando el terreno físico. Al usar el hipocampo —responsable de la memoria espacial— para almacenar información abstracta, transformamos datos fríos en recuerdos vividos. Los estudios modernos confirman que practicar el método de loci puede triplicar la capacidad de memoria a largo plazo en pocas semanas.',
    questions: [
      { q: '¿Para qué usaban los oradores griegos el método de loci?', opts: ['Para leer más rápido', 'Para memorizar discursos sin notas', 'Para aprender idiomas', 'Para mejorar el sueño'], correct: 1 },
      { q: '¿Qué estructura cerebral es clave en este método?', opts: ['La amígdala', 'El cerebelo', 'El hipocampo', 'El lóbulo frontal'], correct: 2 },
      { q: '¿Cuánto puede mejorar la memoria a largo plazo con este método?', opts: ['Duplicarse', 'Triplicarse', 'Mantenerse igual', 'Reducirse'], correct: 1 },
      { q: '¿Qué convierte el método de loci a los datos abstractos?', opts: ['En imágenes planas', 'En recuerdos vividos', 'En números', 'En sonidos'], correct: 1 },
    ],
  },
  {
    id: 'p_speed_reading',
    title: 'Mitos de la lectura rápida',
    length: 'short',
    text: 'La lectura fotográfica y los métodos que prometen 10.000 palabras por minuto son en su mayoría mitos. La ciencia muestra que la comprensión cae drásticamente por encima de 500-600 WPM. Lo que sí funciona es reducir la subvocalización —la voz interior que lee cada palabra— y ampliar el tramo de fijación ocular para capturar más palabras por golpe de vista. Con práctica constante, 400-500 WPM con alta comprensión es alcanzable para cualquier persona.',
    questions: [
      { q: '¿A partir de cuántos WPM cae la comprensión significativamente?', opts: ['200 WPM', '350 WPM', '500-600 WPM', '1000 WPM'], correct: 2 },
      { q: '¿Qué es la subvocalización?', opts: ['Leer en voz alta', 'La voz interior que lee cada palabra', 'Un déficit visual', 'Una técnica avanzada'], correct: 1 },
      { q: '¿Qué velocidad es alcanzable con práctica constante?', opts: ['100 WPM', '250 WPM', '400-500 WPM', '2000 WPM'], correct: 2 },
    ],
  },
  {
    id: 'p_neuroplasticity',
    title: 'Neuroplasticidad y aprendizaje',
    length: 'medium',
    text: 'Durante décadas se creyó que el cerebro adulto era rígido e inmutable. Hoy sabemos que la neuroplasticidad —la capacidad del cerebro de reorganizarse y crear nuevas conexiones— persiste toda la vida. Cada vez que aprendes algo nuevo, las sinapsis entre neuronas se fortalecen a través de un proceso llamado potenciación a largo plazo. El entrenamiento repetido consolida esas rutas hasta que la habilidad se vuelve automática. Los músicos profesionales muestran regiones motoras y auditivas notablemente más grandes que el promedio. Los lectores expertos, análogamente, tienen redes visuales y lingüísticas más densamente conectadas.',
    questions: [
      { q: '¿Qué creencia antigua sobre el cerebro adulto resultó incorrecta?', opts: ['Que podía aprender idiomas', 'Que era rígido e inmutable', 'Que usaba más energía', 'Que tenía emociones'], correct: 1 },
      { q: '¿Qué proceso fortalece las sinapsis al aprender?', opts: ['Depresión sináptica', 'Inhibición lateral', 'Potenciación a largo plazo', 'Poda neuronal'], correct: 2 },
      { q: '¿Qué característica muestran los músicos profesionales?', opts: ['Mayor cerebelo', 'Regiones motoras y auditivas más grandes', 'Menos neuronas', 'Mayor amígdala'], correct: 1 },
    ],
  },
];

export const WORD_BANK_BASIC = ['luz','río','viento','hoja','sol','nube','piedra','mar','fuego','bosque','árbol','lluvia','cielo','flor','montaña','agua','tierra','estrella','luna','pájaro'];
export const WORD_BANK_MEDIUM = ['biblioteca','memoria','concepto','ventana','sendero','tormenta','cristal','silencio','horizonte','mariposa','quietud','reflejo','instante','mecánica','umbral'];
export const LOCI_OBJECTS = ['llave','manzana','libro','reloj','guitarra','sombrero','paraguas','vela','mapa','taza'];

export function pickPassage(length: 'short' | 'medium' | 'long' = 'medium'): Passage {
  const candidates = PASSAGES.filter(p => p.length === length);
  const pool = candidates.length ? candidates : PASSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickWords(count: number, advanced = false): string[] {
  const bank = advanced ? [...WORD_BANK_BASIC, ...WORD_BANK_MEDIUM] : WORD_BANK_BASIC;
  return [...bank].sort(() => Math.random() - 0.5).slice(0, count);
}
