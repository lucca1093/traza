'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Target, ArrowRight, Shield, Globe,
  BarChart3, Flame, Award, TrendingUp,
  Lock, Users, Building2, ChevronRight, ClipboardList,
  MessageSquare, Calendar, Sparkles,
  ChevronDown, Star, Brain,
  FileText, Activity, UserCheck, Zap, Bell,
  Check, X, Mail, Phone, Linkedin,
  AlertTriangle, Lightbulb, BarChart2,
  CheckSquare, RefreshCw, Database, Layers, Repeat
} from 'lucide-react'

/* ─── Brand tokens ───────────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'
const D       = "'Plus Jakarta Sans', system-ui, sans-serif"
const B       = "'Inter', system-ui, sans-serif"

/* ─── Scroll-visible hook ────────────────────────────────────────── */
function useVisible(threshold = 0.12) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── CSS animations ─────────────────────────────────────────────── */
const CSS_ANIM = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes shimmer  { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
@keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(51,80,208,0.35)} 50%{box-shadow:0 0 0 14px rgba(51,80,208,0)} }
.fu  { animation: fadeUp 0.6s ease both }
.fu1 { animation: fadeUp 0.6s 0.08s ease both }
.fu2 { animation: fadeUp 0.6s 0.18s ease both }
.fu3 { animation: fadeUp 0.6s 0.28s ease both }
.fu4 { animation: fadeUp 0.6s 0.38s ease both }
.fu5 { animation: fadeUp 0.6s 0.48s ease both }
.float{ animation: float 4.5s ease-in-out infinite }
`

/* ══════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Producto',      href: '#features' },
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Precios',       href: '#pricing' },
    { label: 'Recursos',      href: '#faq' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
      transition: 'all 0.22s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(51,80,208,0.32)' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M3 5.5h11M8.5 5.5V14" stroke="white" strokeWidth="2.3" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: D, fontSize: 21, fontWeight: 900, color: scrolled ? BRAND : 'white', letterSpacing: '-0.5px', transition: 'color 0.22s' }}>traza</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          {links.map(n => (
            <a key={n.label} href={n.href} style={{ fontSize: 14, fontWeight: 500, color: scrolled ? '#374151' : 'rgba(255,255,255,0.82)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = scrolled ? PRIMARY : 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.82)')}
            >{n.label}</a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: scrolled ? '#374151' : 'rgba(255,255,255,0.82)', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = scrolled ? '#F1F5F9' : 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >Ingresar</Link>
          <Link href="/registro/empresa" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, borderRadius: 10, padding: '9px 20px', textDecoration: 'none', boxShadow: '0 2px 10px rgba(51,80,208,0.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            Solicitar demo <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ══════════════════════════════════════════════════
   DASHBOARD MOCKUP
══════════════════════════════════════════════════ */
function DashboardMock({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ width: 560 * scale, background: 'white', borderRadius: 14 * scale, boxShadow: '0 32px 80px rgba(15,23,42,0.22), 0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0', overflow: 'hidden', flexShrink: 0 }}>
      {/* Top bar */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: `${10*scale}px ${16*scale}px`, display: 'flex', alignItems: 'center', gap: 8*scale }}>
        <div style={{ display: 'flex', gap: 6*scale }}>
          {['#FC5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 11*scale, height: 11*scale, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: 6*scale, padding: `${4*scale}px ${10*scale}px`, fontSize: 10*scale, color: '#94A3B8', border: '1px solid #E2E8F0' }}>app.traza.ar/dashboard</div>
        <div style={{ width: 24*scale, height: 24*scale, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 8*scale, color: 'white', fontWeight: 800 }}>LF</span>
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: 'flex', height: 310*scale }}>
        {/* Sidebar */}
        <div style={{ width: 140*scale, background: '#FAFBFF', borderRight: '1px solid #E8ECFD', padding: `${14*scale}px ${10*scale}px`, flexShrink: 0 }}>
          <div style={{ fontSize: 9*scale, fontWeight: 800, color: BRAND, letterSpacing: '0.08em', marginBottom: 12*scale, paddingLeft: 8*scale }}>TRAZA</div>
          {[
            ['Dashboard', true], ['Objetivos', false], ['Mi Trabajo', false], ['Equipo', false], ['Reportes', false], ['IA', false],
          ].map(([l, active]) => (
            <div key={l as string} style={{ padding: `${6*scale}px ${8*scale}px`, borderRadius: 7*scale, marginBottom: 3*scale, background: active ? LIGHT : 'transparent', fontSize: 10*scale, fontWeight: active ? 700 : 500, color: active ? PRIMARY : '#64748B', display: 'flex', alignItems: 'center', gap: 6*scale }}>
              <div style={{ width: 6*scale, height: 6*scale, borderRadius: '50%', background: active ? PRIMARY : 'transparent' }} />
              {l as string}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 14*scale, overflow: 'hidden' }}>
          <div style={{ fontSize: 11*scale, fontWeight: 800, color: '#0F172A', marginBottom: 10*scale }}>Resumen del equipo · Jul 2026</div>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8*scale, marginBottom: 10*scale }}>
            {[
              { label: 'Score promedio', val: '74', unit: '/100', color: PRIMARY },
              { label: 'Objetivos activos', val: '38', unit: '', color: '#16a34a' },
              { label: 'Validaciones', val: '91%', unit: '', color: '#d97706' },
            ].map(k => (
              <div key={k.label} style={{ background: '#F8FAFC', borderRadius: 8*scale, padding: 8*scale, border: '1px solid #E8ECFD' }}>
                <div style={{ fontSize: 16*scale, fontWeight: 900, color: k.color, fontFamily: D }}>{k.val}<span style={{ fontSize: 8*scale, color: '#94A3B8' }}>{k.unit}</span></div>
                <div style={{ fontSize: 8*scale, color: '#94A3B8', marginTop: 2*scale }}>{k.label}</div>
              </div>
            ))}
          </div>
          {/* Team table */}
          <div style={{ background: '#F8FAFC', borderRadius: 8*scale, border: '1px solid #E8ECFD', overflow: 'hidden' }}>
            <div style={{ padding: `${6*scale}px ${10*scale}px`, fontSize: 8*scale, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #E8ECFD', display: 'flex', gap: 8*scale }}>
              <span style={{ flex: 2 }}>PERSONA</span><span style={{ flex: 1 }}>SCORE</span><span style={{ flex: 1 }}>ESTADO</span>
            </div>
            {[
              { n: 'Luciana F.', score: 87, estado: 'Destacada', c: '#16a34a' },
              { n: 'Marcos R.', score: 74, estado: 'En progreso', c: PRIMARY },
              { n: 'Valeria P.', score: 91, estado: 'Destacada', c: '#16a34a' },
              { n: 'Juan T.', score: 58, estado: 'Atención', c: '#d97706' },
            ].map(r => (
              <div key={r.n} style={{ padding: `${5*scale}px ${10*scale}px`, display: 'flex', alignItems: 'center', gap: 8*scale, borderBottom: '1px solid #F1F5F9', fontSize: 9*scale }}>
                <span style={{ flex: 2, color: '#0F172A', fontWeight: 600 }}>{r.n}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ color: r.c, fontWeight: 800 }}>{r.score}</span>
                  <span style={{ color: '#94A3B8' }}>/100</span>
                </span>
                <span style={{ flex: 1, color: r.c, fontSize: 8*scale, fontWeight: 600 }}>{r.estado}</span>
              </div>
            ))}
          </div>
          {/* Mini chart */}
          <div style={{ marginTop: 8*scale, display: 'flex', gap: 4*scale, alignItems: 'flex-end', height: 36*scale }}>
            {[40,55,48,62,58,72,67,74,80,77,84,87].map((v,i) => (
              <div key={i} style={{ flex: 1, background: `rgba(51,80,208,${0.2 + i*0.065})`, borderRadius: `${3*scale}px ${3*scale}px 0 0`, height: `${(v/100)*36*scale}px` }} />
            ))}
          </div>
          <div style={{ fontSize: 7*scale, color: '#94A3B8', marginTop: 3*scale }}>Evolución del índice promedio · últimos 12 meses</div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ minHeight: '100vh', background: `linear-gradient(145deg, #0A0F2E 0%, ${BRAND} 45%, #1a3460 100%)`, display: 'flex', alignItems: 'center', paddingTop: 68, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative rings */}
      {[800,600,400].map((s,i) => (
        <div key={i} style={{ position: 'absolute', top: '50%', right: '-5%', width: s, height: s, borderRadius: '50%', border: `1px solid rgba(255,255,255,${0.03+i*0.01})`, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      ))}
      {/* Glow */}
      <div style={{ position: 'absolute', top: '20%', right: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(51,80,208,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap', width: '100%' }}>
        {/* Copy */}
        <div style={{ flex: '1 1 480px', maxWidth: 580 }}>
          <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 20, padding: '6px 14px', marginBottom: 28 }}>
            <Sparkles size={12} color="#A5B4FC" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#A5B4FC' }}>Performance Management · IA nativa · Nuevo</span>
          </div>

          <h1 className="fu1" style={{ fontFamily: D, fontWeight: 900, lineHeight: 1.06, fontSize: 'clamp(38px, 5vw, 64px)', color: 'white', letterSpacing: '-0.03em', marginBottom: 22 }}>
            El software de performance que tu equipo{' '}
            <span style={{ background: 'linear-gradient(90deg,#A5B4FC,#6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              realmente usa.
            </span>
          </h1>

          <p className="fu2" style={{ fontSize: 'clamp(15px,1.7vw,18px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.72, marginBottom: 38, maxWidth: 520 }}>
            TRAZA centraliza OKRs, feedback estructurado, validaciones supervisadas y análisis con IA en una sola plataforma. Equipos de alto rendimiento, decisiones basadas en evidencia.
          </p>

          <div className="fu3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 36 }}>
            <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: BRAND, fontWeight: 800, fontSize: 15, borderRadius: 12, padding: '14px 28px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,255,255,0.2)', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(255,255,255,0.2)' }}
            >
              Solicitar demo gratuita <ArrowRight size={15} />
            </Link>
            <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'white', fontWeight: 600, fontSize: 14, border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: 12, padding: '13px 22px', textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,0.28)' }}
            >
              Empezar gratis
            </Link>
          </div>

          <div className="fu4" style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {['Sin tarjeta de crédito', 'Setup en 30 minutos', 'Soporte en español'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} color="#6EE7B7" />
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup */}
        <div className="fu4 float" style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center' }}>
          <DashboardMock />
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   STATS / TRUST BAR
══════════════════════════════════════════════════ */
function TrustBar() {
  const { ref, visible } = useVisible()
  return (
    <div ref={ref} style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '0 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
          {[
            { val: '+500',  label: 'empresas activas' },
            { val: '+12K',  label: 'profesionales' },
            { val: '+98K',  label: 'objetivos gestionados' },
            { val: '4.9/5', label: 'satisfacción promedio' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '28px 48px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F1F5F9' : 'none', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: `all 0.5s ${i*0.1}s ease` }}>
              <div style={{ fontFamily: D, fontSize: 28, fontWeight: 900, color: BRAND, letterSpacing: '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Logos */}
        <div style={{ padding: '22px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: '#CBD5E1', fontWeight: 600, whiteSpace: 'nowrap' }}>Confían en TRAZA:</span>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', paddingLeft: 8 }}>
            {['Grupo Meridian', 'InnovaLatam', 'TechCorp', 'Nexus Capital', 'PeopleFirst', 'ArgenSoft'].map(n => (
              <span key={n} style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', letterSpacing: '-0.01em' }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PROBLEM
══════════════════════════════════════════════════ */
function Problem() {
  const { ref, visible } = useVisible()
  const problems = [
    {
      icon: <AlertTriangle size={20} color="#dc2626" />,
      bg: '#FEF2F2', border: '#FECACA',
      title: 'Las evaluaciones son subjetivas',
      desc: 'El 78% de los empleados considera que su última evaluación no refleja su trabajo real. Sin datos objetivos, el sesgo del manager define el resultado.',
      stat: '78%', statLabel: 'cree que su evaluación fue injusta',
    },
    {
      icon: <MessageSquare size={20} color="#d97706" />,
      bg: '#FFFBEB', border: '#FDE68A',
      title: 'El feedback se pierde entre mensajes',
      desc: 'El feedback fluye por WhatsApp, correos y conversaciones de pasillo. Sin estructura ni registro, su impacto en el desempeño es nulo.',
      stat: '73%', statLabel: 'del feedback nunca genera cambios',
    },
    {
      icon: <BarChart2 size={20} color={PRIMARY} />,
      bg: '#EFF6FF', border: '#BFDBFE',
      title: 'Decisiones de talento sin datos',
      desc: 'Ascensos, aumentos y bajas se deciden sin información real. El talento silencioso se va y nadie lo detectó a tiempo.',
      stat: '58%', statLabel: 'de rotación era evitable con datos',
    },
  ]

  return (
    <section style={{ padding: '100px 24px', background: '#F8FAFC' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>EL PROBLEMA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 18 }}>
            Las evaluaciones anuales están rotas.<br />Y todos lo saben.
          </h2>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7 }}>
            Los procesos de gestión del desempeño actuales generan frustración, sesgo y rotación. TRAZA los reemplaza con evidencia objetiva y continua.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          {problems.map((p, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: `all 0.6s ${i*0.12}s ease`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: p.bg, border: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {p.icon}
              </div>
              <h3 style={{ fontFamily: D, fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.3 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>
              <div style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: D, fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{p.stat}</span>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>{p.statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   FEATURES (tabs)
══════════════════════════════════════════════════ */
const FEATURES_DATA = [
  {
    tab: 'OKRs y Objetivos',
    icon: <Target size={16} />,
    title: 'De la estrategia al objetivo individual en minutos.',
    desc: 'Definí OKRs a nivel empresa, equipo e individuo. Conectá cada objetivo a resultados de negocio reales. Asigná responsables, fechas y KPIs desde el primer día.',
    bullets: [
      'OKRs conectados a la estrategia organizacional',
      'Objetivos individuales, grupales y de equipo',
      'KPIs configurables con umbrales de alerta',
      'Evidencia adjunta: archivos, URLs y notas',
    ],
    color: PRIMARY,
  },
  {
    tab: 'Seguimiento',
    icon: <Activity size={16} />,
    title: 'Seguimiento continuo, sin fricciones.',
    desc: 'El equipo registra avances periódicos con contexto real. Los managers tienen visibilidad en tiempo real sin necesidad de reuniones innecesarias.',
    bullets: [
      'Avances periódicos con descripción y evidencia',
      'Alertas automáticas de objetivos en riesgo',
      'Cronología completa de cada objetivo',
      'Notificaciones inteligentes por email y Slack',
    ],
    color: '#7c3aed',
  },
  {
    tab: 'Feedback y Validaciones',
    icon: <CheckSquare size={16} />,
    title: 'Feedback estructurado. Validaciones verificadas.',
    desc: 'El feedback deja de ser informal. Supervisores validan logros con firma de email. El historial queda en el perfil del empleado, portable y verificable.',
    bullets: [
      'Validaciones confirmadas por email (anti-fraude)',
      'Feedback estructurado con contexto y evidencia',
      'Reconocimientos de equipo y celebraciones',
      'Comentarios vinculados a objetivos específicos',
    ],
    color: '#059669',
  },
  {
    tab: 'Dashboard e Informes',
    icon: <BarChart3 size={16} />,
    title: 'Información ejecutiva en tiempo real.',
    desc: 'Dashboard con visión 360° del equipo. Reportes automáticos por período, área y persona. Exportación instantánea para comités de dirección.',
    bullets: [
      'Dashboard en tiempo real por equipo y persona',
      'Reportes automáticos por período de evaluación',
      'Análisis de distribución del desempeño',
      'Exportación a PDF y Excel en un clic',
    ],
    color: '#0891b2',
  },
  {
    tab: 'Inteligencia Artificial',
    icon: <Brain size={16} />,
    title: 'IA que convierte datos en decisiones.',
    desc: 'TRAZA analiza patrones de desempeño con IA y genera insights accionables para managers: alertas de riesgo, recomendaciones de desarrollo y briefings automáticos.',
    bullets: [
      'Análisis narrativo de desempeño individual',
      'Alertas predictivas de riesgo de fuga',
      'Recomendaciones de desarrollo personalizadas',
      'Briefings semanales automáticos para el manager',
    ],
    color: '#d97706',
  },
]

function Features() {
  const [tab, setTab] = useState(0)
  const { ref, visible } = useVisible()
  const f = FEATURES_DATA[tab]

  return (
    <section id="features" style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 56px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>PLATAFORMA COMPLETA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Todo lo que necesitás para gestionar el desempeño de tu equipo.
          </h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          {FEATURES_DATA.map((fd, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1.5px solid', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', borderColor: tab===i ? fd.color : '#E2E8F0', background: tab===i ? fd.color+'14' : 'white', color: tab===i ? fd.color : '#64748B' }}>
              {fd.icon} {fd.tab}
            </button>
          ))}
        </div>

        {/* Feature content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: f.color+'14', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, color: f.color }}>
              {f.icon}
            </div>
            <h3 style={{ fontFamily: D, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>{f.title}</h3>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.75, marginBottom: 28 }}>{f.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {f.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: f.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Check size={11} color={f.color} />
                  </div>
                  <span style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: f.color, color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '11px 22px', textDecoration: 'none' }}>
                Ver en acción <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Feature mockup */}
          <div style={{ background: '#F8FAFC', borderRadius: 20, border: '1px solid #E2E8F0', padding: 24, minHeight: 320, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${f.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.tab}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: f.color, background: f.color+'14', padding: '3px 10px', borderRadius: 20 }}>En vivo</span>
            </div>
            {[
              { label: 'Q3 · Aumentar retención al 90%', pct: 74, badge: 'En progreso' },
              { label: 'Implementar NPS mensual en soporte', pct: 100, badge: 'Completado' },
              { label: 'Reducir tiempo de onboarding a 2 sem.', pct: 45, badge: 'En riesgo' },
              { label: 'Certificar al equipo en metodología OKR', pct: 60, badge: 'En progreso' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid #E8ECFD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{item.label}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: item.pct===100?'#16a34a': item.pct<50?'#dc2626':f.color, background: item.pct===100?'#dcfce7':item.pct<50?'#FEF2F2':f.color+'12', padding: '2px 8px', borderRadius: 20 }}>{item.badge}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.pct===100?'#16a34a':item.pct<50?'#dc2626':f.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 4, display: 'block' }}>{item.pct}% completado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════ */
function HowItWorks() {
  const { ref, visible } = useVisible()
  const steps = [
    { n:'01', icon:<Target size={22} color={PRIMARY}/>, title:'Alineás objetivos a la estrategia', desc:'Creá OKRs a nivel empresa, equipo e individuo. Cada colaborador entiende cómo su trabajo contribuye al resultado del negocio.' },
    { n:'02', icon:<Activity size={22} color={PRIMARY}/>, title:'El equipo registra avances con evidencia', desc:'Avances periódicos, archivos y contexto real. No hay que confiar en la memoria — queda documentado en el historial.' },
    { n:'03', icon:<Shield size={22} color={PRIMARY}/>, title:'Los supervisores validan y dan feedback', desc:'Validaciones confirmadas por email. Feedback estructurado y trazable. Reconocimientos que quedan en el perfil.' },
    { n:'04', icon:<Brain size={22} color={PRIMARY}/>, title:'TRAZA genera insights con IA', desc:'Análisis automáticos, alertas de riesgo, recomendaciones de desarrollo y reportes ejecutivos en segundos.' },
  ]
  return (
    <section id="como-funciona" style={{ padding: '100px 24px', background: 'linear-gradient(160deg,#F8FAFC,#EEF2FF)' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>CÓMO FUNCIONA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}>De cero a equipo de alto rendimiento en menos de una semana.</h2>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7 }}>Sin consultoras, sin implementaciones de 6 meses. TRAZA se configura en horas y el equipo adopta en días.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E8ECFD', borderRadius: 20, padding: '30px 26px', position: 'relative', overflow: 'hidden', opacity: visible?1:0, transform: visible?'none':'translateY(28px)', transition: `all 0.6s ${i*0.12}s ease` }}>
              <span style={{ position: 'absolute', top: 16, right: 18, fontFamily: D, fontSize: 42, fontWeight: 900, color: '#F0F3FF', letterSpacing: '-2px' }}>{s.n}</span>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{s.icon}</div>
              <h3 style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.35 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   AI SECTION
══════════════════════════════════════════════════ */
function AISection() {
  const { ref, visible } = useVisible()
  const features = [
    { icon:<Brain size={16}/>, title:'Análisis de desempeño narrativo', desc:'Generá un análisis profundo del desempeño de cualquier persona en segundos, basado en todos sus objetivos y validaciones.' },
    { icon:<AlertTriangle size={16}/>, title:'Alertas predictivas de riesgo', desc:'TRAZA detecta patrones de desmotivación y riesgo de fuga antes de que sean evidentes. Actuá antes de perder talento.' },
    { icon:<Lightbulb size={16}/>, title:'Recomendaciones de desarrollo', desc:'Planes de desarrollo personalizados basados en las brechas de desempeño detectadas. IA que actúa como coach.' },
    { icon:<RefreshCw size={16}/>, title:'Briefings semanales automáticos', desc:'Cada manager recibe un resumen automático de su equipo cada lunes. Sin buscar datos, sin armar reportes.' },
    { icon:<FileText size={16}/>, title:'Reportes ejecutivos en un clic', desc:'Generá reportes para comités de dirección con análisis, gráficos y conclusiones redactadas por IA.' },
    { icon:<Zap size={16}/>, title:'Insights de equipo en tiempo real', desc:'Patrones de desempeño colectivos, comparaciones entre áreas y tendencias detectadas automáticamente.' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: `linear-gradient(135deg, #0A0F2E 0%, ${BRAND} 50%, #1a3460 100%)`, position: 'relative', overflow: 'hidden' }} ref={ref}>
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(51,80,208,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{ opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(165,180,252,0.12)', border: '1px solid rgba(165,180,252,0.25)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
              <Sparkles size={12} color="#A5B4FC" />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#A5B4FC' }}>Inteligencia Artificial nativa</span>
            </div>
            <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20 }}>
              IA que trabaja mientras vos liderás.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 36 }}>
              TRAZA no es solo un repositorio de datos. Analiza patrones, detecta riesgos y genera recomendaciones accionables. Tu equipo de datos de RRHH, en una plataforma.
            </p>
            <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: BRAND, fontWeight: 800, fontSize: 14, borderRadius: 11, padding: '13px 24px', textDecoration: 'none' }}>
              Explorar capacidades IA <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition: `all 0.6s ${i*0.08}s ease` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(165,180,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#A5B4FC' }}>{f.icon}</div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>{f.title}</h4>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════ */
function Testimonials() {
  const { ref, visible } = useVisible()
  const testimonials = [
    { quote:'Antes teníamos carpetas con PDFs de evaluaciones que nadie leía. Hoy tenemos datos en tiempo real y tomamos mejores decisiones sobre el talento. TRAZA cambió completamente cómo gestionamos el desempeño.', name:'María González', role:'Directora de RRHH', company:'TechCorp Argentina', size:'200 empleados', stars:5 },
    { quote:'El Índice TRAZA nos dio un lenguaje común para hablar de desempeño. Los managers ya no se basan en intuición — se basan en evidencia verificada. Los ascensos ahora son objetivos y nadie los discute.', name:'Carlos Medina', role:'CEO', company:'Grupo Meridian', size:'85 empleados', stars:5 },
    { quote:'La adopción fue lo que más nos sorprendió. Los empleados lo usan porque les sirve a ellos — construyen su historial portátil. No tuvimos que forzar nada. En 3 semanas el 94% del equipo ya estaba activo.', name:'Valentina Ríos', role:'Chief People Officer', company:'InnovaLatam', size:'340 empleados', stars:5 },
  ]
  return (
    <section style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>CASOS DE ÉXITO</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Empresas que transformaron su gestión del talento.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: '#FAFBFF', border: '1px solid #E8ECFD', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, opacity: visible?1:0, transform: visible?'none':'translateY(28px)', transition: `all 0.6s ${i*0.12}s ease` }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({length: t.stars}).map((_,j) => <Star key={j} size={14} fill="#FBBF24" color="#FBBF24" />)}
              </div>
              <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75, flex: 1, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #E8ECFD' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{t.name[0]}{t.name.split(' ')[1][0]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{t.role} · {t.company}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{t.size}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   COMPARISON TABLE
══════════════════════════════════════════════════ */
function Comparison() {
  const { ref, visible } = useVisible()
  const rows = [
    'Gestión de OKRs y objetivos estructurados',
    'Seguimiento continuo con evidencia',
    'Validaciones verificadas por supervisores',
    'Feedback estructurado y trazable',
    'Dashboard en tiempo real',
    'Análisis con Inteligencia Artificial',
    'Historial portátil del profesional',
    'Alertas predictivas de riesgo',
    'Reportes automáticos y personalizables',
    'Integraciones con herramientas existentes',
  ]
  const cols = [
    { label: 'TRAZA', vals: [true,true,true,true,true,true,true,true,true,true], highlight: true },
    { label: 'Excel / Sheets', vals: [false,'parcial',false,'parcial','parcial',false,false,false,false,false], highlight: false },
    { label: 'Proceso manual', vals: [false,false,false,false,false,false,false,false,false,false], highlight: false },
  ]
  const Cell = ({ v }: { v: boolean | string }) => {
    if (v === true) return <div style={{ display:'flex',justifyContent:'center' }}><div style={{ width:22,height:22,borderRadius:'50%',background:'#dcfce7',display:'flex',alignItems:'center',justifyContent:'center' }}><Check size={12} color="#16a34a" /></div></div>
    if (v === 'parcial') return <div style={{ display:'flex',justifyContent:'center' }}><div style={{ width:22,height:22,borderRadius:'50%',background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{fontSize:10,fontWeight:800,color:'#d97706'}}>~</span></div></div>
    return <div style={{ display:'flex',justifyContent:'center' }}><div style={{ width:22,height:22,borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={11} color="#dc2626" /></div></div>
  }
  return (
    <section style={{ padding: '100px 24px', background: '#F8FAFC' }} ref={ref}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>COMPARATIVA</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1 }}>TRAZA vs. el resto.</h2>
        </div>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s 0.15s ease' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '2px solid #E2E8F0' }}>
            <div style={{ padding: '18px 24px', fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>FUNCIONALIDAD</div>
            {cols.map((c,i) => (
              <div key={i} style={{ padding: '18px 16px', textAlign: 'center', background: c.highlight ? PRIMARY : 'transparent', color: c.highlight ? 'white' : '#0F172A', fontSize: 13, fontWeight: 800 }}>{c.label}</div>
            ))}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: ri < rows.length-1 ? '1px solid #F1F5F9' : 'none', background: ri%2===0 ? 'white' : '#FAFBFF' }}>
              <div style={{ padding: '14px 24px', fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{row}</div>
              {cols.map((c,ci) => (
                <div key={ci} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ci===0 ? 'rgba(51,80,208,0.04)' : 'transparent' }}>
                  <Cell v={c.vals[ri]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   PRICING
══════════════════════════════════════════════════ */
const PLANS = [
  {
    name: 'Starter',
    desc: 'Para profesionales individuales que quieren documentar su trayectoria.',
    monthly: 0, annual: 0,
    highlight: false,
    cta: 'Empezar gratis',
    ctaHref: '/registro',
    features: [
      '1 usuario',
      'Hasta 10 objetivos activos',
      'Credencial pública verificada (Índice TRAZA)',
      'Score individual basado en evidencia',
      'Validaciones de supervisor externo',
      'Historial portátil de carrera',
      'Soporte por email',
    ],
    noFeatures: ['Dashboard de equipo','Reportes automáticos','Análisis con IA','Integraciones'],
  },
  {
    name: 'Pro',
    desc: 'Para equipos y PyMEs que quieren gestionar el desempeño con datos reales.',
    monthly: 29, annual: 19,
    highlight: true,
    badge: 'Más popular',
    cta: 'Solicitar demo',
    ctaHref: '/registro/empresa',
    features: [
      'Hasta 100 usuarios',
      'Objetivos y OKRs ilimitados',
      'Dashboard de equipo en tiempo real',
      'Validaciones supervisadas con email',
      'Feedback estructurado y trazable',
      'Reuniones 1:1 con registro de acuerdos',
      'Análisis IA (30 créditos/mes)',
      'Reportes automáticos y exportación',
      'Notificaciones por email y Slack',
      'Soporte prioritario en español',
    ],
    noFeatures: [],
  },
  {
    name: 'Enterprise',
    desc: 'Para organizaciones que necesitan máxima flexibilidad, seguridad y soporte.',
    monthly: null, annual: null,
    highlight: false,
    cta: 'Hablar con ventas',
    ctaHref: '/registro/empresa',
    features: [
      'Usuarios ilimitados',
      'Administradores ilimitados',
      'SSO / SAML',
      'API completa y webhooks',
      'IA ilimitada',
      'Roles y permisos granulares',
      'Períodos de evaluación personalizados',
      'Auditoría y logs completos',
      'SLA garantizado 99.9%',
      'Manager de cuenta dedicado',
      'Implementación guiada + capacitación',
    ],
    noFeatures: [],
  },
]

function Pricing() {
  const [annual, setAnnual] = useState(true)
  const { ref, visible } = useVisible()

  const faq = [
    { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Podés subir o bajar de plan cuando quieras. Los cambios se aplican al inicio del siguiente período de facturación.' },
    { q: '¿Qué pasa con los datos si me doy de baja?', a: 'Tus datos son tuyos. Si cancelás, podés exportar toda tu información en cualquier formato estándar. No retenemos datos.' },
    { q: '¿El plan gratuito tiene límite de tiempo?', a: 'No. El plan Starter es gratuito para siempre para profesionales individuales. Sin trial, sin tarjeta de crédito.' },
    { q: '¿Hay descuento para ONGs o instituciones educativas?', a: 'Sí. Ofrecemos precios especiales para ONGs, universidades e instituciones sin fines de lucro. Contactanos.' },
  ]
  const [openFaq, setOpenFaq] = useState<number|null>(null)

  return (
    <section id="pricing" style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>PRECIOS</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 28 }}>
            Precios simples y transparentes.
          </h2>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '6px 8px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: !annual ? 'white' : 'transparent', color: !annual ? '#0F172A' : '#94A3B8', boxShadow: !annual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Mensual</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: annual ? 'white' : 'transparent', color: annual ? '#0F172A' : '#94A3B8', boxShadow: annual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              Anual
              {annual && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 99 }}>-35%</span>}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24, alignItems: 'start' }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{ border: p.highlight ? `2px solid ${PRIMARY}` : '1px solid #E2E8F0', borderRadius: 20, padding: 28, background: p.highlight ? '#FAFBFF' : 'white', position: 'relative', opacity: visible?1:0, transform: visible?'none':'translateY(28px)', transition: `all 0.6s ${i*0.1}s ease`, boxShadow: p.highlight ? `0 12px 40px rgba(51,80,208,0.12)` : '0 1px 3px rgba(0,0,0,0.04)' }}>
              {p.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>{p.badge}</div>}
              <h3 style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 20, minHeight: 40 }}>{p.desc}</p>
              <div style={{ marginBottom: 24 }}>
                {p.monthly === null ? (
                  <div style={{ fontFamily: D, fontSize: 28, fontWeight: 900, color: '#0F172A' }}>A convenir</div>
                ) : p.monthly === 0 ? (
                  <div><span style={{ fontFamily: D, fontSize: 36, fontWeight: 900, color: '#0F172A' }}>Gratis</span></div>
                ) : (
                  <div>
                    <span style={{ fontFamily: D, fontSize: 36, fontWeight: 900, color: '#0F172A' }}>${annual ? p.annual : p.monthly}</span>
                    <span style={{ fontSize: 14, color: '#94A3B8' }}> USD/usuario/mes</span>
                    {annual && <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Facturación anual · ahorrás ${(p.monthly! - p.annual!) * 12}/usuario/año</div>}
                  </div>
                )}
              </div>
              <Link href={p.ctaHref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: p.highlight ? `linear-gradient(135deg,${BRAND},${PRIMARY})` : 'white', color: p.highlight ? 'white' : PRIMARY, border: p.highlight ? 'none' : `1.5px solid ${PRIMARY}`, fontWeight: 700, fontSize: 14, borderRadius: 11, padding: '13px 20px', textDecoration: 'none', marginBottom: 24 }}>
                {p.cta} <ArrowRight size={14} />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {p.features.map((feat, fi) => (
                  <div key={fi} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Check size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#374151' }}>{feat}</span>
                  </div>
                ))}
                {p.noFeatures.map((feat, fi) => (
                  <div key={fi} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <X size={13} color="#CBD5E1" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#CBD5E1' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing FAQ */}
        <div style={{ maxWidth: 720, margin: '64px auto 0' }}>
          <h3 style={{ fontFamily: D, fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 20, textAlign: 'center' }}>Preguntas sobre precios</h3>
          {faq.map((item, i) => (
            <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq===i ? null : i)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.q}</span>
                {openFaq===i ? <ChevronDown size={16} color="#64748B" style={{ transform: 'rotate(180deg)', transition: 'transform 0.2s' }} /> : <ChevronDown size={16} color="#64748B" />}
              </button>
              {openFaq===i && <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#64748B', lineHeight: 1.7, background: '#FAFBFF' }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   ROI CALCULATOR
══════════════════════════════════════════════════ */
function ROICalculator() {
  const { ref, visible } = useVisible()
  const [employees, setEmployees] = useState(50)
  const [salary, setSalary]       = useState(1200)
  const [hours, setHours]         = useState(8)

  const hourlyCost  = salary / 160
  const annualWaste = employees * hourlyCost * hours * 12
  const savings     = Math.round(annualWaste * 0.7)
  const trazaCost   = employees * 19 * 12
  const netROI      = savings - trazaCost
  const roiPct      = trazaCost > 0 ? Math.round((netROI / trazaCost) * 100) : 0

  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <section style={{ padding: '100px 24px', background: '#F8FAFC' }} ref={ref}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>CALCULADORA DE ROI</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}>¿Cuánto te cuesta no usar TRAZA?</h2>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7 }}>Calculá el costo real de los procesos manuales de gestión del desempeño en tu empresa.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: 40, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s 0.15s ease' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: -8 }}>Datos de tu empresa</h3>
            {[
              { label: 'Cantidad de empleados', value: employees, setter: setEmployees, min: 5, max: 1000, step: 5, unit: 'empleados' },
              { label: 'Salario promedio mensual', value: salary, setter: setSalary, min: 500, max: 10000, step: 100, unit: 'USD/mes' },
              { label: 'Horas mensuales en procesos manuales de RRHH', value: hours, setter: setHours, min: 1, max: 40, step: 1, unit: 'hs/empleado/mes' },
            ].map((input, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{input.label}</label>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: PRIMARY }}>{input.value} <span style={{ fontWeight: 500, color: '#94A3B8', fontSize: 12 }}>{input.unit}</span></span>
                </div>
                <input type="range" min={input.min} max={input.max} step={input.step} value={input.value} onChange={e => input.setter(Number(e.target.value))}
                  style={{ width: '100%', accentColor: PRIMARY, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#CBD5E1' }}>{input.min}</span>
                  <span style={{ fontSize: 11, color: '#CBD5E1' }}>{input.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div style={{ background: `linear-gradient(135deg,#F0F3FF,#EEF2FF)`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Tu ROI estimado</h3>
            {[
              { label: 'Costo anual de procesos manuales', val: fmt(annualWaste), color: '#dc2626', sub: 'tiempo perdido en gestión manual' },
              { label: 'Ahorro estimado con TRAZA', val: fmt(savings), color: '#16a34a', sub: 'recuperando el 70% del tiempo' },
              { label: 'Costo de TRAZA Pro (anual)', val: fmt(trazaCost), color: '#64748B', sub: `${employees} usuarios × $19/mes × 12` },
            ].map((r, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8ECFD' }}>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontFamily: D, fontSize: 24, fontWeight: 900, color: r.color }}>{r.val}</div>
                <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>{r.sub}</div>
              </div>
            ))}
            <div style={{ background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Beneficio neto anual estimado</div>
              <div style={{ fontFamily: D, fontSize: 34, fontWeight: 900, color: 'white' }}>{fmt(netROI)}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>ROI: {roiPct}% en el primer año</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   SECURITY
══════════════════════════════════════════════════ */
function Security() {
  const { ref, visible } = useVisible()
  const items = [
    { icon:<Lock size={18}/>, title:'Encriptación end-to-end', desc:'AES-256 en reposo, TLS 1.3 en tránsito. Tus datos nunca viajan ni se almacenan sin cifrado.' },
    { icon:<Shield size={18}/>, title:'Backups automáticos', desc:'Backups diarios automatizados con retención de 90 días. Recuperación garantizada en menos de 4 horas.' },
    { icon:<Users size={18}/>, title:'Roles y permisos granulares', desc:'Control total sobre quién ve qué. Roles personalizables por empresa, área y nivel jerárquico.' },
    { icon:<Database size={18}/>, title:'Infraestructura cloud premium', desc:'Alojado en AWS con redundancia multi-AZ. 99.9% de uptime garantizado por SLA.' },
    { icon:<UserCheck size={18}/>, title:'Autenticación 2FA', desc:'Autenticación de dos factores disponible para todos los usuarios. SSO/SAML para Enterprise.' },
    { icon:<FileText size={18}/>, title:'Logs de auditoría completos', desc:'Registro completo de todas las acciones realizadas en la plataforma. Cumplimiento GDPR.' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{ opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>SEGURIDAD</p>
            <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 18 }}>
              Seguridad enterprise de serie, no como extra.
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.75, marginBottom: 32 }}>
              TRAZA fue construido con seguridad como principio, no como afterthought. Cumplimiento GDPR, encriptación end-to-end y auditorías completas incluidas en todos los planes.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['GDPR Compliant','SOC 2','99.9% SLA','AWS Hosted'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F0F3FF', border: '1px solid #BBC5F7', borderRadius: 20, padding: '6px 14px' }}>
                  <Shield size={11} color={PRIMARY} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: '#FAFBFF', border: '1px solid #E8ECFD', borderRadius: 14, padding: 18, opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition: `all 0.6s ${i*0.08}s ease` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: PRIMARY }}>{item.icon}</div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h4>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   INTEGRATIONS
══════════════════════════════════════════════════ */
function Integrations() {
  const { ref, visible } = useVisible()
  const apps = [
    { name:'Slack',             color:'#4A154B' },
    { name:'Microsoft Teams',   color:'#6264A7' },
    { name:'Google Workspace',  color:'#4285F4' },
    { name:'Microsoft 365',     color:'#D83B01' },
    { name:'Outlook Calendar',  color:'#0078D4' },
    { name:'Google Calendar',   color:'#1A73E8' },
    { name:'Zapier',            color:'#FF4A00' },
    { name:'Webhooks',          color:'#0F172A' },
    { name:'API REST',          color:'#16a34a' },
    { name:'Zoom',              color:'#2D8CFF' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: '#F8FAFC' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 56, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>INTEGRACIONES</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}>
            Se integra con las herramientas que ya usás.
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            TRAZA se conecta con tu stack actual. Sin migraciones forzadas, sin cambiar de herramientas.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {apps.map((a, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, opacity: visible?1:0, transform: visible?'none':'translateY(16px)', transition: `all 0.5s ${i*0.06}s ease` }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={14} color="white" />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{a.name}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, padding: '16px 24px', background: LIGHT, border: `1px solid ${PRIMARY}30`, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Zap size={14} color={PRIMARY} />
          <span style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 600 }}>¿No ves tu herramienta? Contactanos — si no existe, lo construimos.</span>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   FAQ (20 preguntas)
══════════════════════════════════════════════════ */
const FAQ_ITEMS = [
  { q:'¿Qué es TRAZA y en qué se diferencia de otras plataformas de performance management?', a:'TRAZA es una plataforma de gestión del desempeño basada en evidencia objetiva y verificada. A diferencia de otras soluciones, TRAZA combina gestión de OKRs, validaciones verificadas por supervisores, historial portátil del profesional e IA nativa en una sola plataforma. El diferencial clave: el historial de desempeño pertenece al empleado, no solo a la empresa.' },
  { q:'¿Cuánto tiempo lleva implementar TRAZA en mi empresa?', a:'La configuración inicial tarda menos de 30 minutos. La adopción del equipo, en promedio, se logra en menos de una semana. No necesitás consultoras externas ni meses de implementación.' },
  { q:'¿Necesito cambiar mis procesos actuales?', a:'No necesariamente. TRAZA se adapta a tu metodología actual, ya sea OKRs, MBOs o evaluaciones por competencias. Podés empezar de a poco e incorporar funcionalidades progresivamente.' },
  { q:'¿TRAZA funciona para empresas de cualquier tamaño?', a:'Sí. Tenemos clientes desde 5 hasta más de 500 empleados. El plan Pro escala hasta 100 usuarios, y el plan Enterprise no tiene límite.' },
  { q:'¿Los empleados pueden usar TRAZA de forma individual, sin que la empresa lo adopte?', a:'Sí. Cualquier profesional puede crear su cuenta gratuita, registrar objetivos, obtener validaciones externas y construir su historial portátil. La empresa no necesita adoptar TRAZA para que el empleado lo use.' },
  { q:'¿Cómo funciona el Índice TRAZA?', a:'El Índice TRAZA es un score de 0 a 100 calculado a partir de 5 dimensiones: Resultados (35%), Cumplimiento (25%), Proactividad (20%), Alineación (10%) y Evolución (10%). Se calcula automáticamente en base a objetivos completados, validaciones y avances documentados.' },
  { q:'¿Qué pasa con los datos de mis empleados si me doy de baja?', a:'Los datos son tuyos. Al darte de baja podés exportar toda la información en formatos estándar (JSON, CSV, PDF). No retenemos datos personales después de la cancelación y cumplimos con GDPR.' },
  { q:'¿TRAZA cumple con las leyes de protección de datos?', a:'Sí. TRAZA cumple con GDPR (Europa), PDPA y las regulaciones locales de protección de datos. Todos los datos se procesan y almacenan con los más altos estándares de seguridad.' },
  { q:'¿Puedo probar TRAZA antes de contratar?', a:'Sí. El plan Starter es gratuito para siempre. Para el plan Pro, ofrecemos una prueba de 14 días sin tarjeta de crédito. Para Enterprise, coordinaremos una demo personalizada.' },
  { q:'¿Cómo funciona la validación de supervisores?', a:'Cuando querés validar un objetivo, enviás un link por email al supervisor o cliente. Esa persona accede a una página pública, revisa el trabajo y lo valida (o rechaza) con su firma digital. La validación queda registrada con timestamp y verificación de email para evitar fraudes.' },
  { q:'¿Qué incluye el plan gratuito exactamente?', a:'El plan Starter incluye 1 usuario, hasta 10 objetivos activos, credencial pública con Índice TRAZA, validaciones de supervisores externos e historial portátil de carrera. Es gratuito para siempre.' },
  { q:'¿Puedo cambiar de plan en cualquier momento?', a:'Sí. Podés subir o bajar de plan cuando quieras desde la configuración de tu cuenta. Los cambios de upgrade se aplican inmediatamente y los de downgrade al inicio del siguiente período.' },
  { q:'¿Qué tipo de soporte ofrecen?', a:'El plan Starter tiene soporte por email (72hs). El plan Pro incluye soporte prioritario en español con respuesta en menos de 24hs por email y chat. Enterprise tiene un manager de cuenta dedicado y soporte telefónico.' },
  { q:'¿TRAZA se integra con nuestros sistemas actuales?', a:'Sí. TRAZA se integra con Slack, Microsoft Teams, Google Workspace, Outlook, Zapier y tiene una API REST completa para integraciones personalizadas. Los planes Enterprise incluyen webhooks avanzados.' },
  { q:'¿Cómo se mide el ROI de TRAZA?', a:'El ROI típico incluye: reducción del tiempo administrativo en gestión del desempeño (70% promedio), reducción de rotación no deseada, mejora en tiempo de detección de problemas de desempeño, y aumento en la productividad de equipos con objetivos claros.' },
  { q:'¿Qué análisis realiza la IA de TRAZA?', a:'La IA de TRAZA genera: análisis narrativos de desempeño individual, alertas predictivas de riesgo de desvinculación, recomendaciones de desarrollo personalizadas, briefings semanales automáticos para managers, análisis de distribución del equipo y detección de sesgos en evaluaciones.' },
  { q:'¿Puedo personalizar los reportes?', a:'Sí. Los reportes son completamente personalizables en el plan Pro y Enterprise: elegís período, personas, métricas, y el formato de exportación (PDF o Excel). Los reportes IA se generan con un clic.' },
  { q:'¿Cómo manejo roles y permisos dentro de TRAZA?', a:'TRAZA tiene un sistema de roles granular: Profesional, Supervisor, Manager, Admin RRHH, Super Admin y roles personalizados (Enterprise). Cada rol tiene acceso a diferentes vistas y acciones. Podés combinarlos según tu estructura organizacional.' },
  { q:'¿TRAZA tiene app móvil?', a:'Actualmente TRAZA funciona como Progressive Web App (PWA), optimizada para mobile. Podés instalarla como app en iOS y Android desde el navegador. Una app nativa está en nuestra roadmap para el Q3 2026.' },
  { q:'¿Cómo migro mis datos actuales a TRAZA?', a:'Ofrecemos importación de datos desde Excel, CSV y otras plataformas de RRHH. Para planes Pro y Enterprise, nuestro equipo de onboarding te guía en la migración sin costo adicional. El proceso típico toma menos de 2 horas.' },
]

function FAQ() {
  const [open, setOpen] = useState<number|null>(null)
  const { ref, visible } = useVisible()
  return (
    <section id="faq" style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.09em', marginBottom: 14 }}>PREGUNTAS FRECUENTES</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1 }}>Todo lo que necesitás saber.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', opacity: visible?1:0, transform: visible?'none':'translateY(12px)', transition: `all 0.5s ${Math.min(i*0.04,0.4)}s ease` }}>
              <button onClick={() => setOpen(open===i?null:i)} style={{ width: '100%', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, background: open===i?'#FAFBFF':'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: '#0F172A', lineHeight: 1.5 }}>{item.q}</span>
                <ChevronDown size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2, transform: open===i?'rotate(180deg)':'none', transition: 'transform 0.2s' }} />
              </button>
              {open===i && <div style={{ padding: '0 22px 18px', fontSize: 14.5, color: '#64748B', lineHeight: 1.75, background: '#FAFBFF' }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   FINAL CTA
══════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section style={{ padding: '100px 24px', background: `linear-gradient(135deg,#0A0F2E 0%,${BRAND} 50%,#1a3460 100%)`, position: 'relative', overflow: 'hidden' }}>
      {[600,400,250].map((s,i) => (
        <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      ))}
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 10h18M14 10V22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,5vw,56px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 20 }}>
          Tu equipo merece gestión del desempeño basada en evidencia.
        </h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 44, maxWidth: 560, margin: '0 auto 44px' }}>
          Empezá hoy. Configuración en 30 minutos. Sin compromisos de largo plazo. Sin tarjeta de crédito.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'white', color: BRAND, fontWeight: 800, fontSize: 16, borderRadius: 14, padding: '16px 32px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,255,255,0.2)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(255,255,255,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(255,255,255,0.2)' }}
          >
            Solicitar demo gratuita <ArrowRight size={16} />
          </Link>
          <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 600, fontSize: 15, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, padding: '15px 28px', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent' }}
          >
            Empezar gratis como profesional
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Sin tarjeta de crédito','Setup en 30 minutos','Cancela cuando quieras'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="#6EE7B7" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════ */
function Footer() {
  const cols = [
    { title:'Producto', links:['Dashboard','Gestión de OKRs','Seguimiento','Feedback','Reuniones 1:1','IA y Análisis','Reportes','Credencial pública'] },
    { title:'Empresa', links:['Sobre TRAZA','Blog','Carreras','Prensa','Partners','Changelog','Status'] },
    { title:'Recursos', links:['Documentación','API Reference','Guía de inicio rápido','Casos de éxito','Webinars','Comunidad','Templates'] },
    { title:'Legal', links:['Política de privacidad','Términos de uso','Seguridad','GDPR','Cookies','Licencias'] },
  ]
  return (
    <footer style={{ background: '#060B1A', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M8 5v7" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: D, fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>traza</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, marginBottom: 24, maxWidth: 240 }}>
              La plataforma de performance management que tu equipo realmente usa.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon:<Linkedin size={15}/>, href:'#' },
                { icon:<Mail size={15}/>, href:'mailto:hola@traza.ar' },
                { icon:<Phone size={15}/>, href:'#' },
              ].map((s, i) => (
                <a key={i} href={s.href} style={{ width: 34, height: 34, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', textDecoration: 'none', transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background=PRIMARY; e.currentTarget.style.color='white' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#111827'; e.currentTarget.style.color='#64748B' }}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Cols */}
          {cols.map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.07em', marginBottom: 18 }}>{col.title.toUpperCase()}</p>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13.5, color: '#475569', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color='white')}
                  onMouseLeave={e => (e.currentTarget.style.color='#475569')}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #111827', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <p style={{ fontSize: 12.5, color: '#334155' }}>© 2026 TRAZA. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad','Términos','Cookies'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12.5, color: '#334155', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color='white')}
                onMouseLeave={e => (e.currentTarget.style.color='#334155')}
              >{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#1E293B' }}>Construido en Argentina. Para equipos de todo el mundo.</p>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════
   PAGE ROOT
══════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: B, backgroundColor: 'white', color: '#0F172A' }}>
      <style>{CSS_ANIM}</style>
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />
      <Features />
      <HowItWorks />
      <AISection />
      <Testimonials />
      <Comparison />
      <Pricing />
      <ROICalculator />
      <Security />
      <Integrations />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
