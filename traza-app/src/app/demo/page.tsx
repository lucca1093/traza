import Link from 'next/link'

const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'

// Íconos SVG en estilo app (sin emojis)
function IconoBriefcase() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12" />
      <path d="M2 12h20" />
    </svg>
  )
}

function IconoUser() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconoBarChart() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

const ROLES = [
  {
    tipo: 'profesional',
    icono: <IconoBriefcase />,
    titulo: 'Profesional independiente',
    subtitulo: 'Freelancer, consultor o profesional sin empresa fija',
    puntos: [
      'Registrás objetivos de tus proyectos con evidencia',
      'Conseguís validaciones de clientes y colegas',
      'Tu historial verificado es portátil y siempre tuyo',
    ],
    persona: 'Nicolás Romero — Consultor de Marketing',
    score: 82,
    badge: 'Élite',
  },
  {
    tipo: 'empleado',
    icono: <IconoUser />,
    titulo: 'Empleado en empresa',
    subtitulo: 'Trabajás en relación de dependencia con un manager',
    puntos: [
      'Registrás objetivos y avances semanales',
      'Tu manager valida lo que completás',
      'Construís historial para toda tu carrera',
    ],
    persona: 'Martín Aguirre — Analista de Datos',
    score: 70,
    badge: 'Avanzado',
  },
  {
    tipo: 'manager',
    icono: <IconoBarChart />,
    titulo: 'Manager / Empresa',
    subtitulo: 'Gestionás un equipo y evaluás desempeño',
    puntos: [
      'Ves métricas del equipo en tiempo real',
      'Validás objetivos y generás evaluaciones formales',
      'Detectás señales de riesgo automáticamente',
    ],
    persona: 'Diego Sánchez — Director de RRHH',
    score: null,
    badge: null,
  },
]

export default function DemoPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: BRAND }}>TRAZA</span>
        </div>
        <h1
          className="text-2xl font-bold text-center"
          style={{ fontFamily: DISPLAY, color: '#0F172A', marginBottom: 8 }}
        >
          ¿Cómo querés explorar TRAZA?
        </h1>
        <p className="text-center text-sm" style={{ color: '#64748B', maxWidth: 440 }}>
          Elegí el perfil que más se parezca al tuyo. Vas a entrar directo al demo con datos reales y una guía interactiva.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {ROLES.map((r) => (
          <Link
            key={r.tipo}
            href={`/demo/${r.tipo}`}
            className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textDecoration: 'none',
            }}
          >
            {/* Card header */}
            <div
              className="px-6 py-5"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: LIGHT }}
              >
                {r.icono}
              </div>
              <h2
                className="text-base font-bold mb-1"
                style={{ fontFamily: DISPLAY, color: '#0F172A' }}
              >
                {r.titulo}
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>{r.subtitulo}</p>
            </div>

            {/* Puntos */}
            <div className="px-6 py-5">
              <ul className="space-y-2.5">
                {r.puntos.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: LIGHT }}
                    >
                      <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </div>
                    <span className="text-sm" style={{ color: '#334155' }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer: persona demo */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: '#0F172A' }}>{r.persona}</p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Ver demo como este perfil</p>
              </div>
              {r.score && (
                <div className="text-right">
                  <p style={{ fontSize: 22, fontWeight: 900, color: PRIMARY, lineHeight: 1 }}>{r.score}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{r.badge}</p>
                </div>
              )}
              {!r.score && (
                <div
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: LIGHT, color: PRIMARY }}
                >
                  Equipo
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              className="px-6 py-4 flex items-center justify-center gap-2 font-bold text-sm"
              style={{ backgroundColor: PRIMARY, color: '#fff' }}
            >
              Entrar al demo
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Note */}
      <p className="mt-10 text-xs text-center" style={{ color: '#94A3B8', maxWidth: 400 }}>
        El demo usa datos ficticios pre-cargados. No necesitás crear cuenta. Podés explorar todo libremente.
      </p>
    </div>
  )
}
