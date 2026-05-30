/**
 * Loci Presets Database
 * High-quality visual fallbacks and surreal mnemonic story associations
 * for standard rooms, objects, and new corporal templates.
 */

export interface PresetObjectMeta {
  word: string;
  imageUrl: string;
}

export const LOCI_OBJECT_METAS: Record<string, PresetObjectMeta> = {
  llave: {
    word: 'llave',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', // Glowing glass/neon shape
  },
  manzana: {
    word: 'manzana',
    imageUrl: 'https://images.unsplash.com/photo-1618005198143-d3667cd6f29e?w=600&auto=format&fit=crop&q=80', // Surreal glowing organic apple-like art
  },
  libro: {
    word: 'libro',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', // Glowing mystical book
  },
  reloj: {
    word: 'reloj',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', // Surreal Dali clock-like time art
  },
  guitarra: {
    word: 'guitarra',
    imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80', // Neon glowing guitar art
  },
  sombrero: {
    word: 'sombrero',
    imageUrl: 'https://images.unsplash.com/photo-1533827436517-5782748b430b?w=600&auto=format&fit=crop&q=80', // Magical levitating hat
  },
  paraguas: {
    word: 'paraguas',
    imageUrl: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=600&auto=format&fit=crop&q=80', // Glowing yellow levitating umbrella
  },
  vela: {
    word: 'vela',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80', // Beautiful burning candle flame
  },
  mapa: {
    word: 'mapa',
    imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80', // Cosmic stardust map shape
  },
  taza: {
    word: 'taza',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=600&auto=format&fit=crop&q=80', // Steaming galaxy mug
  },
};

