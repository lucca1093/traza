'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Target, ArrowRight, Shield,
  BarChart3, Flame, Lock, Users, ChevronRight,
  MessageSquare, Calendar, Sparkles, ChevronDown,
  Star, Brain, FileText, Activity, UserCheck, Zap,
  Check, X, Mail, Phone, Linkedin,
  AlertTriangle, Lightbulb, BarChart2,
  CheckSquare, RefreshCw, Database, Layers,
} from 'lucide-react'

/* ─── Design tokens ─────────────────────────────── */
const DARK    = '#07090F'
const DARK_S  = '#0C0F1E'
const GLASS   = 'rgba(255,255,255,0.04)'
const BRAND   = '#1C2B90'
const INDIGO  = '#6366F1'
const INDIGO_L = '#A5B4FC'
const TEAL    = '#2DD4BF'
const GREEN   = '#22C55E'
const FONT_H  = "'Plus Jakarta Sans', system-ui, sans-serif"
const FONT_B  = "'Inter', system-ui, sans-serif"
const D = FONT_H, B = FONT_B

/* ─── useVisible ────────────────────────────────── */
function useVisible(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: t })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [t])
  return { ref, visible: v }
}

/* ─── CSS ───────────────────────────────────────── */
const CSS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
@keyframes orb    { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.07)} }
.fu  { animation: fadeUp .7s cubic-bezier(.16,1,.3,1) both }
.fu1 { animation: fadeUp .7s .09s cubic-bezier(.16,1,.3,1) both }
.fu2 { animation: fadeUp .7s .18s cubic-bezier(.16,1,.3,1) both }
.fu3 { animation: fadeUp .7s .27s cubic-bezier(.16,1,.3,1) both }
.fu4 { animation: fadeUp .7s .36s cubic-bezier(.16,1,.3,1) both }
.fu5 { animation: fadeUp .7s .45s cubic-bezier(.16,1,.3,1) both }
.lp-float { animation: float 5s ease-in-out infinite }
.lp-ham { display:none }
@media(max-width:767px){
  .lp-dsk{display:none!important}
  .lp-ham{display:flex!important}
  .lp-mock{display:none!important}
  .lp-2c{grid-template-columns:1fr!important;gap:40px!important}
  .lp-hc{min-width:100%!important;max-width:100%!important}
  .lp-bn{grid-template-columns:1fr!important}
  .lp-bw{grid-column:span 1!important}
  .lp-fc{grid-template-columns:1fr 1fr!important;gap:28px!important}
}
`

/* ═══════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════ */
function Navbar() {
  const [sc, setSc] = useState(false)
  const [op, setOp] = useState(false)
  useEffect(() => {
    const fn = () => setSc(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const links = [
    { label: 'Producto', href: '#features' },
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Precios', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
      paddingTop: 'env(safe-area-inset-top)',
      background: sc || op ? 'rgba(7,9,15,0.94)' : 'transparent',
      backdropFilter: sc || op ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: sc || op ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all .22s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1C2B90"/><rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white"/><path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white"/></svg>
          <span style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-.5px' }}>traza</span>
        </a>
        <div className="lp-dsk" style={{ display: 'flex', gap: 28 }}>
          {links.map(n => (
            <a key={n.label} href={n.href} style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.6)', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.6)')}
            >{n.label}</a>
          ))}
        </div>
        <div className="lp-dsk" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.6)', textDecoration: 'none', padding: '8px 14px', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.6)')}
          >Ingresar</Link>
          <Link href="/registro/empresa" style={{ fontSize: 13.5, fontWeight: 700, color: 'white', background: INDIGO, borderRadius: 10, padding: '9px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >Solicitar demo <ChevronRight size={13} /></Link>
        </div>
        <button className="lp-ham" onClick={() => setOp(o => !o)} aria-label="Menú"
          style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', cursor: 'pointer', color: 'white', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2, transition: 'all .2s', transform: op ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2, opacity: op ? 0 : 1, transition: 'all .2s' }} />
          <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2, transition: 'all .2s', transform: op ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>
      {op && <>
        <div onClick={() => setOp(false)} style={{ position: 'fixed', inset: 0, top: 68, zIndex: -1, background: 'rgba(0,0,0,.7)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 24px 24px', gap: 4, borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(7,9,15,.98)', backdropFilter: 'blur(20px)' }}>
          {links.map(n => (
            <a key={n.label} href={n.href} onClick={() => setOp(false)} style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,.75)', textDecoration: 'none', padding: '13px 4px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>{n.label}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <Link href="/login" onClick={() => setOp(false)} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.75)', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', textAlign: 'center' }}>Ingresar</Link>
            <Link href="/registro/empresa" onClick={() => setOp(false)} style={{ fontSize: 14, fontWeight: 700, color: 'white', background: INDIGO, borderRadius: 10, padding: '13px 16px', textDecoration: 'none', textAlign: 'center' }}>Solicitar demo</Link>
          </div>
        </div>
      </>}
    </nav>
  )
}

/* ═══════════════════════════════════════════════
   DASHBOARD MOCKUP
═══════════════════════════════════════════════ */
function DashMock({ scale = 1 }: { scale?: number }) {
  const s = scale
  return (
    <div style={{ width: 540*s, background: '#0D1120', borderRadius: 16*s, boxShadow: `0 0 0 1px rgba(99,102,241,.2), 0 40px 100px rgba(0,0,0,.7), 0 0 100px rgba(99,102,241,.08)`, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ background: '#111828', borderBottom: '1px solid rgba(255,255,255,.05)', padding: `${10*s}px ${16*s}px`, display: 'flex', alignItems: 'center', gap: 8*s }}>
        <div style={{ display: 'flex', gap: 6*s }}>
          {['#FC5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 11*s, height: 11*s, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 6*s, padding: `${4*s}px ${10*s}px`, fontSize: 10*s, color: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.05)' }}>app.traza.ar/dashboard</div>
        <div style={{ width: 24*s, height: 24*s, borderRadius: '50%', background: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 8*s, color: 'white', fontWeight: 800 }}>LF</span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 310*s }}>
        <div style={{ width: 136*s, background: '#0A0D1A', borderRight: '1px solid rgba(255,255,255,.04)', padding: `${14*s}px ${10*s}px`, flexShrink: 0 }}>
          <div style={{ fontSize: 9*s, fontWeight: 800, color: INDIGO_L, letterSpacing: '.1em', marginBottom: 14*s, paddingLeft: 8*s }}>TRAZA</div>
          {[['Dashboard',true],['Objetivos',false],['Mi Trabajo',false],['Equipo',false],['Reportes',false],['IA',false]].map(([l,a]) => (
            <div key={l as string} style={{ padding: `${6*s}px ${8*s}px`, borderRadius: 7*s, marginBottom: 3*s, background: a ? 'rgba(99,102,241,.15)' : 'transparent', fontSize: 10*s, fontWeight: a ? 700 : 500, color: a ? INDIGO_L : 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 6*s }}>
              <div style={{ width: 5*s, height: 5*s, borderRadius: '50%', background: a ? INDIGO : 'transparent' }} />{l as string}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 14*s, overflow: 'hidden', background: '#0D1120' }}>
          <div style={{ fontSize: 11*s, fontWeight: 800, color: 'white', marginBottom: 10*s }}>Resumen del equipo · Jul 2026</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8*s, marginBottom: 10*s }}>
            {[{l:'Score promedio',v:'74',c:INDIGO_L},{l:'Objetivos activos',v:'38',c:GREEN},{l:'Validaciones',v:'91%',c:TEAL}].map(k => (
              <div key={k.l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8*s, padding: 8*s, border: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ fontSize: 18*s, fontWeight: 900, color: k.c, fontFamily: D }}>{k.v}</div>
                <div style={{ fontSize: 8*s, color: 'rgba(255,255,255,.35)', marginTop: 2*s }}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8*s, border: '1px solid rgba(255,255,255,.04)', overflow: 'hidden' }}>
            <div style={{ padding: `${6*s}px ${10*s}px`, fontSize: 8*s, fontWeight: 700, color: 'rgba(255,255,255,.25)', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: 8*s }}>
              <span style={{ flex: 2 }}>PERSONA</span><span style={{ flex: 1 }}>SCORE</span><span style={{ flex: 1 }}>ESTADO</span>
            </div>
            {[{n:'Luciana F.',sc:87,e:'Destacada',c:GREEN},{n:'Marcos R.',sc:74,e:'En progreso',c:INDIGO_L},{n:'Valeria P.',sc:91,e:'Destacada',c:GREEN},{n:'Juan T.',sc:58,e:'Atención',c:'#FBBF24'}].map(r => (
              <div key={r.n} style={{ padding: `${5*s}px ${10*s}px`, display: 'flex', alignItems: 'center', gap: 8*s, borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 9*s }}>
                <span style={{ flex: 2, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{r.n}</span>
                <span style={{ flex: 1 }}><span style={{ color: r.c, fontWeight: 800 }}>{r.sc}</span><span style={{ color: 'rgba(255,255,255,.2)' }}>/100</span></span>
                <span style={{ flex: 1, color: r.c, fontSize: 8*s, fontWeight: 600 }}>{r.e}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8*s, display: 'flex', gap: 3*s, alignItems: 'flex-end', height: 32*s }}>
            {[40,55,48,62,58,72,67,74,80,77,84,87].map((v,i) => (
              <div key={i} style={{ flex: 1, background: `rgba(99,102,241,${.15+i*.065})`, borderRadius: `${3*s}px ${3*s}px 0 0`, height: `${(v/100)*32*s}px` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', paddingTop: 68, position: 'relative', overflow: 'hidden' }}>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.11) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)' }} />
      {/* Orb indigo */}
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,.17) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none', animation: 'orb 8s ease-in-out infinite' }} />
      {/* Orb brand */}
      <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(28,43,144,.22) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none', animation: 'orb 11s 2s ease-in-out infinite' }} />
      {/* Bottom line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,.4), transparent)', zIndex: 1 }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="lp-hc" style={{ flex: '1 1 480px', maxWidth: 580 }}>
          {/* Badge */}
          <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 100, padding: '5px 14px 5px 8px', marginBottom: 32 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={11} color={INDIGO_L} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: INDIGO_L }}>Performance Management · IA nativa · Nuevo</span>
          </div>

          <h1 className="fu1" style={{ fontFamily: D, fontWeight: 900, lineHeight: 1.02, fontSize: 'clamp(44px,5.5vw,72px)', color: 'white', letterSpacing: '-.04em', marginBottom: 24 }}>
            El software de performance que tu equipo{' '}
            <span style={{ background: `linear-gradient(135deg, ${INDIGO_L}, ${TEAL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              realmente usa.
            </span>
          </h1>

          <p className="fu2" style={{ fontSize: 17, color: 'rgba(255,255,255,.58)', lineHeight: 1.76, marginBottom: 36, maxWidth: 520 }}>
            TRAZA centraliza objetivos verificados, feedback estructurado y análisis con IA. Equipos de alto rendimiento, decisiones basadas en evidencia real.
          </p>

          <div className="fu3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <Link href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: BRAND, fontWeight: 800, fontSize: 15, borderRadius: 12, padding: '14px 28px', textDecoration: 'none', transition: 'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,255,255,.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >Ver demo interactivo <ArrowRight size={15} /></Link>
            <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,.8)', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '13px 22px', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; e.currentTarget.style.color = 'rgba(255,255,255,.8)' }}
            >Empezar gratis</Link>
          </div>

          <div className="fu4" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['Sin tarjeta de crédito','Setup en 30 minutos','Soporte en español'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={12} color={TEAL} />
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.42)', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fu4 lp-float lp-mock" style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', width: 400, height: 60, background: 'radial-gradient(ellipse, rgba(99,102,241,.28) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <DashMock />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TRUST BAR
═══════════════════════════════════════════════ */
function TrustBar() {
  const { ref, visible } = useVisible()
  return (
    <div ref={ref} style={{ background: 'white', borderBottom: '1px solid #F0F2FF' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #F5F6FF', flexWrap: 'wrap' }}>
          {[{v:'+500',l:'empresas activas'},{v:'+12K',l:'profesionales'},{v:'+98K',l:'objetivos gestionados'},{v:'4.9/5',l:'satisfacción promedio'}].map((s,i) => (
            <div key={i} style={{ padding: '30px 44px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F5F6FF' : 'none', opacity: visible?1:0, transform: visible?'none':'translateY(16px)', transition: `all .5s ${i*.1}s ease` }}>
              <div style={{ fontFamily: D, fontSize: 30, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em' }}>{s.v}</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#C8CDD5', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Confían en TRAZA</span>
          <div style={{ height: 1, flex: 1, background: '#F0F2FF', minWidth: 20 }} />
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Grupo Meridian','InnovaLatam','TechCorp','Nexus Capital','PeopleFirst','ArgenSoft'].map(n => (
              <span key={n} style={{ fontSize: 12.5, fontWeight: 800, color: '#C8CDD5', letterSpacing: '-.01em' }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PROBLEM (dark)
═══════════════════════════════════════════════ */
function Problem() {
  const { ref, visible } = useVisible()
  const pbs = [
    { icon: <AlertTriangle size={18} color="#F87171" />, accent: '#F87171', title: 'El trabajo se evalúa de memoria', desc: 'Lo que se hizo durante el año se reconstruye al momento de la evaluación. Sin registro objetivo, el resultado depende del criterio del evaluador y del recuerdo más reciente.', quote: '"Mi manager no sabe la mitad de lo que hice este año."' },
    { icon: <MessageSquare size={18} color="#FBBF24" />, accent: '#FBBF24', title: 'El feedback no deja huella', desc: 'Las conversaciones importantes pasan por WhatsApp, correos o de pasillo. No quedan registradas, no se pueden revisar y no generan ningún cambio medible en el desempeño.', quote: '"Recibí feedback, pero dos semanas después nadie lo recordaba."' },
    { icon: <BarChart2 size={18} color={INDIGO_L} />, accent: INDIGO_L, title: 'Las decisiones de talento son a ciegas', desc: 'Ascensos, aumentos y desvinculaciones se deciden sin datos consistentes. El talento silencioso no se ve hasta que ya se fue. Las señales de riesgo llegan demasiado tarde.', quote: '"Nos enteramos que quería irse cuando ya tenía otra oferta."' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: DARK_S }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: INDIGO_L, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>El problema</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 18 }}>
            El trabajo sucede todos los días.<br />Se evalúa una vez, de memoria.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.48)', lineHeight: 1.75 }}>
            No es que las evaluaciones estén mal diseñadas — es que no tienen datos reales para basarse.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
          {pbs.map((p,i) => (
            <div key={i} style={{ background: GLASS, border: `1px solid rgba(255,255,255,.07)`, borderRadius: 20, padding: 28, opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: `all .6s ${i*.12}s ease`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle, ${p.accent}14 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.accent}18`, border: `1px solid ${p.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{p.icon}</div>
              <h3 style={{ fontFamily: D, fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.3 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.48)', lineHeight: 1.75, marginBottom: 20 }}>{p.desc}</p>
              <div style={{ background: `${p.accent}0C`, border: `1px solid ${p.accent}25`, borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.58)', fontStyle: 'italic', lineHeight: 1.6 }}>{p.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FEATURES — BENTO GRID
═══════════════════════════════════════════════ */
function Features() {
  const { ref, visible } = useVisible()
  const v = visible
  const card = (delay: number, extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'white', border: '1px solid #E8EAFB', borderRadius: 22, padding: 28,
    opacity: v?1:0, transition: `all .6s ${delay}s ease`,
    display: 'flex', flexDirection: 'column', gap: 14,
    ...extra,
  })
  return (
    <section id="features" style={{ padding: '100px 24px', background: '#F8F9FF' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px', opacity: v?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Plataforma completa</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06 }}>
            Todo lo que necesitás para gestionar el desempeño.
          </h2>
        </div>

        {/* Row 1 */}
        <div className="lp-bn" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
          {/* Large: Mi Trabajo */}
          <div className="lp-bw" style={{ ...card(0, { gridColumn: 'span 2' }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${INDIGO}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INDIGO }}><Target size={18} /></div>
              <span style={{ fontSize: 11, fontWeight: 700, color: INDIGO, letterSpacing: '.07em', textTransform: 'uppercase' }}>Mi Trabajo</span>
            </div>
            <div>
              <h3 style={{ fontFamily: D, fontSize: 'clamp(20px,2.2vw,26px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: 8 }}>Gestioná tus objetivos con evidencia real.</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, maxWidth: 500 }}>Objetivos individuales, grupales y compartidos. Adjuntá avances con evidencia concreta: archivos, URLs y notas. Cada meta queda documentada y verificable.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{l:'Lanzar campaña email Q3',p:88,c:GREEN,b:'Completado'},{l:'Certificación Google Analytics',p:60,c:INDIGO,b:'En progreso'},{l:'Reducir tiempo de respuesta',p:25,c:'#F87171',b:'En riesgo'}].map((o,i) => (
                <div key={i} style={{ background: '#F8F9FF', borderRadius: 10, padding: '10px 14px', border: '1px solid #EDEFFE', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A2E', marginBottom: 5 }}>{o.l}</p>
                    <div style={{ height: 3, borderRadius: 99, background: '#E8EAFB', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${o.p}%`, background: o.c, borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.c, background: `${o.c}18`, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>{o.b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mi Semana */}
          <div style={card(0.08)}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(124,58,237,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}><Calendar size={18} /></div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '.07em', textTransform: 'uppercase' }}>Mi Semana</span>
              <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em', lineHeight: 1.15, marginTop: 6 }}>Seguimiento semanal sin fricción.</h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.7 }}>Cierre semanal con 3 preguntas. El manager ve el resumen sin reuniones innecesarias. Racha de actividad para mantener el ritmo.</p>
            <div style={{ marginTop: 'auto', background: '#FFF7ED', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(251,146,60,.2)' }}>
              <Flame size={14} color="#F97316" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>5 semanas de racha</span>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="lp-bn" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div style={card(0.15)}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${GREEN}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN }}><CheckSquare size={18} /></div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '.07em', textTransform: 'uppercase' }}>Validación</span>
              <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em', lineHeight: 1.15, marginTop: 6 }}>Feedback verificado con firma digital.</h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.7 }}>Los managers validan logros confirmados por email. El historial queda en el perfil del empleado, portable y verificable. Anti-fraude incluido.</p>
          </div>

          <div style={card(0.22)}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(8,145,178,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891B2' }}><BarChart3 size={18} /></div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0891B2', letterSpacing: '.07em', textTransform: 'uppercase' }}>Analytics</span>
              <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em', lineHeight: 1.15, marginTop: 6 }}>Visión ejecutiva en tiempo real.</h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.7 }}>Índice organizacional, ranking de desempeño y señales automáticas de riesgo. Exportación a PDF y Excel en un clic.</p>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28, marginTop: 'auto' }}>
              {[40,55,62,58,72,74,80,84].map((v,i) => (
                <div key={i} style={{ flex: 1, background: `rgba(8,145,178,${.2+i*.1})`, borderRadius: '3px 3px 0 0', height: `${(v/100)*28}px` }} />
              ))}
            </div>
          </div>

          <div style={card(0.29)}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(217,119,6,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}><Brain size={18} /></div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', letterSpacing: '.07em', textTransform: 'uppercase' }}>IA · Insights</span>
              <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.03em', lineHeight: 1.15, marginTop: 6 }}>IA que convierte datos en decisiones.</h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.7 }}>Alertas predictivas de riesgo, recomendaciones de desarrollo personalizadas y briefings automáticos para managers cada lunes.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, opacity: v?1:0, transition: 'all .6s .35s ease' }}>
          <Link href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: BRAND, color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '13px 28px', textDecoration: 'none', transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity='.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity='1')}
          >Ver demo completo <ArrowRight size={14} /></Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   HOW IT WORKS (dark)
═══════════════════════════════════════════════ */
function HowItWorks() {
  const { ref, visible } = useVisible()
  const steps = [
    { n:'01', icon:<Target size={20} color={INDIGO_L}/>, title:'Alineás objetivos a la estrategia', desc:'Definí objetivos a nivel empresa, equipo e individuo. Cada colaborador entiende cómo su trabajo contribuye al resultado del negocio.' },
    { n:'02', icon:<Activity size={20} color={INDIGO_L}/>, title:'El equipo registra avances con evidencia', desc:'Avances periódicos, archivos y contexto real. No hay que confiar en la memoria — queda documentado en el historial.' },
    { n:'03', icon:<Shield size={20} color={INDIGO_L}/>, title:'Los managers validan y dan feedback', desc:'Validaciones confirmadas por email. Feedback estructurado y trazable. Reconocimientos que quedan en el perfil.' },
    { n:'04', icon:<Brain size={20} color={INDIGO_L}/>, title:'TRAZA genera insights con IA', desc:'Análisis automáticos, alertas de riesgo, recomendaciones de desarrollo y reportes ejecutivos en segundos.' },
  ]
  return (
    <section id="como-funciona" style={{ padding: '100px 24px', background: DARK }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px', opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: INDIGO_L, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Cómo funciona</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 16 }}>De cero a equipo de alto rendimiento en menos de una semana.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.48)', lineHeight: 1.7 }}>Sin consultoras, sin implementaciones de 6 meses. TRAZA se configura en horas.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 2 }}>
          {steps.map((s,i) => (
            <div key={i} style={{ background: GLASS, border: '1px solid rgba(255,255,255,.06)', borderRadius: i===0?'20px 0 0 20px':i===3?'0 20px 20px 0':'0', padding: '32px 26px', position: 'relative', overflow: 'hidden', opacity: visible?1:0, transform: visible?'none':'translateY(28px)', transition: `all .6s ${i*.12}s ease` }}>
              <span style={{ position: 'absolute', top: 10, right: 14, fontFamily: D, fontSize: 60, fontWeight: 900, color: 'rgba(255,255,255,.03)', letterSpacing: '-4px', lineHeight: 1 }}>{s.n}</span>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INDIGO_L, letterSpacing: '.07em', marginBottom: 8 }}>{s.n}</div>
              <h3 style={{ fontFamily: D, fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.35 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.43)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   AI SECTION (dark)
═══════════════════════════════════════════════ */
function AISection() {
  const { ref, visible } = useVisible()
  const feats = [
    { icon:<Brain size={14}/>, title:'Análisis de desempeño narrativo', desc:'Generá un análisis profundo de cualquier persona en segundos, basado en todos sus objetivos y validaciones.' },
    { icon:<AlertTriangle size={14}/>, title:'Alertas predictivas de riesgo', desc:'Detecta patrones de desmotivación antes de que sean evidentes. Actuá antes de perder talento.' },
    { icon:<Lightbulb size={14}/>, title:'Recomendaciones de desarrollo', desc:'Planes personalizados basados en las brechas detectadas. IA que actúa como coach.' },
    { icon:<RefreshCw size={14}/>, title:'Briefings semanales automáticos', desc:'Cada manager recibe el resumen de su equipo cada lunes. Sin buscar datos, sin armar reportes.' },
    { icon:<FileText size={14}/>, title:'Reportes ejecutivos en un clic', desc:'Generá reportes para comités con análisis, gráficos y conclusiones redactadas por IA.' },
    { icon:<Zap size={14}/>, title:'Insights de equipo en tiempo real', desc:'Patrones de desempeño colectivos y tendencias detectadas automáticamente.' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: DARK_S, position: 'relative', overflow: 'hidden' }} ref={ref}>
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(99,102,241,.13) 0%,transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-2c" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{ opacity: visible?1:0, transform: visible?'none':'translateY(24px)', transition: 'all .6s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 100, padding: '5px 14px 5px 8px', marginBottom: 24 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={10} color={INDIGO_L} /></div>
              <span style={{ fontSize: 12, fontWeight: 600, color: INDIGO_L }}>Inteligencia Artificial nativa</span>
            </div>
            <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,50px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 20 }}>
              IA que trabaja mientras vos liderás.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: 36 }}>
              TRAZA no es solo un repositorio de datos. Analiza patrones, detecta riesgos y genera recomendaciones accionables para tu equipo de RRHH.
            </p>
            <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: BRAND, fontWeight: 800, fontSize: 14, borderRadius: 11, padding: '13px 24px', textDecoration: 'none' }}>
              Explorar capacidades IA <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {feats.map((f,i) => (
              <div key={i} style={{ background: GLASS, border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18, opacity: visible?1:0, transform: visible?'none':'translateY(20px)', transition: `all .6s ${i*.07}s ease` }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, color: INDIGO_L }}>{f.icon}</div>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'white', marginBottom: 5, lineHeight: 1.35 }}>{f.title}</h4>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════ */
function Testimonials() {
  const { ref, visible } = useVisible()
  const ts = [
    { q:'Antes teníamos carpetas con PDFs de evaluaciones que nadie leía. Hoy tenemos datos en tiempo real y tomamos mejores decisiones sobre el talento. TRAZA cambió completamente cómo gestionamos el desempeño.', name:'María González', role:'Directora de RRHH', co:'TechCorp Argentina', stars:5 },
    { q:'El Índice TRAZA nos dio un lenguaje común para hablar de desempeño. Los managers ya no se basan en intuición — se basan en evidencia verificada. Los ascensos ahora son objetivos y nadie los discute.', name:'Carlos Medina', role:'CEO', co:'Grupo Meridian', stars:5 },
    { q:'La adopción fue lo que más nos sorprendió. Los empleados lo usan porque les sirve a ellos — construyen su historial portátil. En 3 semanas el 94% del equipo ya estaba activo.', name:'Valentina Ríos', role:'Chief People Officer', co:'InnovaLatam', stars:5 },
  ]
  return (
    <section style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: visible?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Casos de éxito</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06 }}>
            Empresas que transformaron<br />su gestión del talento.
          </h2>
        </div>

        {/* Featured quote */}
        <div style={{ background: '#F8F9FF', border: '1px solid #E8EAFB', borderRadius: 24, padding: '48px 52px', marginBottom: 18, opacity: visible?1:0, transition: 'all .6s ease', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, left: 36, fontFamily: 'Georgia,serif', fontSize: 130, color: '#E8EAFB', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>"</div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 22 }}>
              {Array.from({length:5}).map((_,j) => <Star key={j} size={14} fill="#FBBF24" color="#FBBF24" />)}
            </div>
            <p style={{ fontFamily: D, fontSize: 'clamp(18px,2.4vw,24px)', color: '#0A0A0A', lineHeight: 1.55, fontWeight: 600, marginBottom: 28, maxWidth: 860 }}>{ts[0].q}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${INDIGO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>MG</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>{ts[0].name}</p>
                <p style={{ fontSize: 12.5, color: '#64748B' }}>{ts[0].role} · {ts[0].co}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
          {ts.slice(1).map((t,i) => (
            <div key={i} style={{ background: '#F8F9FF', border: '1px solid #E8EAFB', borderRadius: 20, padding: 28, opacity: visible?1:0, transition: `all .6s ${(i+1)*.12}s ease` }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {Array.from({length:t.stars}).map((_,j) => <Star key={j} size={12} fill="#FBBF24" color="#FBBF24" />)}
              </div>
              <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>"{t.q}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #E8EAFB' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${INDIGO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{t.name[0]}{t.name.split(' ')[1][0]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{t.role} · {t.co}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   COMPARISON
═══════════════════════════════════════════════ */
function Comparison() {
  const { ref, visible } = useVisible()
  const rows = ['Gestión de objetivos estructurados con evidencia','Seguimiento continuo sin fricción','Validaciones verificadas por managers','Feedback estructurado y trazable','Dashboard en tiempo real','Análisis con Inteligencia Artificial','Historial portátil del profesional','Alertas predictivas de riesgo','Reportes automáticos y personalizables','Exportación estándar (PDF, Excel, JSON)']
  const cols = [
    { label:'TRAZA', vals:[true,true,true,true,true,true,true,true,true,true], hi:true },
    { label:'Excel / Sheets', vals:[false,'parcial',false,'parcial','parcial',false,false,false,false,false], hi:false },
    { label:'Proceso manual', vals:[false,false,false,false,false,false,false,false,false,false], hi:false },
  ]
  const Cell = ({v}:{v:boolean|string}) => {
    if (v===true) return <div style={{display:'flex',justifyContent:'center'}}><div style={{width:22,height:22,borderRadius:'50%',background:'#DCFCE7',display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12} color="#16A34A"/></div></div>
    if (v==='parcial') return <div style={{display:'flex',justifyContent:'center'}}><div style={{width:22,height:22,borderRadius:'50%',background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:10,fontWeight:800,color:'#D97706'}}>~</span></div></div>
    return <div style={{display:'flex',justifyContent:'center'}}><div style={{width:22,height:22,borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={11} color="#DC2626"/></div></div>
  }
  return (
    <section style={{ padding: '100px 24px', background: '#F8F9FF' }} ref={ref}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52, opacity: visible?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Comparativa</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06 }}>TRAZA vs. el resto.</h2>
        </div>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E8EAFB', overflow: 'hidden', opacity: visible?1:0, transition: 'all .6s .15s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '2px solid #F0F2FF' }}>
            <div style={{ padding: '18px 24px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '.08em', textTransform: 'uppercase' }}>Funcionalidad</div>
            {cols.map((c,i) => <div key={i} style={{ padding: '18px 16px', textAlign: 'center', background: c.hi ? BRAND : 'transparent', color: c.hi?'white':'#0A0A0A', fontSize: 13, fontWeight: 800 }}>{c.label}</div>)}
          </div>
          {rows.map((row,ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: ri<rows.length-1?'1px solid #F5F6FF':'none', background: ri%2===0?'white':'#FAFBFF' }}>
              <div style={{ padding: '13px 24px', fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{row}</div>
              {cols.map((c,ci) => <div key={ci} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ci===0?'rgba(28,43,144,.03)':'transparent' }}><Cell v={c.vals[ri]} /></div>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   PRICING (dark)
═══════════════════════════════════════════════ */
const PLANS = [
  { name:'Starter', desc:'Para profesionales individuales que quieren documentar su trayectoria.', monthly:0, annual:0, hi:false, cta:'Empezar gratis', ctaHref:'/registro', features:['1 usuario','Hasta 10 objetivos activos','Credencial pública verificada (Índice TRAZA)','Score individual basado en evidencia','Validaciones de manager o cliente externo','Historial portátil de carrera','Soporte por email'], no:['Dashboard de equipo','Reportes automáticos','Análisis con IA'] },
  { name:'Pro', desc:'Para equipos y PyMEs que quieren gestionar el desempeño con datos reales.', monthly:12, annual:9, hi:true, badge:'Más popular', cta:'Contratar ahora', ctaHref:'/checkout?plan=pro&period=annual', features:['Hasta 100 usuarios','Objetivos ilimitados','Dashboard de equipo en tiempo real','Validaciones de manager con email','Feedback estructurado y trazable','Reuniones 1:1 con registro de acuerdos','Análisis IA (30 créditos/mes)','Reportes automáticos y exportación','Notificaciones por email','Soporte prioritario en español'], no:[] },
  { name:'Enterprise', desc:'Para organizaciones que necesitan máxima flexibilidad, seguridad y soporte.', monthly:null, annual:null, hi:false, cta:'Hablar con ventas', ctaHref:'/registro/empresa', features:['Usuarios ilimitados','Administradores ilimitados','SSO / SAML','API completa y webhooks','IA ilimitada','Roles y permisos granulares','Períodos de evaluación personalizados','Auditoría y logs completos','99.9% de uptime garantizado','Manager de cuenta dedicado','Implementación guiada + capacitación'], no:[] },
]

function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [opFaq, setOpFaq] = useState<number|null>(null)
  const { ref, visible } = useVisible()
  const pFaq = [
    { q:'¿Puedo cambiar de plan en cualquier momento?', a:'Sí. Podés subir o bajar de plan cuando quieras. Los cambios se aplican al inicio del siguiente período de facturación.' },
    { q:'¿Qué pasa con los datos si me doy de baja?', a:'Tus datos son tuyos. Si cancelás, podés exportar toda tu información en cualquier formato estándar. No retenemos datos.' },
    { q:'¿El plan gratuito tiene límite de tiempo?', a:'No. El plan Starter es gratuito para siempre para profesionales individuales. Sin trial, sin tarjeta de crédito.' },
    { q:'¿Hay descuento para ONGs o instituciones educativas?', a:'Sí. Ofrecemos precios especiales para ONGs, universidades e instituciones sin fines de lucro. Contactanos.' },
  ]
  return (
    <section id="pricing" style={{ padding: '100px 24px', background: DARK }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 52px', opacity: visible?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: INDIGO_L, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Precios</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 28 }}>Precios simples y transparentes.</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 99, padding: 4 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: !annual?'rgba(255,255,255,.12)':'transparent', color: !annual?'white':'rgba(255,255,255,.4)', transition: 'all .2s' }}>Mensual</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: annual?'rgba(255,255,255,.12)':'transparent', color: annual?'white':'rgba(255,255,255,.4)', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 7 }}>
              Anual {annual && <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, background: 'rgba(34,197,94,.15)', padding: '2px 7px', borderRadius: 99 }}>-25%</span>}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 16, alignItems: 'start' }}>
          {PLANS.map((p,i) => (
            <div key={i} style={{ border: p.hi?'1px solid rgba(99,102,241,.45)':'1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 28, background: p.hi?'rgba(99,102,241,.09)':GLASS, position: 'relative', opacity: visible?1:0, transition: `all .6s ${i*.1}s ease`, boxShadow: p.hi?'0 0 50px rgba(99,102,241,.1)':'none' }}>
              {(p as any).badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: INDIGO, color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>{(p as any).badge}</div>}
              <h3 style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 6 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.42)', lineHeight: 1.5, marginBottom: 20, minHeight: 40 }}>{p.desc}</p>
              <div style={{ marginBottom: 24 }}>
                {p.monthly===null ? <div style={{ fontFamily: D, fontSize: 28, fontWeight: 900, color: 'white' }}>A convenir</div>
                : p.monthly===0 ? <div><span style={{ fontFamily: D, fontSize: 36, fontWeight: 900, color: 'white' }}>Gratis</span></div>
                : <div>
                    <span style={{ fontFamily: D, fontSize: 36, fontWeight: 900, color: 'white' }}>${annual?p.annual:p.monthly}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.38)' }}> USD/usuario/mes</span>
                    {annual && <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginTop: 4 }}>Facturación anual · ahorrás ${((p.monthly??0)-(p.annual??0))*12}/usuario/año</div>}
                  </div>}
              </div>
              <Link href={p.ctaHref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: p.hi?INDIGO:'rgba(255,255,255,.08)', color: 'white', border: p.hi?'none':'1px solid rgba(255,255,255,.1)', fontWeight: 700, fontSize: 14, borderRadius: 11, padding: '13px 20px', textDecoration: 'none', marginBottom: 24, transition: 'opacity .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='.82')}
                onMouseLeave={e=>(e.currentTarget.style.opacity='1')}
              >{p.cta} <ArrowRight size={14} /></Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.features.map((f,fi) => <div key={fi} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}><Check size={13} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }}/><span style={{ fontSize: 13.5, color: 'rgba(255,255,255,.68)' }}>{f}</span></div>)}
                {p.no.map((f,fi) => <div key={fi} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}><X size={13} color="rgba(255,255,255,.18)" style={{ flexShrink: 0, marginTop: 2 }}/><span style={{ fontSize: 13.5, color: 'rgba(255,255,255,.2)' }}>{f}</span></div>)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 680, margin: '60px auto 0' }}>
          <h3 style={{ fontFamily: D, fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 18, textAlign: 'center' }}>Preguntas sobre precios</h3>
          {pFaq.map((item,i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, marginBottom: 7, overflow: 'hidden' }}>
              <button onClick={() => setOpFaq(opFaq===i?null:i)} style={{ width: '100%', padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.78)' }}>{item.q}</span>
                <ChevronDown size={15} color="rgba(255,255,255,.35)" style={{ flexShrink: 0, transform: opFaq===i?'rotate(180deg)':'none', transition: 'transform .2s' }} />
              </button>
              {opFaq===i && <div style={{ padding: '0 18px 15px', fontSize: 14, color: 'rgba(255,255,255,.48)', lineHeight: 1.7, background: 'rgba(255,255,255,.02)' }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   SECURITY
═══════════════════════════════════════════════ */
function Security() {
  const { ref, visible } = useVisible()
  const items = [
    { icon:<Lock size={16}/>, title:'Encriptación end-to-end', desc:'AES-256 en reposo, TLS 1.3 en tránsito. Tus datos nunca viajan sin cifrado.' },
    { icon:<Shield size={16}/>, title:'Backups automáticos', desc:'Backups diarios con retención de 90 días. Recuperación garantizada en menos de 4h.' },
    { icon:<Users size={16}/>, title:'Roles y permisos granulares', desc:'Control total sobre quién ve qué. Roles personalizables por empresa y área.' },
    { icon:<Database size={16}/>, title:'Infraestructura cloud premium', desc:'Alojado en AWS con redundancia multi-AZ. 99.9% de uptime garantizado.' },
    { icon:<UserCheck size={16}/>, title:'Autenticación 2FA', desc:'2FA disponible para todos los usuarios. SSO/SAML para Enterprise.' },
    { icon:<FileText size={16}/>, title:'Logs de auditoría completos', desc:'Registro completo de todas las acciones en la plataforma. Cumplimiento GDPR.' },
  ]
  return (
    <section style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-2c" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div style={{ opacity: visible?1:0, transition: 'all .6s ease' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Seguridad</p>
            <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 18 }}>Seguridad enterprise de serie, no como extra.</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.75, marginBottom: 32 }}>TRAZA fue construido con seguridad como principio. Cumplimiento GDPR, encriptación end-to-end y auditorías completas incluidas en todos los planes.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['GDPR Compliant','SOC 2','99.9% uptime','AWS Hosted'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F0F2FF', border: '1px solid #D1D9F8', borderRadius: 20, padding: '6px 14px' }}>
                  <Shield size={11} color={BRAND}/><span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {items.map((item,i) => (
              <div key={i} style={{ background: '#F8F9FF', border: '1px solid #E8EAFB', borderRadius: 16, padding: 18, opacity: visible?1:0, transition: `all .6s ${i*.08}s ease` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: BRAND }}>{item.icon}</div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 5, lineHeight: 1.3 }}>{item.title}</h4>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   INTEGRATIONS
═══════════════════════════════════════════════ */
function Integrations() {
  const { ref, visible } = useVisible()
  const apps = [
    {name:'Microsoft Teams',color:'#6264A7'},{name:'Google Workspace',color:'#4285F4'},
    {name:'Microsoft 365',color:'#D83B01'},{name:'Outlook Calendar',color:'#0078D4'},
    {name:'Google Calendar',color:'#1A73E8'},{name:'Zapier',color:'#FF4A00'},
    {name:'Webhooks',color:'#374151'},{name:'API REST',color:'#16A34A'},{name:'Zoom',color:'#2D8CFF'},
  ]
  return (
    <section style={{ padding: '100px 24px', background: '#F8F9FF' }} ref={ref}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 52, opacity: visible?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Integraciones</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06, marginBottom: 14 }}>Se integra con las herramientas que ya usás.</h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>Sin migraciones forzadas, sin cambiar de herramientas.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {apps.map((a,i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E8EAFB', borderRadius: 14, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8, opacity: visible?1:0, transition: `all .5s ${i*.05}s ease` }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={12} color="white"/></div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{a.name}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, padding: '13px 20px', background: '#F0F2FF', border: '1px solid #D1D9F8', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <Zap size={13} color={BRAND}/><span style={{ fontSize: 13, color: BRAND, fontWeight: 600 }}>¿No ves tu herramienta? Si no existe, lo construimos.</span>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════ */
const FAQ_ITEMS = [
  { q:'¿Qué es TRAZA y en qué se diferencia de otras plataformas?', a:'TRAZA es una plataforma de gestión del desempeño basada en evidencia objetiva y verificada. Combina gestión de objetivos, validaciones verificadas por managers, historial portátil del profesional e IA nativa en una sola plataforma. El diferencial clave: el historial de desempeño pertenece al empleado, no solo a la empresa.' },
  { q:'¿Cuánto tiempo lleva implementar TRAZA?', a:'La configuración inicial tarda menos de 30 minutos. La adopción del equipo, en promedio, se logra en menos de una semana. No necesitás consultoras externas ni meses de implementación.' },
  { q:'¿Necesito cambiar mis procesos actuales?', a:'No necesariamente. TRAZA se adapta a tu metodología actual, ya sea OKRs, MBOs o evaluaciones por competencias. Podés empezar de a poco e incorporar funcionalidades progresivamente.' },
  { q:'¿TRAZA funciona para empresas de cualquier tamaño?', a:'Sí. Tenemos clientes desde 5 hasta más de 500 empleados. El plan Pro escala hasta 100 usuarios, y el plan Enterprise no tiene límite.' },
  { q:'¿Los empleados pueden usar TRAZA de forma individual?', a:'Sí. Cualquier profesional puede crear su cuenta gratuita, registrar objetivos, obtener validaciones externas y construir su historial portátil. La empresa no necesita adoptar TRAZA para que el empleado lo use.' },
  { q:'¿Cómo funciona el Índice TRAZA?', a:'El Índice TRAZA es un score de 0 a 100 calculado a partir de 5 dimensiones: Validación de Superiores (35%), Cumplimiento (25%), Regularidad (20%), Alineación (10%) y Proactividad (10%). Se calcula automáticamente.' },
  { q:'¿Qué pasa con los datos si me doy de baja?', a:'Los datos son tuyos. Al darte de baja podés exportar toda la información en formatos estándar. No retenemos datos personales y cumplimos con GDPR.' },
  { q:'¿Puedo probar TRAZA antes de contratar?', a:'Sí. El plan Starter es gratuito para siempre. Para el plan Pro, ofrecemos prueba de 14 días sin tarjeta de crédito. Para Enterprise, coordinaremos una demo personalizada.' },
  { q:'¿Cómo funciona la validación de managers?', a:'Enviás un link por email al manager o cliente. Esa persona accede, revisa el trabajo y lo valida con su firma digital. La validación queda registrada con timestamp y verificación de email para evitar fraudes.' },
  { q:'¿TRAZA tiene app móvil?', a:'Actualmente TRAZA funciona como Progressive Web App (PWA), optimizada para mobile. Podés instalarla como app en iOS y Android desde el navegador. Una app nativa está en nuestra roadmap.' },
]

function FAQ() {
  const [open, setOpen] = useState<number|null>(null)
  const { ref, visible } = useVisible()
  return (
    <section id="faq" style={{ padding: '100px 24px', background: 'white' }} ref={ref}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52, opacity: visible?1:0, transition: 'all .6s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Preguntas frecuentes</p>
          <h2 style={{ fontFamily: D, fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#0A0A0A', letterSpacing: '-.04em', lineHeight: 1.06 }}>Todo lo que necesitás saber.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FAQ_ITEMS.map((item,i) => (
            <div key={i} style={{ border: '1px solid #E8EAFB', borderRadius: 12, overflow: 'hidden', opacity: visible?1:0, transition: `all .5s ${Math.min(i*.03,.4)}s ease` }}>
              <button onClick={() => setOpen(open===i?null:i)} style={{ width: '100%', padding: '17px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, background: open===i?'#F8F9FF':'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.5 }}>{item.q}</span>
                <ChevronDown size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2, transform: open===i?'rotate(180deg)':'none', transition: 'transform .2s' }} />
              </button>
              {open===i && <div style={{ padding: '0 20px 17px', fontSize: 14.5, color: '#64748B', lineHeight: 1.75, background: '#F8F9FF' }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section style={{ padding: '120px 24px', background: DARK, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,.4),transparent)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white"/><path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white"/></svg>
        </div>
        <h2 style={{ fontFamily: D, fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.04, marginBottom: 20 }}>
          Tu equipo merece gestión del desempeño basada en evidencia.
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.48)', lineHeight: 1.75, marginBottom: 44, maxWidth: 500, margin: '0 auto 44px' }}>
          Empezá hoy. Configuración en 30 minutos. Sin compromisos de largo plazo.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <Link href="/registro/empresa" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'white', color: BRAND, fontWeight: 800, fontSize: 15, borderRadius: 13, padding: '15px 30px', textDecoration: 'none', transition: 'transform .2s, box-shadow .2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(255,255,255,.14)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
          >Solicitar demo gratuita <ArrowRight size={15} /></Link>
          <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,.72)', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,.15)', borderRadius: 13, padding: '14px 26px', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.3)'; e.currentTarget.style.color='white' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.15)'; e.currentTarget.style.color='rgba(255,255,255,.72)' }}
          >Empezar gratis como profesional</Link>
        </div>
        <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Sin tarjeta de crédito','Setup en 30 minutos','Cancela cuando quieras'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color={TEAL} /><span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.38)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════ */
function Footer() {
  const cols = [
    { title:'Producto', links:['Mi Trabajo','Mi Semana','Mi Equipo','Validación','Analytics','Reuniones 1:1','IA y Análisis','Credencial pública'] },
    { title:'Empresa', links:['Sobre TRAZA','Blog','Changelog','Status'] },
    { title:'Recursos', links:['Documentación','API Reference','Guía de inicio rápido','Casos de éxito'] },
    { title:'Legal', links:[{label:'Política de privacidad',href:'/politica-de-privacidad'},{label:'Términos de uso',href:'/terminos-y-condiciones'}] },
  ]
  return (
    <footer style={{ background: '#05070D', padding: '64px 24px 32px', borderTop: '1px solid rgba(255,255,255,.04)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="lp-fc" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1C2B90"/><rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white"/><path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white"/></svg>
              <span style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-.5px' }}>traza</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#3D4663', lineHeight: 1.7, marginBottom: 24, maxWidth: 230 }}>La plataforma de performance management que tu equipo realmente usa.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{icon:<Linkedin size={14}/>,href:'#'},{icon:<Mail size={14}/>,href:'mailto:hola@traza.ar'},{icon:<Phone size={14}/>,href:'#'}].map((s,i) => (
                <a key={i} href={s.href} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D4663', textDecoration: 'none', transition: 'background .15s, color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background=INDIGO; e.currentTarget.style.color='white' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#3D4663' }}
                >{s.icon}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2D3553', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 18 }}>{col.title}</p>
              {col.links.map((l:any) => {
                const label = typeof l==='string'?l:l.label
                const href  = typeof l==='string'?'#':l.href
                return (
                  <a key={label} href={href} style={{ display: 'block', fontSize: 13.5, color: '#3D4663', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color='#3D4663')}
                  >{label}</a>
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.04)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <p style={{ fontSize: 12.5, color: '#2D3553' }}>© 2026 TRAZA. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[{label:'Privacidad',href:'/politica-de-privacidad'},{label:'Términos',href:'/terminos-y-condiciones'},{label:'Cookies',href:'#'}].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 12.5, color: '#2D3553', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,.5)')}
                onMouseLeave={e=>(e.currentTarget.style.color='#2D3553')}
              >{l.label}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#1E2440' }}>Construido en Argentina. Para equipos de todo el mundo.</p>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: B, backgroundColor: DARK, color: '#0A0A0A' }}>
      <style>{CSS}</style>
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
      <Security />
      <Integrations />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
