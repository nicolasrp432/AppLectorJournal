// Content catalog — passages for reading/comprehension, word banks for wordspan/loci

const PASSAGES = [
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
];

const WORD_BANK_BASIC = ['luz', 'río', 'viento', 'hoja', 'sol', 'nube', 'piedra', 'mar', 'fuego', 'bosque', 'árbol', 'lluvia', 'cielo', 'flor', 'montaña', 'agua', 'tierra', 'estrella', 'luna', 'pájaro'];
const WORD_BANK_MEDIUM = ['biblioteca', 'memoria', 'concepto', 'ventana', 'sendero', 'tormenta', 'cristal', 'silencio', 'horizonte', 'mariposa', 'quietud', 'reflejo', 'instante', 'mecánica', 'umbral'];

const LOCI_OBJECTS = ['llave', 'manzana', 'libro', 'reloj', 'guitarra', 'sombrero', 'paraguas', 'vela', 'mapa', 'taza'];

function pickPassage(level = 'medium') {
  const candidates = PASSAGES.filter(p => p.length === level);
  const pool = candidates.length ? candidates : PASSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickWords(count, advanced = false) {
  const bank = advanced ? [...WORD_BANK_BASIC, ...WORD_BANK_MEDIUM] : WORD_BANK_BASIC;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

Object.assign(window, { PASSAGES, WORD_BANK_BASIC, WORD_BANK_MEDIUM, LOCI_OBJECTS, pickPassage, pickWords });