// Mnemonic stories connecting [Room] with [Object]
const STORIES_CASA: Record<string, Record<string, string>> = {
  entrance: {
    llave: "¡Qué locura! Una LLAVE dorada gigante de tres metros bloquea la Entrada, lanzando destellos láser de purpurina a quien intente cruzar.",
    manzana: "En la Entrada, una MANZANA gigante vestida de portero te exige tu identificación con un guiño burlón antes de dejarte pasar.",
    libro: "¡Insólito! Un enorme LIBRO flotante de cuero te atrapa al cruzar la Entrada y te recita poemas de amor griegos en voz muy alta.",
    reloj: "¡Bizarro! Un RELOJ de arena gigante está flotando en la Entrada, y en vez de arena caen monedas de oro que tintinean al chocar.",
    guitarra: "Una GUITARRA voladora toca un solo de rock ruidoso en la Entrada y te saluda haciendo una reverencia en el aire.",
    sombrero: "Un SOMBRERO de copa gigante flota en la Entrada y absorbe tus llaves como un agujero negro mnemotécnico.",
    paraguas: "Un PARAGUAS amarillo baila tap en la Entrada bajo una lluvia artificial de billetes de monopolio.",
    vela: "Una VELA gigante del tamaño de un faro flota en la Entrada, guiando tu camino con una llama de arcoíris.",
    mapa: "Un MAPA holográfico 3D flota en la Entrada y proyecta un laberinto galáctico que te rodea por completo.",
    taza: "Una TAZA de té gigante flota en la Entrada y te ofrece un baño de burbujas caliente con olor a fresa.",
  },
  kitchen: {
    llave: "En la Cocina, una LLAVE gigante está batiendo huevos mágicos dentro de un sartén ardiente que flota por el aire.",
    manzana: "¡Surrealista! En la Cocina, una MANZANA gigante de color rubí está friendo sartenes enteras de billetes de cien dólares.",
    libro: "En la Cocina, encuentras un LIBRO gigante que está horneando galletas con forma de letras del abecedario que bailan solas.",
    reloj: "¡Divertido! En la Cocina, un RELOJ de pared derretido gotea chocolate de menta sobre los quemadores de la estufa.",
    guitarra: "Una GUITARRA acústica está usando una cuchara para revolver una sopa de estrellas que brilla en la oscuridad en la Cocina.",
    sombrero: "En la Cocina, un SOMBRERO de chef gigante hecho de malvavisco se cocina a sí mismo dentro del horno encendido.",
    paraguas: "Un PARAGUAS azul flota sobre la mesa de la Cocina protegiendo a una familia de fresas de una lluvia de azúcar glas.",
    vela: "Una VELA con aroma a tocino flota en la Cocina y calienta de forma mágica una cafetera espacial.",
    mapa: "En la Cocina, un MAPA antiguo sirve como mantel para platos de comida espacial que levitan.",
    taza: "¡Insólito! Una TAZA de café gigante tiene una piscina llena de malvaviscos saltarines que bailan en la Cocina.",
  },
  living: {
    llave: "En la Sala, una LLAVE gigante está jugando tenis de mesa contra el sofá usando una raqueta de cristal.",
    manzana: "¡Increíble! En la Sala, una MANZANA gigante con lentes de sol está acostada en el sofá viendo televisión y comiendo palomitas.",
    libro: "En la Sala, un LIBRO volador de cuero antiguo está tragando al sofá completo y luego eructa fuegos artificiales de colores.",
    reloj: "¡Bizarro! Un RELOJ cucú gigante cuelga en la Sala, y cada hora sale un dragón de peluche lanzando burbujas de jabón.",
    guitarra: "En la Sala, una GUITARRA eléctrica rosa toca sola un concierto de metal mientras el televisor aplaude con manos humanas.",
    sombrero: "Un SOMBRERO de copa gigante flota sobre la mesa de la Sala y de él brotan conejos blancos a propulsión espacial.",
    paraguas: "En la Sala, un PARAGUAS verde se abre y se cierra en el techo simulando un ventilador loco que tira confeti.",
    vela: "Una VELA flotante gigante ilumina la Sala con una llama azul que toma forma de un fantasma amistoso que te saluda.",
    mapa: "Un MAPA del tesoro gigante flota en la pared de la Sala y las islas dibujadas tienen pequeños volcanes de purpurina activos.",
    taza: "Una TAZA de chocolate caliente levita en la Sala y dibuja constelaciones con su humo dulce en el techo.",
  },
  bedroom: {
    llave: "En el Dormitorio, una LLAVE dorada gigante duerme arropada en tu cama, roncando ruidosamente como una trompeta.",
    manzana: "¡Absurdo! En el Dormitorio, una MANZANA gigante con pijama está saltando en la cama y tirando almohadas de plumas.",
    libro: "En el Dormitorio, un LIBRO gigante te susurra cuentos fantásticos al oído mientras sus páginas flotan como sábanas.",
    reloj: "En el Dormitorio, un RELOJ de pared derretido de Salvador Dalí gotea chocolate caliente de menta sobre tu almohada.",
    guitarra: "Una GUITARRA acústica duerme flotando sobre tu cama, y sus cuerdas brillan y vibran con una nana relajante.",
    sombrero: "Un SOMBRERO de bruja gigante flota sobre tu cama y hace levitar las almohadas en un baile circular bizarro.",
    paraguas: "Un PARAGUAS rosa flota sobre tu cama y te protege de una lluvia mágica de estrellas fluorescentes que caen del techo.",
    vela: "Una VELA del tamaño de un poste de luz flota junto a la cama, ardiendo con una llama dorada hipnótica.",
    mapa: "Un MAPA celestial se proyecta en las sábanas de tu cama en el Dormitorio, permitiéndote navegar por el espacio al tocarlo.",
    taza: "Una TAZA de leche tibia gigante flota sobre la mesa de noche del Dormitorio, con una galleta gigante flotando a modo de balsa.",
  },
  office: {
    llave: "En la Oficina, una LLAVE gigante escribe en la computadora usando sus dos dientes metálicos a toda velocidad.",
    manzana: "En la Oficina, una MANZANA de cristal brillante sirve de pisapapeles para planos de un cohete espacial espacial.",
    libro: "¡Surrealista! En la Oficina, un LIBRO de enciclopedia vuela persiguiendo al ratón de la computadora que huye asustado.",
    reloj: "En la Oficina, un RELOJ de arena gigante sirve de silla ergonómica y se da la vuelta solo cada cinco minutos.",
    guitarra: "En la Oficina, una GUITARRA eléctrica de neón rosa toca solos de metal por sí sola mientras flota en una burbuja de jabón gigante.",
    sombrero: "Un SOMBRERO de copa de negocios flota sobre tu escritorio y te saluda quitándose la gorra de forma absurda.",
    paraguas: "Un PARAGUAS negro flota sobre la computadora de la Oficina para protegerla de una tormenta digital de ceros y unos.",
    vela: "Una VELA flotante con forma de bombilla brilla sobre tu cabeza en la Oficina cuando se te ocurre una idea brillante.",
    mapa: "Un MAPA mundi gigante en la pared de la Oficina tiene océanos reales con pequeños barcos piratas navegando por él.",
    taza: "Una TAZA de café gigante flota en la Oficina, y de ella emerge un teclado de ordenador hecho de espuma dulce.",
  },
  bath: {
    llave: "En el Baño, una LLAVE gigante de cobre se está dando un relajante baño de burbujas en la tina cantando ópera.",
    manzana: "En el Baño, una MANZANA gigante de color verde neón está lavándose los dientes con un cepillo gigante frente al espejo.",
    libro: "¡Insólito! En el Baño, un LIBRO impermeable flota en la bañera mientras sus páginas leen a patitos de goma bailarines.",
    reloj: "En el Baño, un RELOJ impermeable está pegado al espejo y sus manecillas giran al revés salpicando gotas de colonia.",
    guitarra: "En el Baño, una GUITARRA eléctrica impermeable toca un solo estridente bajo el chorro de agua de la ducha.",
    sombrero: "Un SOMBRERO pirata gigante flota en el inodoro y dispara chorros de agua limpia como una fuente señorial.",
    paraguas: "Un PARAGUAS amarillo flota abierto boca abajo bajo la ducha en el Baño, sirviendo de bote salvavidas para jabones.",
    vela: "Una VELA aromática gigante flota sobre el lavabo del Baño y su llama baila al compás de la música de la ducha.",
    mapa: "Un MAPA del tesoro impermeable está pegado en la tina del Baño, revelando rutas secretas bajo la espuma jabonosa.",
    taza: "Una TAZA de té gigante flota en el Baño llena de sales de baño de colores que tiñen el agua de púrpura neón.",
  },
  garden: {
    llave: "En el Jardín, una LLAVE gigante de oro está plantando semillas de diamantes en el césped con una pala mágica.",
    manzana: "En el Jardín, una MANZANA gigante de color rojo brillante cuelga de un árbol y canta con voz de soprano a los pájaros.",
    libro: "En el Jardín, encuentras un LIBRO gigante cuyas páginas son hojas verdes vivas que capturan la luz del sol.",
    reloj: "En el Jardín, un RELOJ de sol gigante está hecho de flores que se abren y cierran secuencialmente para dar la hora.",
    guitarra: "Una GUITARRA de madera está enterrada en el Jardín y de su mástil brotan hermosas rosas rojas perfumadas.",
    sombrero: "Un SOMBRERO de paja gigante flota sobre el jardín y riega de forma mágica todas las plantas como una nube de lluvia.",
    paraguas: "Un PARAGUAS amarillo brillante flota al revés en el aire, recolectando agua de lluvia y criando patitos de goma.",
    vela: "Una VELA gigante de cera verde flota en el Jardín, atrayendo luciérnagas doradas que orbitan a su alrededor.",
    mapa: "Un MAPA topográfico gigante está grabado en el césped del Jardín, mostrando rutas secretas a través de los arbustos.",
    taza: "Una TAZA de té gigante sirve de maceta en el Jardín, albergando una planta carnívora que baila jazz.",
  },
  attic: {
    llave: "En el Ático, una LLAVE antigua gigante flota entre el polvo, custodiando un cofre del tesoro que brilla de forma misteriosa.",
    manzana: "En el Ático, una MANZANA gigante de oro macizo descansa sobre un pedestal de madera antigua rodeada de telarañas de plata.",
    libro: "En el Ático, un LIBRO gigante cubierto de polvo flota solo y sus páginas vuelan como murciélagos de papel.",
    reloj: "En el Ático, un RELOJ de péndulo antiguo flota y sus engranajes transparentes revelan una galaxia girando dentro.",
    guitarra: "En el Ático, una GUITARRA de rock desgastada flota y proyecta hologramas de conciertos clásicos en el techo de madera.",
    sombrero: "Un SOMBRERO de mago cubierto de telarañas flota en el Ático y hace flotar las cajas viejas a su alrededor.",
    paraguas: "En el Ático, un PARAGUAS de encaje antiguo flota abierto en el aire, atrapando motas de polvo que brillan como estrellas.",
    vela: "Una VELA flotante gigante arde en el Ático con una llama azul que toma forma de un fantasma amistoso que te saluda con un guiño.",
    mapa: "Un MAPA estelar antiguo flota en el centro del Ático, proyectando constelaciones tridimensionales que giran despacio.",
    taza: "Una TAZA de porcelana fina gigante flota en el Ático y de su interior emergen mariposas de luz multicolor.",
  },
};

