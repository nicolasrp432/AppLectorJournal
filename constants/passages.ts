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
  {
    id: 'p_ai',
    title: 'El despertar de la IA',
    length: 'short',
    text: 'La inteligencia artificial generativa representa un punto de inflexión. No solo ejecuta algoritmos, sino que simula creatividad y razonamiento lógico. Este avance obliga a redefinir el trabajo humano, priorizando el pensamiento crítico, la empatía y la capacidad de orquestar herramientas inteligentes. La IA no sustituye al pensador; potencia su alcance exponencialmente.',
    questions: [
      { q: '¿Qué simula la IA generativa además de ejecutar algoritmos?', opts: ['Solo operaciones matemáticas', 'Creatividad y razonamiento lógico', 'Sentimientos biológicos', 'El sentido del tacto'], correct: 1 },
      { q: '¿Qué habilidades humanas se vuelven prioritarias con la IA?', opts: ['Trabajos mecánicos y cálculo', 'Pensamiento crítico y empatía', 'Solo la memoria a corto plazo', 'Habilidades físicas puras'], correct: 1 },
      { q: '¿Qué hace la IA respecto al pensador?', opts: ['Lo sustituye por completo', 'Potencia su alcance exponencialmente', 'Lo hace obsoleto', 'Reduce su velocidad mental'], correct: 1 },
    ],
  },
  {
    id: 'p_meditation',
    title: 'El arte de respirar',
    length: 'short',
    text: 'El mindfulness o atención plena reduce la hormona del estrés, el cortisol, y ensancha la corteza prefrontal del cerebro. Al centrarnos en la respiración por solo diez minutos diarios, enseñamos a la amígdala a reaccionar menos ante las amenazas cotidianas. No es poner la mente en blanco, es entrenar la presencia.',
    questions: [
      { q: '¿Qué hormona reduce la atención plena?', opts: ['La dopamina', 'El cortisol', 'La adrenalina', 'La melatonina'], correct: 1 },
      { q: '¿Qué estructura cerebral entrena para reaccionar menos a amenazas?', opts: ['El cerebelo', 'La amígdala', 'El lóbulo occipital', 'El hipocampo'], correct: 1 },
      { q: '¿Qué es realmente el mindfulness según el texto?', opts: ['Poner la mente en blanco', 'Entrenar la presencia', 'Hacer ejercicio físico', 'Dormir profundamente'], correct: 1 },
    ],
  },
  {
    id: 'p_stoicism',
    title: 'La dicotomía del control',
    length: 'short',
    text: 'El estoicismo enseña que el sufrimiento nace al intentar controlar lo externo. La clave está en dividir el mundo entre lo que depende de nosotros —pensamientos, intenciones, respuestas— y lo que no. Al enfocar la energía en lo interno, logramos una serenidad inquebrantable o ataraxia ante cualquier circunstancia.',
    questions: [
      { q: '¿De dónde nace el sufrimiento según los estoicos?', opts: ['De la falta de dinero', 'De intentar controlar lo externo', 'De la falta de amigos', 'Del cansancio físico'], correct: 1 },
      { q: '¿Qué elementos sí dependen de nosotros?', opts: ['La opinión de los demás y el clima', 'Pensamientos, intenciones y respuestas', 'La suerte y el éxito laboral', 'La salud de otros'], correct: 1 },
      { q: '¿Qué nombre recibe la serenidad inquebrantable?', opts: ['Ataraxia', 'Eutanasia', 'Apatía', 'Felicidad'], correct: 0 },
    ],
  },
  {
    id: 'p_guts',
    title: 'El segundo cerebro',
    length: 'short',
    text: 'El sistema digestivo aloja millones de neuronas que forman el sistema nervioso entérico. Además, produce más del 90% de la serotonina del cuerpo, la hormona que regula el estado de ánimo. La comunicación bidireccional entre el intestino y el cerebro influye directamente en nuestras decisiones, emociones y niveles de ansiedad.',
    questions: [
      { q: '¿Qué porcentaje de serotonina se produce en el sistema digestivo?', opts: ['Menos del 10%', 'Aproximadamente 50%', 'Más del 90%', 'No produce serotonina'], correct: 2 },
      { q: '¿Qué sistema nervioso se describe en el intestino?', opts: ['Sistema nervioso central', 'Sistema nervioso entérico', 'Sistema nervioso motor', 'Sistema autónomo cardíaco'], correct: 1 },
      { q: '¿En qué influye la comunicación bidireccional del intestino-cerebro?', opts: ['Solo en la digestión', 'En nuestras decisiones, emociones y ansiedad', 'Únicamente en el sueño', 'No influye en nada'], correct: 1 },
    ],
  },
  {
    id: 'p_multilingual',
    title: 'Cerebros bilingües',
    length: 'short',
    text: 'Aprender un segundo idioma crea una reserva cognitiva que retrasa la aparición de síntomas de demencia y Alzheimer por hasta cinco años. El cerebro bilingüe ejercita constantemente el control ejecutivo, mejorando la habilidad de filtrar distracciones y cambiar de tarea eficientemente sin agotar sus recursos.',
    questions: [
      { q: '¿Cuánto puede retrasar los síntomas de demencia hablar dos idiomas?', opts: ['Un año', 'Hasta cinco años', 'Diez años', 'No influye en el retraso'], correct: 1 },
      { q: '¿Qué área de control ejercita constantemente el cerebro bilingüe?', opts: ['El control motor', 'El control ejecutivo', 'El control auditivo', 'La visión periférica'], correct: 1 },
      { q: '¿Qué habilidad mejora el bilingüismo en la vida cotidiana?', opts: ['Filtrar distracciones y cambiar de tarea', 'Hacer sumas complejas', 'La velocidad de carrera', 'La audición lejana'], correct: 0 },
    ],
  },
  {
    id: 'p_astronomy',
    title: 'El eco del Big Bang',
    length: 'medium',
    text: 'El universo no está en silencio. Los astrónomos captan un zumbido constante conocido como el Fondo Cósmico de Microondas. Esta radiación, detectada por primera vez en 1964, es el calor residual que quedó del nacimiento del universo hace 13.800 millones de años. Al observar esta luz antigua, los telescopios actúan como verdaderas máquinas del tiempo, mostrándonos el universo cuando tenía apenas 380.000 años de edad. Es una reliquia fósil que valida indiscutiblemente la teoría de la expansión cósmica y nos ayuda a medir con precisión el peso de la materia oscura.',
    questions: [
      { q: '¿Qué es el Fondo Cósmico de Microondas?', opts: ['Una señal de radio alienígena', 'El calor residual del origen del universo', 'El zumbido de las estrellas jóvenes', 'Un ruido artificial'], correct: 1 },
      { q: '¿Cómo actúan los telescopios al capturar esta luz antigua?', opts: ['Como amplificadores de sonido', 'Como verdaderas máquinas del tiempo', 'Como satélites de GPS', 'Como filtros solares'], correct: 1 },
      { q: '¿Qué valida indiscutiblemente este fósil cósmico?', opts: ['La existencia de vida alienígena', 'La teoría de la expansión cósmica', 'La inmovilidad galáctica', 'Que el sol es el centro cósmico'], correct: 1 },
    ],
  },
  {
    id: 'p_dopamine',
    title: 'El mito de la dopamina',
    length: 'medium',
    text: 'Mucha gente cree que la dopamina es la hormona del placer absoluto, pero en realidad es el neurotransmisor de la anticipación y la búsqueda de recompensa. El cerebro libera dopamina no cuando logramos algo, sino cuando prevemos que lo lograremos. Este mecanismo evolutivo nos mantiene explorando y buscando comida. Hoy en día, los feeds de redes sociales y los videojuegos explotan este circuito liberando dopamina intermitente de forma artificial, atrapando nuestra atención en bucles de navegación infinita que rara vez conducen a una satisfacción duradera.',
    questions: [
      { q: '¿Cuál es la verdadera función de la dopamina según el texto?', opts: ['Producir placer inmediato', 'Anticipar y buscar recompensas', 'Reducir el sueño profundo', 'Controlar los latidos del corazón'], correct: 1 },
      { q: '¿Cuándo libera el cerebro más dopamina?', opts: ['Al completar una meta larga', 'Cuando prevemos que lograremos algo', 'Al ir a dormir', 'Al sentir dolor físico'], correct: 1 },
      { q: '¿Cómo explotan las redes sociales este circuito de dopamina?', opts: ['Brindando paz mental', 'Liberando dopamina intermitente de forma artificial', 'Enseñando idiomas', 'Ayudando a socializar en persona'], correct: 1 },
    ],
  },
  {
    id: 'p_forest_bath',
    title: 'Baños de bosque o Shinrin-yoku',
    length: 'medium',
    text: 'En Japón, los médicos recetan "Shinrin-yoku" o baños de bosque como terapia para el estrés. Los árboles liberan unos compuestos orgánicos llamados fitoncidas para protegerse de los microbios. Al caminar entre árboles e inhalar estos compuestos de forma consciente, el cuerpo responde elevando el recuento de células asesinas naturales, un tipo de glóbulo blanco que destruye virus y células tumorales. Al mismo tiempo, se reducen la presión arterial y el ritmo cardíaco en solo veinte minutos de inmersión en la naturaleza.',
    questions: [
      { q: '¿Qué son las fitoncidas según el texto?', opts: ['Nutrientes del suelo de los bosques', 'Compuestos orgánicos liberados por árboles', 'Medicamentos sintéticos japoneses', 'Glóbulos blancos humanos'], correct: 1 },
      { q: '¿Cómo responde el cuerpo humano al inhalar fitoncidas?', opts: ['Elevando las células asesinas naturales', 'Reduciendo la capacidad pulmonar', 'Durmiendo de inmediato', 'Perdiendo calor corporal'], correct: 0 },
      { q: '¿Qué beneficio se observa en solo veinte minutos de inmersión natural?', opts: ['Pérdida de memoria', 'Aumento de masa muscular', 'Reducción de presión arterial y ritmo cardíaco', 'Mejora de la visión lejana'], correct: 2 },
    ],
  },
  {
    id: 'p_deepwork',
    title: 'El valor del trabajo profundo',
    length: 'medium',
    text: 'Cal Newport acuñó el término "trabajo profundo" para definir la capacidad de concentrarse sin distracciones en una tarea cognitivamente exigente. En la economía moderna, esta habilidad se está volviendo cada vez más rara y, al mismo tiempo, más valiosa. El profesional promedio pasa el 60% de su jornada laboral en tareas superficiales como responder correos y mensajes instantáneos. Aquellos que logran blindar su tiempo para el trabajo profundo crean un valor único que la inteligencia artificial no puede replicar fácilmente, convirtiéndose en profesionales altamente codiciados.',
    questions: [
      { q: '¿Qué es el "trabajo profundo" según Cal Newport?', opts: ['Trabajar más horas al día', 'Concentrarse sin distracciones en tareas exigentes', 'Hacer varias tareas administrativas', 'Trabajar en minas de carbón'], correct: 1 },
      { q: '¿En qué gasta el profesional promedio el 60% de su día?', opts: ['En el trabajo profundo', 'En tareas superficiales como correos y chats', 'En dormir y descansar', 'En programar y diseñar'], correct: 1 },
      { q: '¿Por qué el trabajo profundo se considera extremadamente valioso hoy?', opts: ['Porque es fácil de delegar', 'Porque crea valor que la IA no replica fácilmente', 'Porque fatiga menos al empleado', 'Porque elimina la necesidad de estudiar'], correct: 1 },
    ],
  },
  {
    id: 'p_focus',
    title: 'La paradoja de la creatividad',
    length: 'medium',
    text: 'Tradicionalmente se piensa que las ideas creativas nacen de momentos de inspiración mística, pero las neurociencias muestran un patrón diferente. La verdadera creatividad requiere la colaboración estrecha de dos redes cerebrales: la Red Neuronal por Defecto, encargada de la fantasía y el pensamiento errante, y la Red de Control Ejecutivo, encargada de la evaluación lógica y la edición. El proceso creativo real implica una oscilación rápida entre la ideación salvaje sin filtros y el pulido riguroso y analítico. La creatividad no es caos; es un vaivén estructurado.',
    questions: [
      { q: '¿Cuáles son las dos redes cerebrales clave en la creatividad?', opts: ['Red Motora and Red Auditiva', 'Red Neuronal por Defecto y Red de Control Ejecutivo', 'Red Límbica y Red Occipital', 'Red de Atención y Red Sensorial'], correct: 1 },
      { q: '¿Cuál es el papel de la Red Neuronal por Defecto?', opts: ['La evaluación lógica y rigurosa', 'La fantasía y el pensamiento errante', 'El movimiento muscular preciso', 'La decodificación de las palabras'], correct: 1 },
      { q: '¿Cómo define el autor el proceso creativo real?', opts: ['Como caos y anarquía absolutos', 'Como una oscilación estructurada de ideación y pulido', 'Como un momento mágico pasivo', 'Como un ejercicio meramente matemático'], correct: 1 },
    ],
  },
  {
    id: 'p_evolutionary_mismatch',
    title: 'El desajuste evolutivo',
    length: 'long',
    text: 'Nuestra biología evolucionó para adaptarse al estilo de vida del Pleistoceno, donde las calorías eran escasas y el esfuerzo físico era obligatorio para sobrevivir. El cerebro humano desarrolló circuitos de recompensa ultrapoderosos diseñados para hacernos consumir azúcar, sal y grasa siempre que los encontráramos, y para ahorrar energía minimizando el movimiento innecesario. En el entorno sedentario e hiperabundante del siglo veintiuno, esta programación ancestral resulta letal. La facilidad de obtener comida ultraprocesada barata y la comodidad tecnológica que elimina el esfuerzo diario chocan de frente con nuestro diseño genético. El resultado es una epidemia global de obesidad, diabetes tipo dos y problemas de salud mental. Entender que tu cerebro te está incitando a consumir y descansar por puro instinto de supervivencia paleolítico es el primer paso para hackear tus hábitos modernos y tomar decisiones verdaderamente conscientes en tu día a día.',
    questions: [
      { q: '¿Para qué entorno evolucionó originalmente nuestra biología?', opts: ['El siglo XXI tecnológico', 'El entorno Pleistoceno de escasez y esfuerzo obligatorio', 'Ciudades de abundancia agrícola', 'Un entorno acuático y cálido'], correct: 1 },
      { q: '¿Por qué el cerebro desarrolló circuitos de recompensa ultra-potentes para el azúcar y grasa?', opts: ['Porque eran abundantes y peligrosos', 'Para asegurar la supervivencia cuando las calorías escaseaban', 'Porque ayudan a la lectura periférica', 'Por casualidad genética sin utilidad'], correct: 1 },
      { q: '¿Qué epidemias globales se mencionan debido al desajuste evolutivo?', opts: ['Obesidad, diabetes tipo dos y problemas de salud mental', 'Peste, cólera y gripe aviar', 'Falta de concentración e insomnio', 'Caries y pérdida auditiva'], correct: 0 },
      { q: '¿Cuál es el primer paso para hackear nuestros hábitos modernos según el texto?', opts: ['Comprar comida cara', 'Entender que el cerebro incita a consumir por instinto ancestral', 'Hacer dietas extremas', 'Desactivar todas las pantallas del hogar'], correct: 1 },
    ],
  },
  {
    id: 'p_plasticity_mindset',
    title: 'Mentalidad de crecimiento',
    length: 'long',
    text: 'Carol Dweck descubrió que las personas se dividen en dos categorías según su visión de la inteligencia: mentalidad fija y mentalidad de crecimiento. Los de mentalidad fija creen que nacemos con un coeficiente inalterable, lo que los lleva a evitar desafíos por miedo a fracasar y revelar que no son tan inteligentes. Los de mentalidad de crecimiento, en cambio, entienden que el cerebro es como un músculo que responde al esfuerzo físico y mental creando nuevas conexiones. Para ellos, el error no es una condena de inutilidad, sino información valiosa para seguir aprendiendo. Esta diferencia moldea radicalmente la resiliencia personal y el éxito a largo plazo. Las investigaciones con resonancia magnética funcional demuestran que los cerebros de quienes poseen mentalidad de crecimiento muestran una activación significativamente mayor en el córtex cingulado anterior al cometer errores, lo que significa que procesan de manera activa el fallo y ajustan su estrategia de inmediato en lugar de desconectarse o culpar a factores externos.',
    questions: [
      { q: '¿Cuál es la creencia clave de las personas con mentalidad fija?', opts: ['Que la inteligencia se desarrolla', 'Que nacemos con una inteligencia rígida e inalterable', 'Que el éxito depende de la suerte', 'Que los errores son lecciones'], correct: 1 },
      { q: '¿Cómo ven el error los individuos con mentalidad de crecimiento?', opts: ['Como una condena de inutilidad', 'Como información valiosa para seguir aprendiendo', 'Como una vergüenza pública', 'Como algo que se debe ocultar'], correct: 1 },
      { q: '¿Qué revela la resonancia magnética sobre quienes tienen mentalidad de crecimiento ante un error?', opts: ['Que su cerebro se apaga por vergüenza', 'Que muestran mayor activación en el córtex cingulado anterior para aprender', 'Que sufren daños neuronales permanentes', 'Que no muestran ninguna reacción biológica'], correct: 1 },
      { q: '¿Quién es la investigadora que descubrió estas mentalidades?', opts: ['Carol Dweck', 'Marie Curie', 'Barbara Oakley', 'Elizabeth Loftus'], correct: 0 },
    ],
  },
  {
    id: 'p_gut_brain_axis',
    title: 'El eje intestino-cerebro',
    length: 'long',
    text: 'Durante siglos, la medicina estudió los órganos de forma aislada, asumiendo que el cerebro dictaba órdenes unidireccionales a todo el cuerpo. Sin embargo, el descubrimiento del eje intestino-cerebro ha revolucionado la neurociencia contemporánea. Hoy sabemos que existe una autopista de comunicación bidireccional superveloz a través del nervio vago. Sorprendentemente, el noventa por ciento de las fibras del nervio vago transportan información desde el intestino hacia el cerebro, no al revés. La microbiota intestinal —los billones de bacterias que viven en nuestro colon— juega un rol protagónico en este flujo, ya que sintetiza neurotransmisores cruciales como el ácido gamma-aminobutírico (GABA), la dopamina y la serotonina. Cuando la microbiota sufre un desequilibrio o disbiosis debido a una mala dieta o al uso indiscriminado de antibióticos, la calidad del flujo informativo se altera. Los estudios clínicos demuestran que corregir la disbiosis con probióticos y fibra soluble puede aliviar significativamente los síntomas del trastorno de ansiedad generalizada y la depresión leve, abriendo la puerta a una psiquiatría de base nutricional.',
    questions: [
      { q: '¿Cuál es la principal vía de comunicación del eje intestino-cerebro?', opts: ['El torrente sanguíneo', 'El nervio vago', 'El sistema linfático', 'La médula espinal'], correct: 1 },
      { q: '¿En qué dirección viaja la mayor parte de la información en el nervio vago?', opts: ['Del cerebro hacia el intestino', 'Del intestino hacia el cerebro', 'En paralelo a los músculos periféricos', 'Solo viaja en círculos'], correct: 1 },
      { q: '¿Qué neurotransmisor crucial sintetiza la microbiota intestinal según el texto?', opts: ['GABA, dopamina y serotonina', 'Adrenalina y cortisol', 'Melatonina y oxitocina', 'Acetilcolina pura'], correct: 0 },
      { q: '¿Qué es la disbiosis y cuál es su impacto?', opts: ['Un exceso de neuronas en el colon', 'Un desequilibrio de la microbiota que altera el flujo informativo al cerebro', 'Una enfermedad pulmonar infecciosa', 'La cura definitiva para la depresión'], correct: 1 },
    ],
  },
  {
    id: 'p_social_media_rewiring',
    title: 'Reconfiguración digital de la atención',
    length: 'long',
    text: 'El diseño persuasivo de las plataformas digitales modernas representa el mayor experimento de reconfiguración del cerebro humano jamás realizado. Utilizando algoritmos de aprendizaje profundo que optimizan el tiempo de visualización, las redes sociales entregan micro-recompensas en forma de "likes", notificaciones y videos cortos altamente estimulantes. Esta estimulación continua e impredecible mantiene al sistema dopaminérgico en un perpetuo estado de excitación, reduciendo nuestra tolerancia al aburrimiento y acortando drásticamente el tramo de atención sostenida. El cerebro humano se adapta de forma plástica a este entorno de alta velocidad y nulo esfuerzo, reconfigurando sus circuitos atencionales para favorecer la distracción rápida y el escaneo superficial sobre la lectura profunda y el análisis analítico. Esta atrofia de la atención voluntaria dificulta el estudio de textos complejos, la resolución de problemas abstractos y el razonamiento lógico riguroso, debilitando el músculo cognitivo básico necesario para el florecimiento intelectual y científico de las nuevas generaciones.',
    questions: [
      { q: '¿Qué optimizan principalmente los algoritmos de las redes sociales?', opts: ['La felicidad y paz del usuario', 'El tiempo de visualización en la plataforma', 'La velocidad de la conexión a internet', 'El aprendizaje de nuevos idiomas'], correct: 1 },
      { q: '¿Qué efecto tiene la estimulación digital constante sobre nuestro cerebro?', opts: ['Aumenta nuestra tolerancia al aburrimiento', 'Reduce nuestra tolerancia al aburrimiento y acorta el tramo de atención sostenida', 'Mejora la memoria espacial notablemente', 'Desarrolla el córtex auditivo de forma sana'], correct: 1 },
      { q: '¿Qué tipo de lectura se ve perjudicada por la reconfiguración digital?', opts: ['La lectura veloz en diagonal', 'La lectura profunda y el análisis analítico', 'El reconocimiento básico de letras', 'La visión nocturna textual'], correct: 1 },
      { q: '¿Cómo responde el cerebro a este entorno de micro-recompensas continuas?', opts: ['Rechazando las pantallas instintivamente', 'Adaptándose plásticamente y reconfigurando circuitos para favorecer la distracción', 'Creando defensas sinápticas inquebrantables', 'Mejorando la retención verbal a largo plazo'], correct: 1 },
    ],
  },
  {
    id: 'p_bilingual_brain',
    title: 'El cerebro bilingüe',
    length: 'long',
    text: 'Hablar dos o más idiomas con fluidez va mucho más allá de un beneficio cultural o profesional; reconfigura físicamente el cerebro de maneras asombrosas. En un cerebro bilingüe, ambos sistemas lingüísticos están siempre encendidos y activos simultáneamente, compitiendo en cada instante. Esto significa que cuando una persona bilingüe habla, lee o escucha, su cerebro debe resolver un conflicto continuo, seleccionando las palabras del idioma deseado mientras su suprime activamente las interferencias del otro. Para realizar este titánico trabajo de filtrado, el cerebro recluta masivamente el sistema de control ejecutivo, ubicado en la corteza prefrontal y el córtex cingulado anterior. Este ejercicio permanente fortalece las redes de atención y control, permitiendo a los bilingües alternar entre tareas complejas con mayor velocidad y menor fatiga cognitiva. Los estudios geriátricos confirman que este entrenamiento diario crea una reserva cognitiva masiva que retrasa la manifestación de los síntomas de demencia senil y enfermedad de Alzheimer un promedio de cuatro a cinco años en comparación con los monolingües.',
    questions: [
      { q: '¿Qué ocurre con los sistemas lingüísticos en un cerebro bilingüe?', opts: ['Se apagan alternadamente según el país', 'Están siempre encendidos y activos simultáneamente compitiendo', 'Se fusionan en un nuevo idioma híbrido', 'Solo funciona uno a la vez'], correct: 1 },
      { q: '¿Qué sistemas cerebrales recluta el cerebro para suprimir interferencias?', opts: ['El sistema límbico y la visión periférica', 'El sistema de control ejecutivo en la corteza prefrontal y cingulado anterior', 'El sistema de memoria a corto plazo en el hipocampo únicamente', 'La zona auditiva del lóbulo temporal inferior'], correct: 1 },
      { q: '¿Cuál es un beneficio a largo plazo de esta reconfiguración física cerebral?', opts: ['Mejorar la visión a larga distancia', 'Retrasar la manifestación de síntomas de Alzheimer de 4 a 5 años', 'Aumentar la masa muscular corporal', 'Eliminar la necesidad de dormir'], correct: 1 },
      { q: '¿Qué es la "reserva cognitiva" generada por el bilingüismo?', opts: ['Un área de almacenamiento de vocabulario', 'La fortaleza protectora del cerebro contra el declive cognitivo', 'El combustible que consume la corteza visual', 'Una capacidad de memorizar números telefónicos'], correct: 1 },
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
