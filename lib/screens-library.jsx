// Library v2 — pre-loaded catalog + add-text + reading-mode picker

function LibraryScreen({ onNav, theme, onLaunchReading }) {
  const primary = theme?.primary || '#22C55E';
  const db = useDB();
  const [tab, setTab] = React.useState('mine');
  const [search, setSearch] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [picker, setPicker] = React.useState(null); // book selected for mode picker

  const myBooks = db.library.list();
  const catalog = CATALOG;

  const list = (tab === 'mine' ? myBooks : catalog).filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || (b.author || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF9', overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 14px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Tu colección</div>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: '#111827', margin: '2px 0 0', letterSpacing: -0.3 }}>Biblioteca</h1>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setAdding(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
            <GIcon name="plus" size={36} accent={primary} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 14, padding: '8px 12px' }}>
          <GIcon name="search" size={22} accent="#6B7280" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar título o autor..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Lexend', fontSize: 14, color: '#111827' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {[
            { id: 'mine', label: 'Mis libros', count: myBooks.length },
            { id: 'catalog', label: 'Catálogo', count: catalog.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 14px', border: 'none',
              background: tab === t.id ? '#111827' : '#F3F4F6',
              color: tab === t.id ? '#fff' : '#6B7280',
              fontFamily: 'Nunito', fontSize: 12, fontWeight: 800,
              borderRadius: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{t.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{t.count}</span></button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 140px' }}>
        {/* Continue reading (only on Mine) */}
        {tab === 'mine' && myBooks.find(b => b.progress > 0 && b.progress < 1) && (() => {
          const cont = myBooks.filter(b => b.progress > 0 && b.progress < 1).sort((a, b) => (b.last_read_at || 0) - (a.last_read_at || 0))[0];
          return (
            <div onClick={() => setPicker(cont)} style={{
              background: `linear-gradient(135deg, ${cont.cover_color}, ${darkHex(cont.cover_color, 0.15)})`,
              borderRadius: 22, padding: 16,
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
              boxShadow: `0 8px 24px ${cont.cover_color}30`, cursor: 'pointer',
            }}>
              <div style={{ width: 64, height: 84, background: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'column', padding: 8, gap: 3 }}>
                <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2 }} />
                <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, width: '70%' }} />
                <div style={{ flex: 1 }} />
                <div style={{ height: 3, background: '#E5E7EB', borderRadius: 1.5 }} />
                <div style={{ height: 3, background: '#E5E7EB', borderRadius: 1.5, width: '80%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
                <div style={{ fontFamily: 'Nunito', fontSize: 10, fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Seguir leyendo</div>
                <div style={{ fontFamily: 'Nunito', fontSize: 16, fontWeight: 900, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cont.title}</div>
                <div style={{ fontFamily: 'Lexend', fontSize: 11, opacity: 0.85, marginTop: 2 }}>{Math.round(cont.progress * 100)}% completado</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cont.progress * 100}%`, background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
              <GIcon name="play" size={44} accent="#fff" dark />
            </div>
          );
        })()}

        {list.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontFamily: 'Lexend', fontSize: 13 }}>
            {tab === 'mine' ? 'Aún no agregaste libros. Toca + para empezar.' : 'Sin resultados'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {list.map(b => (
            <BookCard key={b.id} book={b} onTap={() => setPicker(b)} />
          ))}
        </div>
      </div>

      {adding && <AddBookSheet onClose={() => setAdding(false)} onAdd={(item) => { db.library.insert(item); setAdding(false); setTab('mine'); }} accent={primary} />}
      {picker && <ReadingModePicker book={picker} onClose={() => setPicker(null)} onPick={(mode) => { setPicker(null); onLaunchReading?.({ book: picker, mode }); }} accent={primary} />}

      <GlassNavbar current="library" onNav={onNav} accent={primary} />
    </div>
  );
}

function BookCard({ book, onTap }) {
  const c = book.cover_color || '#22C55E';
  const isFinished = book.progress >= 1;
  return (
    <div onClick={onTap} style={{ background: '#fff', borderRadius: 18, padding: 12, border: '1px solid #F3F4F6', cursor: 'pointer' }}>
      <div style={{
        aspectRatio: '3 / 4', borderRadius: 12,
        background: `linear-gradient(140deg, ${c}, ${darkHex(c, 0.2)})`,
        display: 'flex', alignItems: 'flex-end', padding: 10,
        position: 'relative', overflow: 'hidden', marginBottom: 10,
      }}>
        {isFinished && <div style={{ position: 'absolute', top: 8, right: 8 }}><GIcon name="check" size={22} accent="#fff" dark /></div>}
        <div style={{ color: '#fff', fontFamily: 'Nunito', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.85 }}>
          {book.kind === 'text' ? 'TEXTO' : 'LIBRO'}
        </div>
        {book.progress > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.25)' }}>
            <div style={{ height: '100%', width: `${book.progress * 100}%`, background: '#fff' }} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 32 }}>{book.title}</div>
      <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author || '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: 'Nunito', fontSize: 10, color: '#6B7280', fontWeight: 700 }}>
        <GIcon name="book" size={14} accent={c} />
        <span>{(book.words / 1000).toFixed(0)}k pal</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontWeight: 900, color: c }}>{Math.round((book.progress || 0) * 100)}%</span>
      </div>
    </div>
  );
}

function ReadingModePicker({ book, onClose, onPick, accent }) {
  const modes = [
    { k: 'rsvp', icon: 'gauge', title: 'RSVP', desc: 'Una palabra a la vez', color: '#F97316' },
    { k: 'guide', icon: 'eye', title: 'Guía visual', desc: 'Highlight que avanza', color: '#3B82F6' },
    { k: 'chunk', icon: 'brain', title: 'Chunks', desc: 'Grupos de 2-3 palabras', color: '#8B5CF6' },
    { k: 'free', icon: 'book', title: 'Libre', desc: 'Lectura normal cronometrada', color: '#22C55E' },
  ];
  return (
    <Sheet onClose={onClose} title="Elegir modo">
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 50, height: 66, borderRadius: 8, background: `linear-gradient(140deg, ${book.cover_color}, ${darkHex(book.cover_color, 0.2)})` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
            <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#6B7280', marginTop: 2 }}>{book.author}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modes.map(m => (
          <button key={m.k} onClick={() => onPick(m.k)} style={{
            padding: 14, background: '#fff', border: '1.5px solid #F3F4F6', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
          }}>
            <GIcon name={m.icon} size={36} accent={m.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 900, color: '#111827' }}>{m.title}</div>
              <div style={{ fontFamily: 'Lexend', fontSize: 11, color: '#6B7280', marginTop: 1 }}>{m.desc}</div>
            </div>
            <span style={{ color: '#D1D5DB', fontSize: 22 }}>›</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function AddBookSheet({ onClose, onAdd, accent }) {
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [content, setContent] = React.useState('');
  const colors = ['#22C55E', '#3B82F6', '#F97316', '#8B5CF6', '#EAB308', '#EC4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const valid = title.trim() && content.trim().length > 50;
  const submit = () => {
    if (!valid) return;
    onAdd({
      kind: 'text',
      title: title.trim(),
      author: author.trim() || 'Texto personal',
      words: content.trim().split(/\s+/).length,
      content: content.trim(),
      cover_color: color,
    });
  };

  return (
    <Sheet onClose={onClose} title="Agregar texto">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={inputStyle} />
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Autor (opcional)" style={inputStyle} />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Pega aquí el texto que quieres practicar..." rows={6} style={{ ...inputStyle, fontFamily: 'Lexend', resize: 'vertical', minHeight: 120 }} />
        <div style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>
          {content.trim() ? content.trim().split(/\s+/).length : 0} palabras
        </div>
        <button onClick={submit} disabled={!valid} style={{
          marginTop: 8, padding: 14, background: valid ? accent : '#E5E7EB', color: '#fff', border: 'none',
          borderRadius: 12, fontFamily: 'Nunito', fontSize: 14, fontWeight: 900,
          cursor: valid ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Agregar a mi biblioteca</button>
      </div>
    </Sheet>
  );
}

function Sheet({ onClose, title, children }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200, animation: 'fadeSlide 200ms',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#FAFAF9', borderRadius: '24px 24px 0 0',
        padding: '12px 20px 28px', maxHeight: '88%', overflowY: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Nunito', fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#F3F4F6', borderRadius: 10, padding: '6px 10px', fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#6B7280', cursor: 'pointer' }}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12,
  fontFamily: 'Nunito', fontSize: 13, fontWeight: 700, color: '#111827',
  outline: 'none', background: '#fff',
};

const CATALOG = [
  {
    id: 'c1', kind: 'text', title: 'El cerebro lector',
    author: 'Stanislas Dehaene · ensayo',
    cover_color: '#3B82F6', progress: 0,
    content: 'Leer no es una habilidad natural del cerebro humano. A diferencia del habla, que emerge de manera espontánea en los niños, la lectura requiere reconvertir áreas cerebrales originalmente destinadas al reconocimiento facial y de objetos. Este proceso, llamado reciclaje neuronal, explica por qué aprender a leer toma años y por qué nunca dos cerebros leen exactamente igual. Los lectores experimentados procesan palabras completas como unidades visuales, no letra por letra. Lo hacen gracias a una pequeña región situada en el cortex occipitotemporal izquierdo, bautizada como la caja de letras del cerebro. Esta zona se activa en milisegundos cuando se reconoce una palabra escrita, mucho antes de que el resto del cerebro pueda traducirla a sonido. La velocidad de lectura, por tanto, no depende de mover los ojos más rápido sino de fortalecer ese reconocimiento visual directo. Cuando leemos a 200 palabras por minuto seguimos haciendo dos cosas a la vez: identificar las formas y traducirlas al lenguaje. Con entrenamiento, el lector experto pasa más tiempo identificando y menos traduciendo. Por eso entrenamientos como las tablas Schulte y la lectura focal funcionan: amplían el campo visual útil y reducen las pausas, las regresiones y la subvocalización innecesaria. El resultado no es solo leer más rápido, sino leer con menos esfuerzo y comprender más.', words: 212, },
  {
    id: 'c2', kind: 'text', title: 'La atención como recurso',
    author: 'Investigación 2024 · ensayo',
    cover_color: '#8B5CF6', progress: 0,
    content: 'La atención humana es un recurso limitado, no infinito. Cuando intentamos hacer múltiples tareas a la vez, lo que realmente ocurre es un cambio rápido entre ellas, no un procesamiento simultáneo. Cada cambio cuesta energía mental y deja un residuo de información que reduce el rendimiento en la siguiente tarea. Los estudios muestran que la multitarea puede reducir la productividad efectiva hasta en un cuarenta por ciento. La concentración profunda, en cambio, permite que el cerebro entre en estados de flujo donde el aprendizaje y la creatividad florecen. En el flujo, la corteza prefrontal reduce su actividad de auto-monitoreo, lo que paradójicamente nos hace sentir menos cansados pese a estar trabajando con intensidad. Para entrenar este músculo cognitivo se requieren bloques de tiempo sin interrupciones, donde la mente pueda sostener la atención en un solo objeto durante períodos prolongados. Las notificaciones, las pestañas abiertas y los pensamientos intrusivos son los enemigos del foco. Las técnicas más efectivas son sorprendentemente simples: trabajar en sesiones de veinticinco a cincuenta minutos, eliminar señales visuales que invitan a la distracción, y entrenar la vuelta consciente al objeto cuando la mente se va. La atención no es una habilidad fija: es un músculo, y como todo músculo, responde al entrenamiento progresivo.', words: 206, },
  {
    id: 'c3', kind: 'text', title: 'Memoria de trabajo',
    author: 'Neurociencia aplicada',
    cover_color: '#22C55E', progress: 0,
    content: 'La memoria de trabajo es ese espacio mental donde manipulamos información durante unos pocos segundos: el número de teléfono que repetimos mientras lo marcamos, la frase que mantenemos viva mientras buscamos la siguiente palabra. Su capacidad clásica se describió como siete elementos más o menos dos, aunque investigaciones recientes sugieren que el límite efectivo está más cerca de cuatro unidades de información simultáneas. La buena noticia es que esas unidades se pueden agrandar. Un experto en ajedrez no recuerda piezas individuales sino patrones completos. Un lector experimentado no almacena letras sino frases enteras. Este proceso de agrupar elementos en bloques más grandes se llama chunking, y es el secreto por el cual algunos parecen tener una memoria superior. Entrenar la memoria de trabajo no significa repetir series interminables de números. Significa construir representaciones cada vez más densas: ideas con asociaciones, palabras con imágenes, datos con historias. Cada vez que asocias algo nuevo con algo conocido, multiplicas la cantidad de información que tu mente puede sostener al mismo tiempo. El método loci, los mapas mentales y las narrativas son herramientas que aprovechan exactamente este principio. La memoria no se trabaja con esfuerzo bruto, se trabaja con estructura.', words: 196, },
  {
    id: 'c4', kind: 'text', title: 'Hábitos pequeños',
    author: 'Productividad esencial',
    cover_color: '#F97316', progress: 0,
    content: 'Un cambio del uno por ciento al día no parece mucho, pero acumulado durante un año equivale a ser casi treinta y ocho veces mejor. Los hábitos son el interés compuesto de la mejora personal. La clave no está en metas grandes sino en sistemas pequeños y repetibles. Tu identidad emerge de lo que haces cada día, no de lo que dices que harás. El cerebro aprende un hábito en tres pasos: una señal que lo dispara, una rutina que ejecuta, y una recompensa que lo refuerza. Si quieres instalar un nuevo hábito, diseña esos tres elementos con cuidado: pon la señal donde no puedas ignorarla, simplifica la rutina al punto de que sea casi vergonzoso no hacerla, y asegúrate de cerrar con una sensación de logro inmediato. Si quieres romper un hábito viejo, ataca la misma estructura por el lado contrario: oculta la señal, eleva la fricción de la rutina, y disuelve la recompensa con una nueva interpretación. Los hábitos no se cambian a fuerza de voluntad, se cambian rediseñando el entorno y la identidad que los sostiene. Cuando alguien deja de fumar diciendo no fumo, no estoy intentando dejarlo, el cambio ya empezó.', words: 195, },
  {
    id: 'c5', kind: 'text', title: 'Dormir para aprender',
    author: 'Sleep Research Today',
    cover_color: '#EAB308', progress: 0,
    content: 'Durante el sueño profundo, el cerebro consolida lo aprendido durante el día. Las conexiones neuronales débiles se podan y las relevantes se fortalecen. Sin sueño suficiente, la memoria a largo plazo no se forma adecuadamente y la atención del día siguiente se desploma. Estudiar toda la noche es contraproducente: pierdes precisamente la fase en que el conocimiento se cristaliza. Las dos fases más importantes son el sueño de ondas lentas, que consolida la memoria declarativa, y el sueño REM, que integra emociones y aprendizajes procedimentales. Una siesta corta de veinte minutos también ayuda, especialmente entre dos sesiones de práctica difícil. La calidad importa más que la cantidad bruta. Un sueño con interrupciones frecuentes nunca llega a las fases profundas y deja al cerebro tan cansado como si hubiera dormido la mitad. Para mejorarlo, los mejores hábitos son consistentes: misma hora de acostarse, mínima exposición a pantallas en la última hora, temperatura ambiente fresca, y una rutina previa que avise al cuerpo que es momento de cerrar.', words: 166, },
  {
    id: 'c6', kind: 'text', title: 'El método Pomodoro',
    author: 'Productividad esencial',
    cover_color: '#EC4899', progress: 0,
    content: 'El método pomodoro divide el trabajo en bloques cortos de veinticinco minutos seguidos de cinco minutos de descanso. Aunque parece una técnica trivial, su eficacia se basa en tres principios sólidos de neurociencia. Primero, la atención sostenida tiene un costo real y se beneficia de pausas regulares antes de que aparezca la fatiga cognitiva. Segundo, el límite temporal corto reduce la procrastinación: empezar siempre es más fácil si sabes que pronto podrás parar. Y tercero, la pausa breve permite que el cerebro consolide en background lo que acaba de procesar. La trampa más común es alargar el bloque pensando que rendir más tiempo es rendir mejor. No lo es. Después de cuatro pomodoros se recomienda una pausa larga de quince a treinta minutos para que el sistema atencional descargue por completo. La técnica también es útil porque convierte el tiempo en una unidad concreta: en lugar de pensar voy a estudiar toda la tarde, piensas voy a hacer tres pomodoros sobre este tema. Esa precisión convierte intenciones vagas en compromisos manejables.', words: 171, },
  {
    id: 'c7', kind: 'text', title: 'Lectura activa',
    author: 'Adler · adaptación',
    cover_color: '#111827', progress: 0,
    content: 'Leer activamente significa convertir la lectura en un diálogo con el texto en lugar de una recepción pasiva de palabras. El lector activo hace preguntas mientras lee, predice lo que va a pasar, contrasta con lo que ya sabe, y al terminar es capaz de reconstruir el argumento principal sin volver atrás. Los buenos lectores no leen todo al mismo ritmo. Aceleran por los párrafos descriptivos o conocidos y se detienen en los puntos de mayor densidad conceptual. Subrayan ideas clave, anotan al margen, escriben resúmenes breves al final de cada capítulo. Estos rituales no son adornos: son la diferencia entre haber pasado los ojos por una página y haber pensado realmente sobre ella. Para entrenarse en lectura activa basta con tres preguntas después de cada sección: cuál es la idea central, qué evidencias la sostienen, y en qué se conecta con algo que ya conozco. Esas tres preguntas, repetidas durante semanas, transforman al lector pasivo en un pensador entrenado.', words: 160, },
  {
    id: 'c8', kind: 'text', title: 'Velocidad y comprensión',
    author: 'Lector App · método',
    cover_color: '#06B6D4', progress: 0,
    content: 'Existe un mito común sobre la lectura rápida: que leer más rápido implica entender menos. La evidencia es más matizada. Para textos sencillos y conocidos, un lector entrenado puede alcanzar quinientas o seiscientas palabras por minuto sin perder comprensión. Para textos densos o nuevos, sin embargo, el techo natural está alrededor de las trescientas cincuenta. Lo importante no es buscar siempre la velocidad máxima sino aprender a regular el ritmo según el tipo de texto. Una novela ligera y un artículo técnico no se leen igual. La técnica focal entrena precisamente esa capacidad. Al fijar la vista en un único punto y dejar que las palabras pasen, el cerebro se ve forzado a procesarlas sin regresar, sin subvocalizar, sin perderse en distracciones. Después de varias sesiones, esa disciplina se traslada a la lectura libre, donde el lector mantiene un ritmo alto pero ajustable. La meta no es ser el lector más rápido del mundo, sino tener el control consciente de tu velocidad y de tu comprensión.', words: 166, },
  {
    id: 'c9', kind: 'text', title: 'Neuroplasticidad',
    author: 'Neurociencia aplicada',
    cover_color: '#10B981', progress: 0,
    content: 'Durante décadas se creyó que el cerebro adulto era una estructura fija, incapaz de cambiar después de cierta edad. Hoy sabemos que esa imagen es falsa. El cerebro adulto reorganiza sus conexiones cada vez que aprende algo nuevo, recupera funciones tras una lesión, o cambia de hábitos. A este fenómeno se le llama neuroplasticidad, y aunque es más intensa en la infancia, nunca se apaga del todo. La plasticidad funciona mejor bajo tres condiciones: atención plena durante la práctica, repetición distribuida en el tiempo y dificultad ligeramente por encima del nivel actual. Practicar sin atención no produce cambios. Practicar mucho en un solo día sin descanso tampoco. Practicar siempre lo mismo y al mismo nivel detiene la mejora. El entrenamiento eficaz es como el ejercicio físico: corto, frecuente, progresivo. Diez minutos diarios bien diseñados son más eficaces que una hora una vez por semana. Por eso una aplicación que entrena tu cerebro funciona mejor cuando aparece todos los días con sesiones cortas que cuando te ofrece maratones esporádicos.', words: 168, },
  {
    id: 'c10', kind: 'text', title: 'Subvocalización',
    author: 'Lector App · método',
    cover_color: '#DC2626', progress: 0,
    content: 'La subvocalización es esa voz interior que pronuncia silenciosamente cada palabra cuando leemos. Aprendimos a leer en voz alta, y la voz interior es lo que quedó cuando aprendimos a hacerlo en silencio. Para velocidades de lectura normales no es un problema: ayuda a procesar el ritmo y la entonación del texto. Pero cuando intentamos leer a más de trescientas cincuenta palabras por minuto, la subvocalización se convierte en un freno: ningún hablante puede pronunciar mentalmente tantas palabras por minuto. Reducirla no significa eliminarla por completo, sino soltar la dependencia. Los ejercicios focales entrenan al cerebro a saltarse el paso de la pronunciación interna y a pasar directamente del símbolo escrito al significado. Es un cambio difícil al principio, porque rompe el modo de leer aprendido durante años. Pero con práctica regular, el lector empieza a percibir frases enteras como unidades de sentido y la velocidad sube sin que la comprensión baje.', words: 152, },
];

function darkHex(hex, amt = 0.2) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amt)));
  g = Math.max(0, Math.floor(g * (1 - amt)));
  b = Math.max(0, Math.floor(b * (1 - amt)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

Object.assign(window, { LibraryScreen, BookCard, ReadingModePicker, AddBookSheet, Sheet, CATALOG, darkHex });