// Map room labels to story keys for casa
const ROOM_MAP_CASA: Record<string, string> = {
  'entrada': 'entrance',
  'cocina': 'kitchen',
  'sala': 'living',
  'dormitorio': 'bedroom',
  'oficina': 'office',
  'baño': 'bath',
  'jardín': 'garden',
  'ático': 'attic',
};

// Map room labels to story keys for oficina
const ROOM_MAP_OFICINA: Record<string, string> = {
  'recepción': 'entrance',
  'cafetería': 'kitchen',
  'reuniones': 'living',
  'relax': 'bedroom',
  'escritorio': 'office',
  'sanitario': 'bath',
  'terraza': 'garden',
  'archivo': 'attic',
};

// Map room labels to story keys for naturaleza
const ROOM_MAP_NATURALEZA: Record<string, string> = {
  'sendero': 'entrance',
  'campamento': 'kitchen',
  'el claro': 'living',
  'cabaña': 'bedroom',
  'mirador': 'office',
  'cascada': 'bath',
  'el lago': 'garden',
  'la cueva': 'attic',
};

// General fallback generator in case of mismatched labels
export function getLociPresetStory(theme: string, roomLabel: string, objectWord: string): string {
  const cleanRoom = roomLabel.trim().toLowerCase();
  const cleanObj = objectWord.trim().toLowerCase();
  
  // Find preset object metadata for image fallback
  const objMeta = LOCI_OBJECT_METAS[cleanObj] || LOCI_OBJECT_METAS.llave;
  
  let key = 'entrance';
  if (theme === 'casa') {
    key = ROOM_MAP_CASA[cleanRoom] || 'entrance';
  } else if (theme === 'oficina') {
    key = ROOM_MAP_OFICINA[cleanRoom] || 'entrance';
  } else if (theme === 'naturaleza') {
    key = ROOM_MAP_NATURALEZA[cleanRoom] || 'entrance';
  } else if (theme === 'cuerpo') {
    // Mi propio cuerpo templates
    const bodyStories: Record<string, Record<string, string>> = {
      'cabeza': {
        llave: "¡Absurdo! Una LLAVE dorada gigante se introduce en una cerradura invisible en tu Cabeza, abriendo tus pensamientos al espacio exterior.",
        manzana: "En tu Cabeza, una MANZANA gigante de color rojo neón sirve de sombrero elegante y baila tap al ritmo de tus ideas.",
        libro: "¡Bizarro! Un LIBRO pesado de enciclopedia flota justo encima de tu Cabeza y pasa sus páginas como si te peinara.",
        reloj: "En tu Cabeza, un RELOJ despertador gigante suena ruidosamente y te hace flotar tres centímetros del suelo.",
        guitarra: "Una GUITARRA eléctrica de neón descansa en tu Cabeza tocando solos de heavy metal por sí sola.",
        sombrero: "Un SOMBRERO de copa de mago gigante encaja perfectamente en tu Cabeza, y de él salen palomas de luz blanca.",
        paraguas: "Un PARAGUAS de colores se abre en tu Cabeza para protegerte de una lluvia de ideas luminosas.",
        vela: "Una VELA flotante arde encima de tu Cabeza, iluminando tu rostro con una llama dorada que representa la inteligencia pura.",
        mapa: "Un MAPA galáctico en 3D flota alrededor de tu Cabeza, mostrando órbitas planetarias brillantes en tus sienes.",
        taza: "Una TAZA de chocolate caliente humeante flota encima de tu Cabeza, goteando espuma dulce sobre tu frente.",
      },
      'ojos': {
        llave: "¡Bizarro! En tus Ojos, dos LLAVES doradas giran como pupilas robóticas, permitiéndote ver a través de las paredes.",
        manzana: "Llevas dos MANZANAS pequeñas como anteojos en tus Ojos, haciéndote ver el mundo de color rojo brillante.",
        libro: "Frente a tus Ojos, un LIBRO tridimensional vuela desplegando letras tridimensionales flotantes que giran rápido.",
        reloj: "En tus Ojos, las manecillas de un RELOJ giran a toda velocidad, haciéndote pestañear luces de discoteca.",
        guitarra: "Frente a tus Ojos, una GUITARRA de luces LED vuela, parpadeando al compás de la música espacial.",
        sombrero: "Un SOMBRERO vaquero diminuto flota justo enfrente de tus Ojos, tapándote la vista con un gracioso baile circular.",
        paraguas: "Dos PARAGUAS en miniatura giran frente a tus Ojos como si fueran ventiladores, refrescando tu mirada.",
        vela: "Dos VELAS encendidas flotan frente a tus Ojos, y sus llamas cambian de color al compás de tus latidos.",
        mapa: "Un MAPA del tesoro se despliega ante tus Ojos y un pequeño rayo láser te señala la ubicación del cofre del tesoro.",
        taza: "Dos TAZAS de té flotan ante tus Ojos y de ellas sale un vapor mágico que proyecta películas espaciales en el aire.",
      },
      'boca': {
        llave: "En tu Boca, una LLAVE dorada gigante actúa de piruleta con sabor a menta refrescante que te hace cantar ópera.",
        manzana: "En tu Boca, muerdes una MANZANA gigante que al primer mordisco explota en una tormenta de confeti de colores.",
        libro: "¡Insólito! De tu Boca salen pequeños LIBROS de cuentos de hadas voladores cada vez que intentas hablar.",
        reloj: "En tu Boca, llevas un RELOJ de bolsillo que tintinea campanadas alegres cada vez que te ríes.",
        guitarra: "En tu Boca, sostienes el mástil de una GUITARRA eléctrica rosa que suena estridente al abrir los labios.",
        sombrero: "De tu Boca sale un SOMBRERO de copa gigante que flota en el aire y te traga entero con un soplido.",
        paraguas: "En tu Boca, sostienes un PARAGUAS de cóctel diminuto que lanza chorritos de refresco de naranja.",
        vela: "¡Absurdo! Soplas por la Boca y en vez de aire sale una VELA encendida que canta el feliz cumpleaños por ti.",
        mapa: "De tu Boca se despliega un MAPA infinito en rollo de papel que se extiende por el suelo de forma infinita.",
        taza: "En tu Boca, sostienes una TAZA de café gigante por el asa, silbando melodías de jazz de forma graciosa.",
      },
      'hombros': {
        llave: "En tus Hombros, llevas hombreras de LLAVES de metal brillante que chocan entre sí sonando como campanas chinas.",
        manzana: "En tus Hombros, dos MANZANAS gigantes de color rubí hacen equilibrio para no caerse mientras caminas.",
        libro: "¡Surrealista! En tus Hombros, dos gruesos LIBROS de historia te sirven de alas de papel y aletean despacio.",
        reloj: "En tus Hombros, dos RELOJES de arena gigante cuelgan de lado a lado y la arena dorada brilla en la oscuridad.",
        guitarra: "Una GUITARRA eléctrica rosa descansa en tu Hombro derecho, tocando sola solos de metal muy ruidosos.",
        sombrero: "En tus Hombros, descansa un SOMBRERO de paja gigante que te cubre los costados como un caparazón de tortuga.",
        paraguas: "Dos PARAGUAS abiertos en miniatura flotan sobre tus Hombros para protegerte de una lluvia de caramelos masticables.",
        vela: "Dos VELAS encendidas flotan sobre tus Hombros, con llamas gemelas que brillan con luz dorada permanente.",
        mapa: "En tu Hombro, llevas un MAPA militar que te sirve de capa de superhéroe y ondea al viento de forma majestuosa.",
        taza: "Dos TAZAS de té flotan sobre tus Hombros, sirviendo té caliente de forma automática en tu boca.",
      },
      'pecho': {
        llave: "En tu Pecho, brilla un corazón de LLAVE dorada gigante que abre una compuerta secreta a tu imaginación.",
        manzana: "¡Increíble! En tu Pecho, late una MANZANA gigante de color verde neón en vez de tu corazón, latiendo a ritmo alegre.",
        libro: "En tu Pecho, llevas un LIBRO de cuentos gigante abierto, y sus páginas se pasan solas al ritmo de tu respiración.",
        reloj: "En tu Pecho, un RELOJ de péndulo antiguo late rítmicamente revelando una galaxia brillante girando dentro.",
        guitarra: "Una GUITARRA acústica está fusionada en tu Pecho, y sus cuerdas vibran dulcemente con cada uno de tus suspiros.",
        sombrero: "En tu Pecho, llevas un SOMBRERO de copa señorial cosido a modo de bolsillo gigante del que brota confeti.",
        paraguas: "Un PARAGUAS multicolor se abre desde tu Pecho para servir de escudo mnemotécnico contra las distracciones.",
        vela: "En tu Pecho, arde una VELA flotante gigante cuya cera de colores dibuja mapas de estrellas en tu piel.",
        mapa: "En tu Pecho, llevas un MAPA del tesoro tatuado que brilla con luces de neón cuando te acercas al conocimiento.",
        taza: "En tu Pecho, hay una TAZA de café gigante empotrada de la cual brota una fuente interminable de espuma de capuchino.",
      },
      'manos': {
        llave: "En tus Manos, tus dedos se convierten en LLAVES maestras doradas que abren cualquier puerta mágica en el universo.",
        manzana: "En tus Manos, sostienes una MANZANA de oro macizo tan pesada que te hace levitar en el aire.",
        libro: "En tus Manos, sostienes un LIBRO interactivo en 3D que proyecta hologramas de dinosaurios que corren por tus palmas.",
        reloj: "En tus Manos, sostienes un RELOJ derretido de Dalí que se escurre entre tus dedos como caramelo líquido.",
        guitarra: "Tus Manos disparan micro-rayos de energía al tocar una GUITARRA de aire invisible, haciéndola sonar real.",
        sombrero: "En tus Manos, sostienes un SOMBRERO de mago del cual sacas monedas de oro interminables de forma absurda.",
        paraguas: "En tus Manos, giras un PARAGUAS de arcoíris que crea un escudo de viento brillante a tu alrededor.",
        vela: "En tus Manos, llevas una VELA cuya llama azul no quema y te permite iluminar los rincones oscuros del palacio.",
        mapa: "En tus Manos, extiendes un MAPA holográfico estelar con el que puedes rotar las galaxias al tocar la pantalla.",
        taza: "En tus Manos, sostienes una TAZA de té gigante de la cual brotan mariposas de luz multicolor.",
      },
      'rodillas': {
        llave: "En tus Rodillas, llevas rodilleras de LLAVES doradas gigantes que chirrían melodías graciosas al caminar.",
        manzana: "En tus Rodillas, dos MANZANAS gigantes de color rojo brillante cuelgan a los lados sirviéndote de propulsores mágicos.",
        libro: "En tus Rodillas, dos LIBROS escolares te sirven de escudo y se abren solos para que estudies al correr.",
        reloj: "En tus Rodillas, dos RELOJES cucú marcan el paso de tu caminata disparando pequeños pájaros mecánicos en cada zancada.",
        guitarra: "En tus Rodillas, descansa una GUITARRA de rock que rasgueas al flexionar las piernas en un baile loco.",
        sombrero: "En tus Rodillas, llevas dos SOMBREROS de fiesta cónicos de colores neón que silban confeti en cada paso.",
        paraguas: "Dos PARAGUAS en miniatura están atados a tus Rodillas, abriéndose solos para ayudarte a saltar más alto.",
        vela: "Dos VELAS flotantes de color verde orbitan alrededor de tus Rodillas como satélites iluminando el camino.",
        mapa: "Dos MAPAS de rutas secretas envuelven tus Rodillas a modo de vendaje de explorador espacial brillante.",
        taza: "Dos TAZAS de café gigantes flotan a la altura de tus Rodillas, derramando chorritos de chocolate dulce al suelo.",
      },
      'pies': {
        llave: "En tus Pies, calzas zapatos de LLAVES doradas gigantes que te permiten flotar y deslizarte por los pasillos mnemónicos.",
        manzana: "¡Bizarro! En tus Pies, calzas dos MANZANAS gigantes y jugosas a modo de patines con ruedas de uva neón.",
        libro: "¡Insólito! En tus Pies, calzas dos pesados LIBROS de enciclopedia con alas de papel que te elevan del suelo.",
        reloj: "En tus Pies, llevas dos RELOJES de pared a modo de zapatos que marcan tus pasos con un rítmico 'tic-tac' luminoso.",
        guitarra: "En tus Pies, calzas dos GUITARRAS eléctricas a modo de esquís que tocan acordes de metal a cada paso que das.",
        sombrero: "En tus Pies, llevas dos SOMBREROS de copa alta negros a modo de botas de los cuales salen flores mágicas.",
        paraguas: "Llevas dos PARAGUAS de playa atados a tus Pies que te sirven de paracaídas en caídas libres mnemónicas.",
        vela: "Llevas dos VELAS encendidas en tus Pies que iluminan el suelo a tu paso con estelas de fuego azul.",
        mapa: "Llevas dos MAPAS estelares a modo de calcetines brillantes que guían tus pasos hacia el conocimiento exacto.",
        taza: "En tus Pies, calzas dos TAZAS de té gigantes que flotan sobre el agua, permitiéndote caminar sobre cualquier piscina.",
      },
    };
    return bodyStories[cleanRoom]?.[cleanObj] || `Una escena surrealista de un(a) ${objectWord.toUpperCase()} en tu ${roomLabel}.`;
  } else if (theme === 'mano') {
    // Los dedos de la mano templates
    const handStories: Record<string, Record<string, string>> = {
      'pulgar': {
        llave: "¡Qué locura! En tu dedo Pulgar, una LLAVE dorada gigante gira y te da la señal de aprobación con destellos láser.",
        manzana: "En tu dedo Pulgar, sostiene con equilibrio una MANZANA gigante de color verde neón que guiña un ojo divertido.",
        libro: "¡Bizarro! En tu dedo Pulgar descansa un LIBRO diminuto que pasa sus páginas a toda velocidad cantando melodías.",
        reloj: "En tu dedo Pulgar, un RELOJ de pulsera gigante gira marcando el paso de tus minutos con luces estroboscópicas.",
        guitarra: "Una GUITARRA acústica en miniatura flota en la punta de tu Pulgar, vibrando con notas dulces de guitarra.",
        sombrero: "Un SOMBRERO de copa alta diminuto corona tu dedo Pulgar como si fuera un rey de la mnemotecnia.",
        paraguas: "Un PARAGUAS de playa en miniatura se abre sobre tu Pulgar para darle sombra en un día soleado de estudio.",
        vela: "Una VELA encendida flota en la punta de tu Pulgar, con una llama azul que no quema y te saluda alegremente.",
        mapa: "Un MAPA del tesoro se enrolla alrededor de tu Pulgar, mostrándote la ruta secreta a la biblioteca.",
        taza: "Una TAZA de café humeante en miniatura flota sobre tu Pulgar, ofreciéndote energía mágica concentrada.",
      },
      'índice': {
        llave: "En tu dedo Índice, una LLAVE dorada apunta hacia adelante como una varita mágica disparando chispas de luz.",
        manzana: "En tu dedo Índice, haces girar una MANZANA gigante en su eje como si fuera un balón de baloncesto profesional.",
        libro: "¡Insólito! Tu dedo Índice señala a un LIBRO gigante que flota y el libro te responde abriéndose en la página exacta.",
        reloj: "En tu dedo Índice, llevas un RELOJ de péndulo que oscila de lado a lado marcando el compás de tus gestos.",
        guitarra: "Tu dedo Índice toca las cuerdas invisibles de una GUITARRA de aire que suena con acordes estridentes de rock.",
        sombrero: "Un SOMBRERO pirata descansa en tu dedo Índice, dándote la bienvenida con una reverencia de capitán.",
        paraguas: "Un PARAGUAS amarillo en miniatura gira en tu dedo Índice como un molinete de viento brillante.",
        vela: "Tu dedo Índice se enciende como una VELA mágica, guiando tu camino en el palacio mental oscuro.",
        mapa: "Tu dedo Índice traza líneas brillantes sobre un MAPA estelar flotante, moviendo planetas y estrellas.",
        taza: "En tu dedo Índice, balanceas por el asa una TAZA de té gigante llena de espuma de colores saltarines.",
      },
      'medio': {
        llave: "En tu dedo Medio, una LLAVE dorada gigante se erige como una estatua real, brillando con oro pulido.",
        manzana: "En tu dedo Medio, una MANZANA de oro descansa de forma majestuosa en un trono de diamantes diminuto.",
        libro: "¡Bizarro! En tu dedo Medio descansa un pesado LIBRO de enciclopedia que equilibra todo tu cuerpo en un pie.",
        reloj: "En tu dedo Medio, un RELOJ despertador suena ruidosamente haciéndote saltar con cada una de sus campanadas.",
        guitarra: "Una GUITARRA eléctrica rosa flota en la punta de tu dedo Medio tocando solos de heavy metal muy rápidos.",
        sombrero: "Un SOMBRERO de mago de color morado corona tu dedo Medio, desprendiendo chispas mágicas doradas.",
        paraguas: "Un PARAGUAS de encaje antiguo se abre en tu dedo Medio para proteger al resto de la mano de una lluvia de purpurina.",
        vela: "Una VELA gigante de cera verde flota en la punta de tu dedo Medio, ardiendo con una llama multicolor hipnótica.",
        mapa: "Un MAPA celestial se pliega y despliega en tu dedo Medio como un abanico oriental de luces de neón.",
        taza: "Una TAZA de café gigante de cerámica flota sobre tu dedo Medio y dibuja espirales dulces con su aroma.",
      },
      'anular': {
        llave: "En tu dedo Anular, llevas una LLAVE dorada como si fuera un anillo de bodas gigante que brilla intensamente.",
        manzana: "En tu dedo Anular, se apoya una MANZANA gigante de color verde neón que late como si fuera una joya mágica.",
        libro: "¡Surrealista! En tu dedo Anular descansa un LIBRO abierto que proyecta hologramas de letras doradas en el aire.",
        reloj: "En tu dedo Anular, llevas un RELOJ de bolsillo cuyo péndulo brilla como un diamante tallado.",
        guitarra: "Tu dedo Anular se flexiona y rasguea una GUITARRA de rock invisible que vibra de forma armoniosa.",
        sombrero: "Un SOMBRERO señorial negro descansa en tu dedo Anular, saludando elegantemente en cada movimiento.",
        paraguas: "Un PARAGUAS rosa en miniatura flota en tu dedo Anular sirviéndote de paracaídas mnemotécnico.",
        vela: "Una VELA aromática de lavanda flota en la punta de tu dedo Anular, calmando tus nervios en el examen.",
        mapa: "Un MAPA mundi en miniatura se enrolla alrededor de tu dedo Anular como un precioso anillo brillante.",
        taza: "Una TAZA de té fina de porcelana flota sobre tu dedo Anular con una galleta dulce flotando dentro.",
      },
      'meñique': {
        llave: "En tu dedo Meñique, una LLAVE dorada diminuta abre un pequeño candado flotante en el aire revelando un secreto.",
        manzana: "En tu dedo Meñique, sostiene una MANZANA gigante roja que hace equilibrio sobre un alfiler de plata.",
        libro: "¡Insólito! En tu dedo Meñique descansa un LIBRO volador diminuto cuyas páginas revolotean como un colibrí.",
        reloj: "En tu dedo Meñique, un RELOJ de arena en miniatura gira de lado a lado y la arena dorada brilla como diamantes.",
        guitarra: "Una GUITARRA de rock en miniatura descansa en tu dedo Meñique tocando solos de heavy metal muy graciosos.",
        sombrero: "Un SOMBRERO de bruja diminuto corona tu dedo Meñique haciéndote reír con carcajadas agudas y cómicas.",
        paraguas: "Un PARAGUAS multicolor diminuto flota en tu dedo Meñique para proteger al dedo de una lluvia de caramelos.",
        vela: "Una VELA flotante gigante de color azul arde en la punta de tu dedo Meñique, guiándote con luz dorada.",
        mapa: "Un MAPA del tesoro minúsculo está enrollado en tu dedo Meñique, guiando tus pasos en el palacio mental.",
        taza: "Una TAZA de café minúscula flota sobre tu dedo Meñique, ofreciéndote energía súper concentrada.",
      },
    };
    return handStories[cleanRoom]?.[cleanObj] || `Una escena surrealista de un(a) ${objectWord.toUpperCase()} en tu dedo ${roomLabel}.`;
  }

  // Fallback to theme preset stories
  const stories = STORIES_CASA; // Default fallback
  const themeStories = theme === 'oficina' ? STORIES_OFICINA : theme === 'naturaleza' ? STORIES_NATURALEZA : STORIES_CASA;
  
  return themeStories[key]?.[cleanObj] || `¡Surrealista! Un(a) ${objectWord.toUpperCase()} gigante de chocolate derretido flota tapando la ${roomLabel}.`;
}

