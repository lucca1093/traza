'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Target, Building2, Users, ArrowRight,
  Shield, Globe, BarChart3, Flame, Award,
  FileCheck, Zap, TrendingUp, Lock
} from 'lucide-react'

/* ── Tokens ─────────────────────────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"
const BODY    = "'Inter', system-ui, sans-serif"

/* ── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      backgroundColor: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
      transition: 'background 0.25s, border 0.25s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(51,80,208,0.3)',
          }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M3 5h11M8.5 5v7" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 900, color: BRAND, letterSpacing: '-0.5px' }}>
            traza
          </span>
        </a>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Para empleados', href: '#empleados'    },
            { label: 'Para empresas',  href: '#empresas'     },
            { label: 'Cómo funciona',  href: '#como-funciona'},
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              fontSize: 14, fontWeight: 500, color: '#475569',
              textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = PRIMARY)}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{
            fontSize: 14, fontWeight: 500, color: '#475569',
            textDecoration: 'none', padding: '8px 14px', borderRadius: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Ingresar
          </Link>
          <Link href="/registro" style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            borderRadius: 10, padding: '9px 20px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(51,80,208,0.25)',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Empezar gratis →
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Credential card mock ───────────────────────────────────────────────── */
function CredentialCard() {
  const r = 28, circ = 2 * Math.PI * r, score = 87

  return (
    <div style={{
      background: 'white', borderRadius: 22,
      boxShadow: '0 32px 80px rgba(28,43,144,0.18), 0 4px 20px rgba(0,0,0,0.07)',
      overflow: 'hidden', width: 310,
      border: '1px solid #E8ECFD', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`, padding: '18px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#BBC5F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5 }}>
              CREDENCIAL VERIFICADA
            </p>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: DISPLAY, letterSpacing: '-0.3px' }}>
              Luciana Ferreyra
            </p>
            <p style={{ color: '#BBC5F7', fontSize: 13, marginTop: 3 }}>Desarrolladora · 6 años exp.</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.14)',
            borderRadius: 20, padding: '5px 10px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <CheckCircle2 size={11} color="#6EE7B7" />
            <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>Activa</span>
          </div>
        </div>
      </div>

      {/* Score + stats */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #F1F5F9' }}>
        <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
          <circle cx="35" cy="35" r={r} fill="none" stroke="#EEF2FF" strokeWidth="5" />
          <circle cx="35" cy="35" r={r} fill="none"
            stroke={PRIMARY} strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            strokeLinecap="round"
            transform="rotate(-90 35 35)"
          />
          <text x="35" y="39" textAnchor="middle" fontSize="16" fontWeight="900" fill={BRAND} fontFamily={DISPLAY}>{score}</text>
          <text x="35" y="50" textAnchor="middle" fontSize="8" fill="#94A3B8">/100</text>
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>ÍNDICE TRAZA</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ val: '24', label: 'objetivos' }, { val: '8', label: 'validaciones' }, { val: '18d', label: 'racha' }].map(s => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center',
                background: '#F8FAFC', borderRadius: 8, padding: '5px 4px',
                border: '1px solid #F1F5F9',
              }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: DISPLAY }}>{s.val}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validations */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Validado por TechCorp S.A.',
          'Reconocimiento: Mejor desempeño Q3',
          'Objetivo grupal completado · 5 integrantes',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#64748B' }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '9px 20px', background: '#F8FAFC',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>traza.app/p/LF-8829</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Globe size={9} color="#94A3B8" />
          <span style={{ fontSize: 10, color: '#94A3B8' }}>Pública</span>
        </div>
      </div>
    </div>
  )
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F0F3FF 0%, #FFFFFF 55%, #F8FAFC 100%)',
      display: 'flex', alignItems: 'center',
      paddingTop: 64, overflow: 'hidden', position: 'relative',
    }}>
      {/* Blobs decorativos */}
      <div style={{
        position: 'absolute', top: '10%', right: '3%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(51,80,208,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(28,43,144,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 64, flexWrap: 'wrap', width: '100%',
      }}>
        {/* Left: copy */}
        <div style={{ flex: '1 1 480px', maxWidth: 600 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#EDEFFD', border: '1px solid #BBC5F7',
            borderRadius: 20, padding: '6px 14px', marginBottom: 28,
          }}>
            <Shield size={13} color={PRIMARY} />
            <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>
              Historial profesional verificado e independiente
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(38px, 5.5vw, 64px)',
            fontWeight: 900,
            color: '#0F172A',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            Tu carrera,{' '}
            <span style={{
              background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              comprobada
            </span>
            {' '}para siempre.
          </h1>

          {/* Subhead */}
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: '#475569', lineHeight: 1.65,
            marginBottom: 40, maxWidth: 520,
          }}>
            Documentá tus logros, conseguí validaciones reales de clientes y supervisores,
            y llevá tu credencial verificada a donde vayas.{' '}
            <strong style={{ color: '#0F172A' }}>El único historial que es tuyo, no de tu empresa.</strong>
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 48 }}>
            <Link href="/registro" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
              color: 'white', fontWeight: 700, fontSize: 16,
              borderRadius: 12, padding: '14px 28px', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(51,80,208,0.30)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(51,80,208,0.38)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(51,80,208,0.30)' }}
            >
              Empezar gratis <ArrowRight size={16} />
            </Link>
            <Link href="/registro/empresa" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              color: PRIMARY, fontWeight: 600, fontSize: 15,
              textDecoration: 'none', border: '1.5px solid #BBC5F7',
              borderRadius: 12, padding: '13px 22px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EDEFFD')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Building2 size={15} /> Para mi empresa
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {[
              'Sin tarjeta de crédito',
              'Listo en 2 minutos',
              'Tus datos, siempre tuyos',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: credential card */}
        <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -30, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(51,80,208,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -15, left: -15, width: 55, height: 55, borderRadius: '50%', background: 'rgba(51,80,208,0.06)', pointerEvents: 'none' }} />
          <div style={{ transform: 'rotate(2deg)', position: 'relative' }}>
            <CredentialCard />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Stats bar ──────────────────────────────────────────────────────────── */
function StatsBar() {
  return (
    <section style={{ background: BRAND, padding: '36px 24px' }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'flex', justifyContent: 'space-around',
        flexWrap: 'wrap', gap: 28,
      }}>
        {[
          { val: '2 min',  label: 'para crear tu perfil'        },
          { val: '100%',   label: 'de los datos son tuyos'      },
          { val: '3',      label: 'tipos de validación externa'  },
          { val: '∞',      label: 'historial acumulado'         },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>{s.val}</p>
            <p style={{ fontSize: 13, color: '#BBC5F7', fontWeight: 500, marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Dual audience ──────────────────────────────────────────────────────── */
function DualAudience() {
  const [tab, setTab] = useState<'empleado' | 'empresa'>('empleado')

  const content = {
    empleado: [
      { icon: <Target size={20} color={PRIMARY} />,   title: 'Registrá cada logro', desc: 'Cargá objetivos, avances y evidencias. Todo queda documentado con fecha y contexto real.' },
      { icon: <Shield size={20} color={PRIMARY} />,   title: 'Conseguí validaciones reales', desc: 'Tu supervisor, un cliente o un colega confirman lo que lograste. Sin depender de tu empresa.' },
      { icon: <Globe size={20} color={PRIMARY} />,    title: 'Llevalo a donde vayas', desc: 'Tu credencial pública viaja con vos. Nueva empresa, nuevo trabajo, mismo historial verificado.' },
    ],
    empresa: [
      { icon: <Users size={20} color={PRIMARY} />,    title: 'Invitá a tu equipo', desc: 'Onboarding simple: los empleados reciben un link e ingresan en minutos. Sin instalación compleja.' },
      { icon: <BarChart3 size={20} color={PRIMARY} />, title: 'Seguí el progreso con datos', desc: 'Dashboard en tiempo real. Objetivos, cumplimiento, discrepancias y señales del equipo al instante.' },
      { icon: <FileCheck size={20} color={PRIMARY} />, title: 'Decisiones basadas en hechos', desc: 'El Índice Traza elimina la subjetividad en revisiones de desempeño. Datos, no percepciones.' },
    ],
  }

  return (
    <section id="empleados" style={{ padding: '100px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, letterSpacing: '0.08em', marginBottom: 12 }}>UNA PLATAFORMA, DOS MUNDOS</p>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>
            Diseñado para empleados<br />y para las empresas que los cuidan.
          </h2>
          <p style={{ fontSize: 17, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>
            Traza funciona para los dos lados. El empleado construye su historial; la empresa gana visibilidad real.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 14, padding: 5, gap: 4 }}>
            {[
              { key: 'empleado', label: '👤 Soy empleado' },
              { key: 'empresa',  label: '🏢 Soy empresa'  },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as 'empleado' | 'empresa')} style={{
                padding: '10px 28px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? BRAND : '#64748B',
                boxShadow: tab === t.key ? '0 1px 8px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {content[tab].map((f, i) => (
            <div key={i} style={{
              background: '#FAFBFF', border: '1px solid #E8ECFD',
              borderRadius: 18, padding: '28px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(51,80,208,0.10)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.2px' }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href={tab === 'empleado' ? '/registro' : '/registro/empresa'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 15,
            borderRadius: 12, padding: '13px 28px', textDecoration: 'none',
            boxShadow: '0 3px 12px rgba(51,80,208,0.25)',
          }}>
            {tab === 'empleado' ? 'Crear mi perfil gratis' : 'Registrar mi empresa'} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── How it works ───────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', icon: <Zap size={22} color={PRIMARY} />,       title: 'Creá tu cuenta',          desc: 'Registrate en 2 minutos. Sin tarjeta. Recibís tu TRAZA ID único e irrepetible.' },
    { n: '02', icon: <Target size={22} color={PRIMARY} />,    title: 'Cargá tus objetivos',      desc: 'Documentá lo que hacés: objetivos, avances, evidencias. Todo con fecha y contexto.' },
    { n: '03', icon: <Shield size={22} color={PRIMARY} />,    title: 'Conseguí validaciones',    desc: 'Invitá a tu supervisor o cliente a confirmar tu trabajo. Cada validación suma.' },
    { n: '04', icon: <Globe size={22} color={PRIMARY} />,     title: 'Compartí tu credencial',   desc: 'Tu perfil verificado te acompaña toda la carrera. En entrevistas, LinkedIn, donde quieras.' },
  ]

  return (
    <section id="como-funciona" style={{ padding: '100px 24px', background: 'linear-gradient(160deg, #F8FAFC 0%, #F0F3FF 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, letterSpacing: '0.08em', marginBottom: 12 }}>CÓMO FUNCIONA</p>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            De cero a credencial verificada<br />en menos de una semana.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E8ECFD', borderRadius: 18, padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <span style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 900, color: '#EEF2FF', letterSpacing: '-1px' }}>{s.n}</span>
              </div>
              <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.2px' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Índice Traza spotlight ─────────────────────────────────────────────── */
function IndiceTraza() {
  const r = 52, circ = 2 * Math.PI * r

  return (
    <section style={{
      padding: '100px 24px',
      background: `linear-gradient(135deg, #0F172A 0%, ${BRAND} 60%, #1E3A8A 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 380, height: 380, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 72, flexWrap: 'wrap' }}>
        {/* SVG Ring */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="80" cy="80" r={r} fill="none"
              stroke="url(#grad1)" strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={circ * 0.13}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <text x="80" y="75" textAnchor="middle" fontSize="30" fontWeight="900" fill="white" fontFamily={DISPLAY}>87</text>
            <text x="80" y="92" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.45)">de 100</text>
          </svg>
          <span style={{
            background: 'rgba(110,231,183,0.15)', border: '1px solid rgba(110,231,183,0.3)',
            color: '#6EE7B7', fontSize: 12, fontWeight: 700,
            borderRadius: 20, padding: '5px 14px',
          }}>
            Destacado ✦
          </span>
        </div>

        {/* Text */}
        <div style={{ flex: '1 1 400px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#BBC5F7', letterSpacing: '0.08em', marginBottom: 14 }}>EL ÍNDICE TRAZA</p>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
            Un número que habla<br />mejor que cualquier CV.
          </h2>
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
            El Índice Traza es un score de 0 a 100 calculado a partir de tus objetivos completados,
            validaciones externas, reconocimientos y consistencia en el tiempo. No es una opinión. Son datos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <TrendingUp size={15} color="#6EE7B7" />, label: 'Objetivos completados y validados'  },
              { icon: <Award size={15} color="#6EE7B7" />,      label: 'Reconocimientos del equipo'        },
              { icon: <Flame size={15} color="#6EE7B7" />,      label: 'Racha de consistencia'             },
              { icon: <Lock size={15} color="#6EE7B7" />,       label: 'Verificaciones externas confirmadas'},
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(110,231,183,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 15, color: '#CBD5E1', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── For companies ──────────────────────────────────────────────────────── */
function ForCompanies() {
  return (
    <section id="empresas" style={{ padding: '100px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
        {/* Text */}
        <div style={{ flex: '1 1 400px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, letterSpacing: '0.08em', marginBottom: 14 }}>PARA EMPRESAS</p>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
            El desempeño de tu equipo,<br />sin ambigüedad.
          </h2>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
            Traza le da a tu empresa un sistema de gestión de desempeño que los empleados
            realmente usan — porque les sirve a ellos también.
          </p>
          <Link href="/registro/empresa" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 15,
            borderRadius: 12, padding: '13px 28px', textDecoration: 'none',
            boxShadow: '0 3px 12px rgba(51,80,208,0.25)',
          }}>
            Registrar mi empresa <ArrowRight size={15} />
          </Link>
        </div>

        {/* Feature list */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: <BarChart3 size={22} color={PRIMARY} />, title: 'Visibilidad total del equipo', desc: 'Tablero centralizado con objetivos, avances y el Índice Traza de cada colaborador. Sin reuniones de status.' },
            { icon: <FileCheck size={22} color={PRIMARY} />, title: 'Revisiones basadas en evidencia', desc: 'Las evaluaciones de desempeño dejan de ser subjetivas. Cada punto tiene respaldo documentado.' },
            { icon: <Users size={22} color={PRIMARY} />,    title: 'Equipos más motivados', desc: 'Los empleados saben que su trabajo se registra y valida. El reconocimiento se vuelve medible y justo.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', background: '#FAFBFF', border: '1px solid #E8ECFD', borderRadius: 16, padding: '22px' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding: '100px 24px', background: 'linear-gradient(160deg, #F0F3FF 0%, #E8ECFD 100%)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 8px 24px rgba(51,80,208,0.25)',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 9h18M14 9v10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
          Empezá hoy.<br />Tu historial no puede esperar.
        </h2>
        <p style={{ fontSize: 18, color: '#64748B', lineHeight: 1.65, marginBottom: 44 }}>
          Cada día sin documentar es un logro que no queda registrado.
          Creá tu perfil gratis y empezá a construir el historial que te representa.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/registro" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
            color: 'white', fontWeight: 700, fontSize: 17,
            borderRadius: 14, padding: '16px 36px', textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(51,80,208,0.30)',
          }}>
            Crear mi cuenta gratis <ArrowRight size={17} />
          </Link>
          <Link href="/registro/empresa" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            color: PRIMARY, fontWeight: 600, fontSize: 16,
            textDecoration: 'none', border: '1.5px solid #BBC5F7',
            borderRadius: 14, padding: '15px 28px', background: 'white',
          }}>
            <Building2 size={16} /> Para empresas
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: 13, color: '#94A3B8' }}>
          Sin tarjeta de crédito · Gratis para siempre en el plan básico
        </p>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  const navLinks = ['Para empleados', 'Para empresas', 'Cómo funciona', 'Credencial pública']
  const companyLinks = ['Sobre Traza', 'Privacidad', 'Términos', 'Contacto']

  return (
    <footer style={{ background: '#0F172A', padding: '56px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 48, marginBottom: 56 }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M8 5v7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 900, color: 'white' }}>traza</span>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>
              El historial profesional verificado que te acompaña toda la carrera.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', marginBottom: 18 }}>PRODUCTO</p>
              {navLinks.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 12, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', marginBottom: 18 }}>EMPRESA</p>
              {companyLinks.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 12, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#475569' }}>© 2026 Traza. Todos los derechos reservados.</p>
          <p style={{ fontSize: 13, color: '#334155' }}>Construido para los profesionales que toman en serio su carrera.</p>
        </div>
      </div>
    </footer>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: BODY, backgroundColor: 'white', color: '#0F172A' }}>
      <Navbar />
      <Hero />
      <StatsBar />
      <DualAudience />
      <HowItWorks />
      <IndiceTraza />
      <ForCompanies />
      <FinalCTA />
      <Footer />
    </div>
  )
}
