'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Target, ArrowRight, Shield, Globe,
  BarChart3, Flame, Award, FileCheck, TrendingUp,
  Lock, Users, Building2, ChevronRight, ClipboardList,
  MessageSquare, Calendar, LineChart
} from 'lucide-react'

/* ── Tokens ─────────────────────────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const D       = "'Plus Jakarta Sans', system-ui, sans-serif"  // display
const B       = "'Inter', system-ui, sans-serif"               // body

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
      transition: 'all 0.25s ease',
    }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(51,80,208,0.28)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5h10M8 5v7" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: BRAND, letterSpacing: '-0.4px' }}>
            traza
          </span>
        </a>

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[
            { label: 'Para profesionales', href: '#profesionales' },
            { label: 'Para empresas',      href: '#empresas'      },
            { label: 'Cómo funciona',      href: '#como-funciona' },
          ].map(n => (
            <a key={n.label} href={n.href} style={{
              fontSize: 14, fontWeight: 500, color: '#4B5563',
              textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = PRIMARY)}
            onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
            >{n.label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none',
            padding: '8px 14px', borderRadius: 8, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >Ingresar</Link>
          <Link href="/registro" style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            borderRadius: 10, padding: '9px 20px', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(51,80,208,0.25)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Empezar gratis <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREDENTIAL CARD MOCK
═══════════════════════════════════════════════════════════════════════════ */
function CredentialCard() {
  const r = 28, circ = 2 * Math.PI * r

  return (
    <div style={{
      width: 300, background: 'white', borderRadius: 20,
      boxShadow: '0 28px 72px rgba(28,43,144,0.17), 0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid #E8ECFD', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`, padding: '18px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#BBC5F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5 }}>CREDENCIAL VERIFICADA</p>
            <p style={{ color: 'white', fontSize: 17, fontWeight: 800, fontFamily: D }}>Luciana Ferreyra</p>
            <p style={{ color: '#BBC5F7', fontSize: 13, marginTop: 3 }}>Desarrolladora · 6 años exp.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.13)', borderRadius: 20, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <CheckCircle2 size={10} color="#6EE7B7" />
            <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>Activa</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #F1F5F9' }}>
        <svg width="66" height="66" viewBox="0 0 66 66" style={{ flexShrink: 0 }}>
          <circle cx="33" cy="33" r={r} fill="none" stroke="#EEF2FF" strokeWidth="5" />
          <circle cx="33" cy="33" r={r} fill="none" stroke={PRIMARY} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ * 0.13}
            strokeLinecap="round" transform="rotate(-90 33 33)" />
          <text x="33" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill={BRAND} fontFamily={D}>87</text>
          <text x="33" y="48" textAnchor="middle" fontSize="8" fill="#94A3B8">/100</text>
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: '#94A3B8', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em' }}>ÍNDICE TRAZA</p>
          <div style={{ display: 'flex', gap: 5 }}>
            {[{ v: '24', l: 'objetivos' }, { v: '8', l: 'validaciones' }, { v: '18d', l: 'racha' }].map(s => (
              <div key={s.l} style={{ flex: 1, textAlign: 'center', background: '#F8FAFC', borderRadius: 7, padding: '4px 2px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: D }}>{s.v}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '11px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          'Objetivo validado por TechCorp S.A.',
          'Reconocimiento: Mejor desempeño Q3',
          'Proyecto grupal completado · 5 personas',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle2 size={12} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: '#64748B' }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 18px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'monospace' }}>traza.app/p/LF-8829</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Globe size={9} color="#94A3B8" />
          <span style={{ fontSize: 9.5, color: '#94A3B8' }}>Pública</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, #EEF2FF 0%, #ffffff 50%, #F8FAFC 100%)',
      display: 'flex', alignItems: 'center', paddingTop: 64,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '8%', right: '2%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(51,80,208,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0%', left: '-8%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(28,43,144,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '72px 24px',
        display: 'flex', alignItems: 'center', gap: 72,
        flexWrap: 'wrap', width: '100%',
      }}>
        {/* Copy */}
        <div style={{ flex: '1 1 460px', maxWidth: 580 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#EDEFFD', border: '1px solid #BBC5F7',
            borderRadius: 20, padding: '5px 14px', marginBottom: 28,
          }}>
            <Shield size={12} color={PRIMARY} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: PRIMARY }}>
              Gestión del desempeño · Verificado · Portable
            </span>
          </div>

          <h1 style={{
            fontFamily: D, fontWeight: 900, lineHeight: 1.08,
            fontSize: 'clamp(36px, 5.2vw, 62px)',
            color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 22,
          }}>
            Tu desempeño,{' '}
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              documentado.
            </span>
            <br />Tu crecimiento,{' '}
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              demostrable.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 1.7vw, 18px)', color: '#475569', lineHeight: 1.7, marginBottom: 18, maxWidth: 510 }}>
            Traza es la herramienta de gestión del desempeño que le pertenece al profesional.
            Registrá tus objetivos, conseguí validaciones reales y construí un historial verificado
            que te acompaña toda la carrera.
          </p>

          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 38, maxWidth: 480, fontStyle: 'italic' }}>
            No necesitás que tu empresa lo use. Desde el primer objetivo que cargás, ya estás construyendo algo que te pertenece.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 40 }}>
            <Link href="/registro" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
              color: 'white', fontWeight: 700, fontSize: 15,
              borderRadius: 11, padding: '13px 26px', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(51,80,208,0.28)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(51,80,208,0.36)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(51,80,208,0.28)' }}
            >
              Empezar gratis <ArrowRight size={15} />
            </Link>
            <Link href="/registro/empresa" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              color: PRIMARY, fontWeight: 600, fontSize: 14,
              border: '1.5px solid #BBC5F7', borderRadius: 11,
              padding: '12px 20px', textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EDEFFD')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Building2 size={14} /> Registrar mi empresa
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['Sin tarjeta de crédito', 'Gratis para el profesional', 'Tus datos son tuyos'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ transform: 'rotate(1.5deg)' }}>
            <CredentialCard />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROBLEM STRIP — lo que Traza reemplaza
═══════════════════════════════════════════════════════════════════════════ */
function ProblemStrip() {
  return (
    <section style={{ background: BRAND, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#BBC5F7', letterSpacing: '0.1em', marginBottom: 28 }}>
          TRAZA REEMPLAZA
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {[
            'Planillas de cálculo para objetivos',
            'Feedback por mensajes o correo suelto',
            'Evaluaciones de desempeño subjetivas',
            'Historial laboral sin evidencia',
            'Reuniones sin registro ni acuerdos',
          ].map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '7px 16px',
            }}>
              <span style={{ fontSize: 13, color: '#BBC5F7', textDecoration: 'line-through', textDecorationColor: 'rgba(187,197,247,0.5)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARA PROFESIONALES
═══════════════════════════════════════════════════════════════════════════ */
function ParaProfesionales() {
  const features = [
    {
      icon: <Target size={19} color={PRIMARY} />,
      title: 'Registrá cada objetivo con evidencia',
      desc: 'Documentá lo que hacés, cuándo lo hacés y cómo avanzás. No hay que confiar en la memoria — queda registrado.',
    },
    {
      icon: <Shield size={19} color={PRIMARY} />,
      title: 'Obtené validaciones de terceros',
      desc: 'Tu supervisor o cliente confirma lo que lograste. Esa validación queda en tu historial, verificada y firmada.',
    },
    {
      icon: <Globe size={19} color={PRIMARY} />,
      title: 'Tu historial es portátil',
      desc: 'Cuando cambiás de trabajo, el historial te acompaña. No depende de la empresa donde estabas.',
    },
    {
      icon: <LineChart size={19} color={PRIMARY} />,
      title: 'Medí tu propio crecimiento',
      desc: 'El Índice Traza muestra en un número qué tan sólido es tu desempeño verificado. Autoevaluación más evidencia real.',
    },
  ]

  return (
    <section id="profesionales" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        <div style={{ maxWidth: 640, marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>
            PARA PROFESIONALES
          </p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 18 }}>
            Tu carrera no debería empezar de cero cada vez que cambiás de trabajo.
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7 }}>
            Seas empleado en relación de dependencia, freelancer o trabajador autónomo,
            Traza te da el mismo activo: un historial de desempeño verificado que te pertenece,
            no a la empresa donde trabajás hoy.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#FAFBFF', border: '1px solid #E8ECFD', borderRadius: 16, padding: '26px',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(51,80,208,0.09)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 9, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Diferencia con LinkedIn */}
        <div style={{
          marginTop: 48, padding: '28px 32px',
          background: '#F0F3FF', border: '1px solid #BBC5F7', borderRadius: 16,
          display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 320px' }}>
            <p style={{ fontFamily: D, fontSize: 15, fontWeight: 800, color: BRAND, marginBottom: 8 }}>
              ¿En qué se diferencia de LinkedIn?
            </p>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>
              LinkedIn muestra lo que vos dijiste que hiciste. Traza muestra lo que realmente hiciste,
              con fechas, avances documentados y validaciones de personas reales.
              No es autopercepción. Es evidencia.
            </p>
          </div>
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'LinkedIn', val: 'Historial autodeclarado, sin verificación' },
              { label: 'Traza',    val: 'Historial verificado por supervisores y clientes reales' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#94A3B8' : PRIMARY, minWidth: 60 }}>{r.label}</span>
                <span style={{ fontSize: 13, color: i === 0 ? '#94A3B8' : '#0F172A' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <Link href="/registro" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 14,
            borderRadius: 10, padding: '12px 24px', textDecoration: 'none',
            boxShadow: '0 3px 10px rgba(51,80,208,0.22)',
          }}>
            Crear mi perfil gratis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CÓMO FUNCIONA
═══════════════════════════════════════════════════════════════════════════ */
function ComoFunciona() {
  const steps = [
    { n: '01', icon: <Target size={20} color={PRIMARY} />,     title: 'Creá tu cuenta',         desc: 'En 2 minutos. Sin tarjeta de crédito. Recibís un TRAZA ID único que identifica tu historial.' },
    { n: '02', icon: <ClipboardList size={20} color={PRIMARY}/>,title: 'Cargá tus objetivos',    desc: 'Registrá lo que tenés que lograr, los avances que vas haciendo y la evidencia que lo respalda.' },
    { n: '03', icon: <Shield size={20} color={PRIMARY} />,     title: 'Sumá validaciones',       desc: 'Tu supervisor o cliente recibe un link, revisa tu trabajo y lo valida. Esa confirmación queda en tu historial.' },
    { n: '04', icon: <Globe size={20} color={PRIMARY} />,      title: 'Compartí tu credencial', desc: 'Tu perfil verificado es público y portable. Lo llevás a donde vayas: entrevistas, propuestas, LinkedIn.' },
  ]

  return (
    <section id="como-funciona" style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #F8FAFC, #EEF2FF)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>CÓMO FUNCIONA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            De cero a credencial verificada<br />en menos de una semana.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E8ECFD', borderRadius: 16, padding: '26px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <span style={{ fontFamily: D, fontSize: 34, fontWeight: 900, color: '#EEF2FF', letterSpacing: '-1px' }}>{s.n}</span>
              </div>
              <h3 style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 9 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ÍNDICE TRAZA SPOTLIGHT
═══════════════════════════════════════════════════════════════════════════ */
function IndiceTraza() {
  const r = 50, circ = 2 * Math.PI * r

  return (
    <section style={{
      padding: '96px 24px',
      background: `linear-gradient(135deg, #0F172A 0%, ${BRAND} 55%, #1E3A8A 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-25%', right: '-8%', width: 580, height: 580, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-10%', right: '-3%', width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 72, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
            <circle cx="75" cy="75" r={r} fill="none" stroke="url(#g1)" strokeWidth="9"
              strokeDasharray={circ} strokeDashoffset={circ * 0.13}
              strokeLinecap="round" transform="rotate(-90 75 75)" />
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <text x="75" y="70" textAnchor="middle" fontSize="28" fontWeight="900" fill="white" fontFamily={D}>87</text>
            <text x="75" y="87" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">de 100</text>
          </svg>
          <span style={{ background: 'rgba(110,231,183,0.13)', border: '1px solid rgba(110,231,183,0.28)', color: '#6EE7B7', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '5px 14px' }}>
            Nivel: Destacado
          </span>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#BBC5F7', letterSpacing: '0.09em', marginBottom: 14 }}>EL ÍNDICE TRAZA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 18 }}>
            Un número que habla<br />mejor que cualquier CV.
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
            El Índice Traza es un score de 0 a 100 calculado a partir de objetivos completados,
            validaciones externas, reconocimientos y consistencia en el tiempo.
            No es una autopercepción. Son datos verificados.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <TrendingUp size={14} color="#6EE7B7" />, label: 'Objetivos completados y validados por terceros' },
              { icon: <Award      size={14} color="#6EE7B7" />, label: 'Reconocimientos recibidos del equipo o empresa' },
              { icon: <Flame      size={14} color="#6EE7B7" />, label: 'Racha de consistencia en el tiempo' },
              { icon: <Lock       size={14} color="#6EE7B7" />, label: 'Verificaciones confirmadas por supervisores reales' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(110,231,183,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 14, color: '#CBD5E1' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARA EMPRESAS
═══════════════════════════════════════════════════════════════════════════ */
function ParaEmpresas() {
  const features = [
    { icon: <ClipboardList size={19} color={PRIMARY} />, title: 'Objetivos claros por persona y por equipo', desc: 'Reemplazá las planillas y los chats. Cada colaborador tiene sus objetivos documentados, con fecha y responsable.' },
    { icon: <MessageSquare size={19} color={PRIMARY} />, title: 'Feedback estructurado y trazable',           desc: 'Las evaluaciones dejan de ser conversaciones que se olvidan. Quedan registradas, con evidencia y contexto.' },
    { icon: <Calendar      size={19} color={PRIMARY} />, title: 'Reuniones 1:1 con acuerdos registrados',    desc: 'Cada reunión genera acuerdos documentados. Nada se pierde entre una conversación y la siguiente.' },
    { icon: <BarChart3     size={19} color={PRIMARY} />, title: 'Métricas reales para tomar decisiones',     desc: 'Dashboard de desempeño por persona, por equipo y por período. Información objetiva para decisiones de talento.' },
  ]

  return (
    <section id="empresas" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        <div style={{ maxWidth: 640, marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>PARA EMPRESAS</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 18 }}>
            El desempeño de tu equipo, organizado. Sin planillas, sin mensajes sueltos, sin memoria.
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7 }}>
            Traza reemplaza los procesos informales de gestión del desempeño con un sistema trazable
            que los empleados realmente usan — porque también les sirve a ellos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#FAFBFF', border: '1px solid #E8ECFD', borderRadius: 16, padding: '26px',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(51,80,208,0.09)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 9, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom-up note */}
        <div style={{
          marginTop: 44, padding: '24px 28px',
          background: '#F0F3FF', border: '1px solid #BBC5F7', borderRadius: 14,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <Users size={18} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>
            <strong style={{ color: BRAND }}>Adopción natural, sin fricción.</strong>{' '}
            Tus empleados ya pueden usar Traza de forma independiente. Cuando tu empresa se suma,
            el sistema ya tiene datos reales — no hay que convencer a nadie de usarlo desde cero.
          </p>
        </div>

        <div style={{ marginTop: 36 }}>
          <Link href="/registro/empresa" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 14,
            borderRadius: 10, padding: '12px 24px', textDecoration: 'none',
            boxShadow: '0 3px 10px rgba(51,80,208,0.22)',
          }}>
            Registrar mi empresa <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section style={{ padding: '96px 24px', background: 'linear-gradient(155deg, #EEF2FF, #E8ECFD)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 26px',
          boxShadow: '0 8px 22px rgba(51,80,208,0.24)',
        }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M5 9h16M13 9v9" stroke="white" strokeWidth="2.3" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: D, fontSize: 'clamp(26px, 4.2vw, 46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 18 }}>
          Empezá hoy.<br />Tu historial no puede esperar.
        </h2>
        <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7, marginBottom: 40 }}>
          Cada día que pasa sin registrar es un logro que no queda documentado.
          Creá tu perfil gratis y empezá a construir el historial profesional que te representa.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/registro" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 16,
            borderRadius: 13, padding: '15px 34px', textDecoration: 'none',
            boxShadow: '0 6px 18px rgba(51,80,208,0.28)',
          }}>
            Crear mi cuenta gratis <ArrowRight size={16} />
          </Link>
          <Link href="/registro/empresa" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            color: PRIMARY, fontWeight: 600, fontSize: 15,
            border: '1.5px solid #BBC5F7', borderRadius: 13,
            padding: '14px 26px', textDecoration: 'none', background: 'white',
          }}>
            <Building2 size={15} /> Para empresas
          </Link>
        </div>
        <p style={{ marginTop: 20, fontSize: 12.5, color: '#94A3B8' }}>
          Sin tarjeta de crédito · Gratis para el profesional individual
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: '#0F172A', padding: '52px 24px 28px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 44, marginBottom: 48 }}>
          <div style={{ maxWidth: 270 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M7 4v7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: D, fontSize: 19, fontWeight: 900, color: 'white' }}>traza</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65 }}>
              Gestión del desempeño que le pertenece al profesional.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', marginBottom: 16 }}>PRODUCTO</p>
              {['Para profesionales', 'Para empresas', 'Cómo funciona', 'Credencial pública'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13.5, color: '#64748B', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', marginBottom: 16 }}>EMPRESA</p>
              {['Sobre Traza', 'Privacidad', 'Términos de uso', 'Contacto'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13.5, color: '#64748B', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 22, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12.5, color: '#475569' }}>© 2026 Traza. Todos los derechos reservados.</p>
          <p style={{ fontSize: 12.5, color: '#334155' }}>Construido para los profesionales que toman en serio su carrera.</p>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: B, backgroundColor: 'white', color: '#0F172A' }}>
      <Navbar />
      <Hero />
      <ProblemStrip />
      <ParaProfesionales />
      <ComoFunciona />
      <IndiceTraza />
      <ParaEmpresas />
      <FinalCTA />
      <Footer />
    </div>
  )
}