// Map database definitions for other themes
const STORIES_OFICINA: Record<string, Record<string, string>> = {
  entrance: {
    llave: "En la Recepción, una LLAVE dorada gigante escribe en la planilla de firmas usando su propia punta metálica.",
    manzana: "En la Recepción, una MANZANA gigante con lentes de sol y traje elegante atiende el teléfono corporativo.",
    libro: "¡Surrealista! En la Recepción, un LIBRO contable gigante de hojas verdes te traga entero y te archiva en una carpeta.",
    reloj: "En la Recepción, un RELOJ de péndulo antiguo de tres metros marca los segundos arrojando monedas de chocolate.",
    guitarra: "Una GUITARRA eléctrica rosa descansa en el sillón de la Recepción tocando rock ruidoso por sí sola.",
    sombrero: "Un SOMBRERO de copa flota sobre la Recepción y absorbe todas las tarjetas de visita de los clientes.",
    paraguas: "Un PARAGUAS negro baila tap en la Recepción bajo una lluvia artificial de confeti multicolor.",
    vela: "Una VELA gigante ilumina la Recepción con una llama de color azul que toma forma de un fantasma amistoso.",
    mapa: "Un MAPA del tesoro gigante cuelga detrás de la Recepción y sus islas proyectan hologramas de volcanes.",
    taza: "Una TAZA de té gigante flota en la Recepción ofreciendo masajes con espuma dulce a los visitantes.",
  },
  kitchen: {
    llave: "En la Cafetería, una LLAVE de cobre gigante está revolviendo una olla gigante de café dulce que flota sola.",
    manzana: "¡Increíble! En la Cafetería, una MANZANA verde gigante está lavando tazas en el fregadero cantando jazz.",
    libro: "En la Cafetería, encuentras un LIBRO gigante que está horneando galletas con forma de letras que bailan solas.",
    reloj: "¡Divertido! En la Cafetería, un RELOJ de pared derretido gotea chocolate de menta sobre las tazas de café.",
    guitarra: "Una GUITARRA acústica usa una cuchara para revolver una sopa de estrellas que brilla en la Cafetería.",
    sombrero: "Un SOMBRERO de chef hecho de malvavisco se cocina a sí mismo dentro del horno en la Cafetería.",
    paraguas: "Un PARAGUAS azul flota en la Cafetería protegiendo a las donas de una lluvia de chispas de azúcar.",
    vela: "Una VELA con aroma a canela flota en la Cafetería calentando mágicamente una cafetera de plata.",
    mapa: "En la Cafetería, un MAPA sirve de mantel y los caminos dibujados se iluminan al poner platos encima.",
    taza: "¡Insólito! Una TAZA de café gigante tiene una piscina llena de malvaviscos saltarines en la Cafetería.",
  },
  living: {
    llave: "En la Sala de Reuniones, una LLAVE gigante modera la junta señalando los gráficos con destellos de neón.",
    manzana: "En la Sala de Reuniones, una MANZANA gigante de color rubí expone un proyecto sobre el cultivo de frutas.",
    libro: "Un LIBRO de actas gigante se abre en la mesa de Reuniones y sus páginas vuelan como murciélagos de papel.",
    reloj: "En la Sala de Reuniones, un RELOJ de arena gigante sirve de silla ergonómica para el director ejecutivo.",
    guitarra: "Una GUITARRA eléctrica toca solos de metal en la mesa de Reuniones mientras la pizarra aplaude.",
    sombrero: "Un SOMBRERO de copa flota en la Sala de Reuniones y hace levitar las carpetas de trabajo en círculos.",
    paraguas: "Un PARAGUAS verde se abre y se cierra en el techo de la Sala de Reuniones simulando un ventilador loco.",
    vela: "Una VELA flotante ilumina la mesa de Reuniones con una llama dorada que representa la inteligencia pura.",
    mapa: "Un MAPA mundi en 3D flota en la Sala de Reuniones proyectando océanos reales con pequeños barcos.",
    taza: "Una TAZA de café gigante flota en la mesa de Reuniones y dibuja espirales de espuma dulce en el aire.",
  },
  bedroom: {
    llave: "En la zona de Relax, una LLAVE dorada gigante descansa en una silla de masajes roncando como trompeta.",
    manzana: "En la zona de Relax, una MANZANA gigante con antifaz duerme plácidamente en una hamaca que cuelga sola.",
    libro: "En la zona de Relax, un LIBRO gigante te susurra cuentos fantásticos mientras flotas en un puff.",
    reloj: "En la zona de Relax, un RELOJ de Dalí gotea chocolate caliente de menta sobre el sofá de descanso.",
    guitarra: "Una GUITARRA acústica duerme flotando en la zona de Relax y sus cuerdas vibran con una dulce nana.",
    sombrero: "Un SOMBRERO de mago flota en la zona de Relax haciendo levitar las almohadas en un baile circular.",
    paraguas: "Un PARAGUAS rosa flota en la zona de Relax protegiéndote de una lluvia mágica de estrellas del techo.",
    vela: "Una VELA del tamaño de un poste flota junto al sofá de la zona de Relax ardiendo con una llama hipnótica.",
    mapa: "Un MAPA celestial se proyecta en la alfombra de la zona de Relax permitiéndote flotar sobre las constelaciones.",
    taza: "Una TAZA de té gigante flota en la zona de Relax, con una galleta dulce flotando a modo de balsa.",
  },
  office: {
    llave: "En tu Escritorio, una LLAVE dorada gigante escribe correos a toda velocidad usando sus dientes metálicos.",
    manzana: "En tu Escritorio, una MANZANA de cristal brillante sirve de pisapapeles para planos de un cohete espacial.",
    libro: "¡Surrealista! En tu Escritorio, un LIBRO de enciclopedia vuela persiguiendo al ratón que huye asustado.",
    reloj: "En tu Escritorio, un RELOJ de arena gigante sirve de portalápices y los lápices flotan a su alrededor.",
    guitarra: "Una GUITARRA eléctrica rosa toca sola en el Escritorio mientras la computadora aplaude con manos.",
    sombrero: "Un SOMBRERO de copa flota sobre tu silla en el Escritorio saludando a los colegas con un guiño de mago.",
    paraguas: "Un PARAGUAS negro flota sobre el Escritorio de la Oficina protegiéndote de una tormenta digital.",
    vela: "Una VELA flotante con forma de bombilla se enciende sobre tu escritorio cuando se te ocurre una idea brillante.",
    mapa: "Un MAPA estelar cuelga sobre tu Escritorio, mostrando constelaciones que giran despacio en el aire.",
    taza: "Una TAZA de café gigante flota en tu Escritorio, de la cual emerge un teclado de ordenador hecho de espuma.",
  },
};

