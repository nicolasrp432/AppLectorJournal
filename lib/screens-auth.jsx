// Auth screens: Welcome, Login, Register

function WelcomeScreen({ onNav }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '60px 28px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* decorative dots */}
      <div style={{ position: 'absolute', top: 80, right: -40, width: 180, height: 180, borderRadius: '50%', background: '#DCFCE7', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 40, left: -30, width: 80, height: 80, borderRadius: '50%', background: '#DBEAFE', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 280, right: 40, width: 40, height: 40, borderRadius: '50%', background: '#FEF3C7', zIndex: 0 }} />

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', zIndex: 2 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: 'Nunito' }}>L</div>
        <span style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, color: '#111827' }}>Lector</span>
      </div>

      {/* Hero characters */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2, position: 'relative' }}>
        <div style={{ position: 'relative', width: 280, height: 220 }}>
          <div style={{ position: 'absolute', left: 90, top: 40 }}><Focus size={130} /></div>
          <div style={{ position: 'absolute', left: 0, top: 90, animationDelay: '0.5s' }}><Calm size={90} /></div>
          <div style={{ position: 'absolute', right: 0, top: 80, animationDelay: '1s' }}><Joy size={95} /></div>
          <div style={{ position: 'absolute', left: 40, top: 150, animationDelay: '1.5s' }}><Swift size={80} /></div>
        </div>

        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 32, lineHeight: 1.1, color: '#111827', textAlign: 'center', margin: '16px 0 8px', letterSpacing: -0.5 }}>
          Entrena tu<br/>mente leyendo
        </h1>
        <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: 15, lineHeight: 1.5, color: '#6B7280', textAlign: 'center', maxWidth: 280, margin: 0 }}>
          Un viaje divertido para leer más rápido, recordar más y concentrarte mejor.
        </p>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, zIndex: 2 }}>
        <PushButton color="#22C55E" onClick={() => onNav('login')}>Empezar</PushButton>
        <OutlineButton color="#E5E7EB" textColor="#6B7280" onClick={() => onNav('login')}>Ya tengo cuenta</OutlineButton>
      </div>
    </div>
  );
}

function LoginScreen({ onNav }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '56px 28px 32px', overflowY: 'auto' }}>
      <button onClick={() => onNav('welcome')} style={{ border: 'none', background: '#F3F4F6', width: 40, height: 40, borderRadius: 12, fontSize: 18, cursor: 'pointer', marginBottom: 24 }}>←</button>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Focus size={100} />
      </div>
      <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 26, color: '#111827', textAlign: 'center', margin: '8px 0 4px' }}>¡Bienvenido de vuelta!</h1>
      <p style={{ fontFamily: 'Lexend', fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 28px' }}>Focus te estaba esperando.</p>

      <TextField label="Correo" value={email} onChange={setEmail} placeholder="tu@email.com" />
      <div style={{ height: 14 }} />
      <TextField label="Contraseña" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

      <div style={{ textAlign: 'right', margin: '10px 0 22px' }}>
        <a style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 800, color: '#22C55E', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
      </div>

      <PushButton color="#22C55E" onClick={() => onNav('path')}>Entrar</PushButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        <span style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>o continúa con</span>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <OutlineButton color="#E5E7EB" textColor="#374151" onClick={() => onNav('path')}>
          <span style={{ marginRight: 6 }}>G</span>Google
        </OutlineButton>
        <OutlineButton color="#E5E7EB" textColor="#374151" onClick={() => onNav('path')}>
          👤 Invitado
        </OutlineButton>
      </div>

      <p style={{ textAlign: 'center', fontFamily: 'Lexend', fontSize: 13, color: '#6B7280', marginTop: 24 }}>
        ¿Sin cuenta? <span style={{ color: '#22C55E', fontWeight: 800, cursor: 'pointer' }} onClick={() => onNav('register')}>Regístrate gratis</span>
      </p>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div>
      <label style={{ fontFamily: 'Nunito', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: 15,
          fontFamily: 'Lexend',
          border: `2px solid ${focused ? '#22C55E' : '#E5E7EB'}`,
          borderRadius: 14,
          outline: 'none',
          background: '#fff',
          color: '#111827',
          boxSizing: 'border-box',
          transition: 'border-color 120ms',
        }}
      />
    </div>
  );
}

function RegisterScreen({ onNav }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF', padding: '56px 28px 32px', overflowY: 'auto' }}>
      <button onClick={() => onNav('welcome')} style={{ border: 'none', background: '#F3F4F6', width: 40, height: 40, borderRadius: 12, fontSize: 18, cursor: 'pointer', marginBottom: 16 }}>←</button>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Joy size={96} /></div>
      <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 26, color: '#111827', textAlign: 'center', margin: '8px 0 4px' }}>¡Únete al viaje!</h1>
      <p style={{ fontFamily: 'Lexend', fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 28px' }}>Joy te dará tu primer premio.</p>

      <TextField label="Nombre" value="" onChange={()=>{}} placeholder="¿Cómo te llamamos?" />
      <div style={{ height: 14 }} />
      <TextField label="Correo" value="" onChange={()=>{}} placeholder="tu@email.com" />
      <div style={{ height: 14 }} />
      <TextField label="Contraseña" value="" onChange={()=>{}} placeholder="mínimo 8 caracteres" type="password" />
      <div style={{ height: 24 }} />

      <PushButton color="#22C55E" onClick={() => onNav('path')}>Crear mi cuenta</PushButton>

      <p style={{ textAlign: 'center', fontFamily: 'Lexend', fontSize: 13, color: '#6B7280', marginTop: 20 }}>
        ¿Ya tienes cuenta? <span style={{ color: '#22C55E', fontWeight: 800, cursor: 'pointer' }} onClick={() => onNav('login')}>Inicia sesión</span>
      </p>
    </div>
  );
}

Object.assign(window, { WelcomeScreen, LoginScreen, RegisterScreen });