const STORIES_NATURALEZA: Record<string, Record<string, string>> = {
  entrance: {
    llave: "En el Sendero, una LLAVE dorada gigante de tres metros bloquea el camino flotando entre los arbustos.",
    manzana: "En el Sendero, una MANZANA gigante de color verde neón está guiando la caminata silbando canciones campestres.",
    libro: "En el Sendero, encuentras un LIBRO gigante cuyas páginas son hojas de árbol que susurran al viento.",
    reloj: "En el Sendero, un RELOJ cucú gigante cuelga de una rama disparando pájaros de madera que cantan la hora.",
    guitarra: "Una GUITARRA de madera está enterrada en el Sendero y de su mástil brotan hermosas rosas rojas.",
    sombrero: "Un SOMBRERO de paja gigante flota sobre el Sendero regando confeti brillante a los caminantes.",
    paraguas: "Un PARAGUAS amarillo brillante flota al revés en el aire sobre el Sendero recolectando agua de rocío.",
    vela: "Una VELA gigante de cera verde flota en el Sendero guiando tus pasos con una llama de arcoíris.",
    mapa: "Un MAPA militar gigante flota en el aire sobre el Sendero proyectando rutas holográficas en el suelo.",
    taza: "Una TAZA de chocolate caliente levita sobre el Sendero y dibuja nubes dulces con su aroma.",
  },
  kitchen: {
    llave: "En el Campamento, una LLAVE dorada gigante está asando malvaviscos mágicos sobre una fogata flotante.",
    manzana: "En el Campamento, una MANZANA gigante de color rojo brillante baila alrededor de la fogata cantando jazz.",
    libro: "Un LIBRO de recetas de campamento gigante flota sobre el fuego enseñándote a cocinar platos espaciales.",
    reloj: "En el Campamento, un RELOJ de Dalí gotea chocolate caliente directamente sobre los malvaviscos de la fogata.",
    guitarra: "Una GUITARRA acústica flota junto a la fogata del Campamento tocando melodías relajantes por sí sola.",
    sombrero: "Un SOMBRERO de explorador hecho de malvavisco se asa en el fuego del Campamento de forma divertida.",
    paraguas: "Un PARAGUAS azul flota sobre las tiendas del Campamento protegiéndolas de una tormenta de confeti.",
    vela: "Una VELA gigante flota sobre el Campamento sirviendo de faro nocturno con una llama de fuego azul.",
    mapa: "Un MAPA estelar sirve de lona en el Campamento y las constelaciones brillan al caer la noche.",
    taza: "Una TAZA de té gigante flota en el Campamento albergando una fuente interminable de malvaviscos saltarines.",
  },
  living: {
    llave: "En El Claro del bosque, una LLAVE dorada gigante juega béisbol contra los árboles usando una rama.",
    manzana: "En El Claro, una MANZANA gigante de color verde neón hace malabares con nueces frente a las ardillas.",
    libro: "En El Claro, un LIBRO de cuentos de hadas gigante se abre y de él brotan mariposas de luz multicolor.",
    reloj: "En El Claro, un RELOJ de sol gigante está hecho de flores silvestres que se abren secuencialmente.",
    guitarra: "Una GUITARRA de rock de neón flota en El Claro proyectando luces de colores sobre el césped.",
    sombrero: "Un SOMBRERO de copa flota sobre El Claro y de él salen palomas de luz que vuelan en círculos.",
    paraguas: "Un PARAGUAS multicolor flota en El Claro sirviendo de carrusel giratorio para pequeños duendes.",
    vela: "Una VELA flotante ilumina El Claro con una llama dorada que atrae luciérnagas luminosas.",
    mapa: "Un MAPA topográfico gigante está grabado en la hierba de El Claro mostrando caminos secretos.",
    taza: "Una TAZA de té gigante flota en El Claro sirviendo de fuente para que beban los ciervos del bosque.",
  },
  bedroom: {
    llave: "En la Cabaña, una LLAVE dorada gigante duerme tapada en la cama de troncos roncando ruidosamente.",
    manzana: "En la Cabaña, una MANZANA gigante con pijama salta en la cama de troncos arrojando hojas secas.",
    libro: "En la Cabaña, un LIBRO gigante cubierto de musgo te susurra cuentos al oído en una mecedora.",
    reloj: "En la Cabaña, un RELOJ de Dalí derretido gotea chocolate de menta sobre la alfombra de piel de oso.",
    guitarra: "Una GUITARRA acústica flota sobre la chimenea de la Cabaña tocando una dulce nana por sí sola.",
    sombrero: "Un SOMBRERO vaquero flota sobre la cama de la Cabaña haciendo levitar las sábanas de forma graciosa.",
    paraguas: "Un PARAGUAS rosa flota bajo el techo de madera de la Cabaña protegiéndote de goteras de purpurina.",
    vela: "Una VELA del tamaño de un poste flota junto a la chimenea de la Cabaña ardiendo con una llama dorada.",
    mapa: "Un MAPA de constelaciones se proyecta en el techo de la Cabaña permitiéndote ver las estrellas durmiendo.",
    taza: "Una TAZA de leche tibia gigante flota en la mesa de la Cabaña con una galleta dulce flotando dentro.",
  },
  office: {
    llave: "En el Mirador, una LLAVE dorada escribe en una libreta de notas usando su punta metálica a toda velocidad.",
    manzana: "En el Mirador, una MANZANA de cristal brillante sirve de pisapapeles para un telescopio astronómico.",
    libro: "En el Mirador, un LIBRO de astronomía flota señalando con luces las constelaciones reales en el cielo.",
    reloj: "En el Mirador, un RELOJ de arena gigante sirve de asiento giratorio para observar las estrellas.",
    guitarra: "Una GUITARRA eléctrica rosa toca solos en el Mirador mientras el telescopio aplaude solo.",
    sombrero: "Un SOMBRERO pirata flota sobre el telescopio del Mirador saludando a las nubes de forma absurda.",
    paraguas: "Un PARAGUAS negro flota sobre el Mirador para proteger la bitácora de una lluvia de estrellas fugaces.",
    vela: "Una VELA flotante se enciende sobre tu cabeza en el Mirador cuando descubres una nueva galaxia.",
    mapa: "Un MAPA estelar gigante flota en el Mirador proyectando constelaciones tridimensionales que giran despacio.",
    taza: "Una TAZA de café gigante flota en el Mirador con un telescopio de espuma dibujado en su superficie.",
  },
};
