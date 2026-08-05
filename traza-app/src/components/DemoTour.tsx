'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'
const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"

// ── Step definitions ──────────────────────────────────────

type Step = {
  page: string
  selector?: string
  title: string
  body: string
  isFinal?: boolean
  ctaHref?: string
  ctaLabel?: string
}

const TOURS: Record<string, Step[]> = {
  profesional: [
    {
      page: '/dashboard',
      selector: '#demo-indice-card',
      title: 'Tu Índice TRAZA — cómo se calcula',
      body: 'Un número de 0 a 100 basado en 5 factores: Validación externa (35%), Cumplimiento de objetivos (25%), Regularidad semanal (20%), Alineación estratégica (10%) y Proactividad (10%). Nada subjetivo — todo basado en tu historial.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-objetivos-header',
      title: 'Registrá objetivos con evidencia',
      body: 'Cada objetivo tiene categoría, fecha límite y evidencia adjunta: comentarios, archivos o links. Agregar objetivos propios suma en Proactividad (10%). Completarlos en fecha mejora Cumplimiento (25%).',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-primer-objetivo',
      title: 'Validación externa — el factor más pesado',
      body: 'Al completar un objetivo invitás a un cliente o colega a validarlo por email. Ellos confirman sin necesidad de crear cuenta. Esa validación vale el 35% del Índice — es lo que hace que el número sea creíble.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Cierre semanal — Regularidad (20%)',
      body: '¿Qué avancé? ¿Qué me trabó? ¿Qué necesito? Tres preguntas cada viernes. La consistencia semana a semana vale el 20% del Índice. Si no registrás, el score baja aunque hayas completado objetivos.',
    },
    {
      page: '/perfil',
      selector: '#demo-perfil-header',
      title: 'Tu perfil profesional completo',
      body: 'Historial consolidado por empresa: objetivos, validaciones confirmadas, score global de toda tu carrera y el informe descargable en PDF. Todo organizado para mostrarte a clientes o empleadores.',
    },
    {
      page: '/dashboard',
      selector: '#demo-credencial-cta',
      title: 'Tu credencial es portátil y permanente',
      body: 'Este link es tuyo para siempre. Lo compartís con cualquier empleador o cliente sin depender de referencias de terceros. Controlás si es público o privado — el historial siempre te acompaña.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA',
      body: 'Tu historial profesional verificado, construido objetivo por objetivo. Validación (35%) + Cumplimiento (25%) + Regularidad (20%) + Alineación (10%) + Proactividad (10%) = tu reputación real.',
      ctaHref: '/registro',
      ctaLabel: 'Empezar gratis',
    },
  ],

  empleado: [
    {
      page: '/dashboard',
      selector: '#demo-indice-card',
      title: 'Tu Índice TRAZA en la empresa',
      body: 'Un número de 0 a 100 con 5 factores: Validación del manager (35%), Cumplimiento de objetivos (25%), Regularidad semanal (20%), Alineación con las prioridades del área (10%) y Proactividad (10%). Tu manager lo ve, vos lo construís.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-objetivos-header',
      title: 'Objetivos asignados y propios',
      body: 'Acá están los objetivos que te asignó tu empresa y los que agregaste vos. Agregar objetivos propios suma en Proactividad (10%). Que estén alineados a las prioridades del área mejora Alineación (10%).',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-primer-objetivo',
      title: 'Validación del manager — el factor más pesado',
      body: 'Al completar un objetivo, tu supervisor lo revisa y lo valida. También podés pedir validación a un cliente externo. Ese aval vale el 35% del Índice — y queda registrado permanentemente en tu historial.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Cierre semanal — Regularidad (20%)',
      body: '¿Qué avancé? ¿Qué me trabó? ¿Qué necesito? Tres preguntas cada viernes. La consistencia continua vale el 20% del Índice. Tu manager ve el resumen sin reuniones de status — menos interrupciones, más contexto.',
    },
    {
      page: '/reuniones',
      selector: '#demo-reuniones-header',
      title: 'Reuniones 1:1 con registro permanente',
      body: 'Agendás y registrás cada 1:1: agenda, notas y acuerdos. Todo queda vinculado a tu perfil. Nunca más "de eso no hablamos" en la evaluación anual — el historial respalda la conversación.',
    },
    {
      page: '/perfil',
      selector: '#demo-perfil-header',
      title: 'Tu historial te sigue a donde vayas',
      body: 'Cuando cambiás de trabajo, tu historial verificado viene con vos. Controlás si tu credencial es pública para que empleadores te encuentren. El historial es tuyo — no de la empresa.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA para empleados',
      body: 'Registrá tu trabajo real. Validación (35%) + Cumplimiento (25%) + Regularidad (20%) + Alineación (10%) + Proactividad (10%) = un historial que te acompaña toda la carrera.',
      ctaHref: '/registro',
      ctaLabel: 'Empezar gratis',
    },
  ],

  manager: [
    {
      page: '/dashboard',
      selector: '#demo-metricas-equipo',
      title: 'El desempeño del equipo de un vistazo',
      body: 'Cada colaborador tiene su Índice TRAZA. Ves cumplimiento, regularidad y validaciones pendientes — todo en tiempo real, sin pedir reportes manuales ni esperar al fin de mes.',
    },
    {
      page: '/dashboard',
      selector: '#demo-actividad-equipo',
      title: 'Actividad del equipo sin reuniones de status',
      body: 'Cada avance, archivo o link que sube tu equipo aparece acá. Ves qué está pasando en cada objetivo sin interrumpirlos. Menos reuniones, más contexto real.',
    },
    {
      page: '/equipo',
      selector: '#demo-team-list',
      title: 'Vista individual — Índice Traza por persona',
      body: 'Cada persona tiene su propio Índice: Cumplimiento (25%), Regularidad (20%), cuántas validaciones confirmó y cómo está su Alineación. Ves quién va bien y quién necesita atención antes de que sea tarde.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-primer-objetivo',
      title: 'Validás objetivos — 35% del score del colaborador',
      body: 'El factor más pesado del Índice es la Validación del supervisor (35%). Cuando validás un objetivo de tu equipo, ese aval queda registrado en su historial — permanente, verificable y portátil.',
    },
    {
      page: '/analytics',
      selector: '#demo-analytics-header',
      title: 'Señales automáticas de riesgo',
      body: 'TRAZA detecta automáticamente quién lleva más de 2 semanas sin registrar avances (Regularidad en caída), discrepancias entre autoevaluación y validación, y objetivos próximos a vencer. Información que antes se perdía.',
    },
    {
      page: '/reuniones',
      selector: '#demo-reuniones-header',
      title: 'Reuniones 1:1 con seguimiento real',
      body: 'Agendás, registrás notas y acuerdos, y fijás la próxima fecha. Todo queda vinculado al historial del colaborador. La evaluación formal parte de datos reales — no de la memoria del último mes.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Tu propio Índice como manager',
      body: 'Como manager también tenés tu historial personal. Tu Regularidad (20%) y Proactividad (10%) se construyen semana a semana. El equipo lo ve — liderar con el ejemplo también suma al score.',
    },
    {
      page: '/reportes',
      selector: '#demo-reportes-header',
      title: 'Evaluaciones formales y reportes exportables',
      body: 'Creás períodos formales de evaluación — mensual, trimestral o anual — con score consolidado por persona. Exportás los datos del equipo en PDF o Excel con un clic.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA para managers',
      body: 'Gestión basada en datos reales. Validación (35%) + Cumplimiento (25%) + Regularidad (20%) + Alineación (10%) + Proactividad (10%) = evaluaciones honestas, sin sesgos de memoria.',
      ctaHref: '/registro/empresa',
      ctaLabel: 'Registrar mi empresa',
    },
  ],
}

// ── Utilities ─────────────────────────────────────────────

function waitForElement(selector: string, timeoutMs = 4000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) { observer.disconnect(); resolve(found) }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { observer.disconnect(); resolve(document.querySelector(selector)) }, timeoutMs)
  })
}

type Rect = { top: number; left: number; width: number; height: number }

function getPopoverStyle(rect: Rect | null, popoverH: number): React.CSSProperties {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const PAD    = 20
  const POP_W  = 340
  const viewH  = window.innerHeight
  const viewW  = window.innerWidth

  let top: number
  const spaceBelow = viewH - rect.top - rect.height
  const spaceAbove = rect.top

  if (spaceBelow >= popoverH + PAD) {
    top = rect.top + rect.height + PAD
  } else if (spaceAbove >= popoverH + PAD) {
    top = rect.top - popoverH - PAD
  } else {
    top = Math.max(PAD, rect.top)
  }

  let left = rect.left + rect.width / 2 - POP_W / 2
  left = Math.max(PAD, Math.min(left, viewW - POP_W - PAD))

  return { top, left }
}

// ── Component ─────────────────────────────────────────────

export default function DemoTour() {
  const pathname = usePathname()
  const router   = useRouter()

  const [role,     setRole]     = useState<string | null>(null)
  const [stepIdx,  setStepIdx]  = useState(0)
  const [rect,     setRect]     = useState<Rect | null>(null)
  const [visible,  setVisible]  = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // ── Load role from sessionStorage on mount ──
  useEffect(() => {
    const r = sessionStorage.getItem('demo_role')
    const s = sessionStorage.getItem('demo_step')
    if (r && TOURS[r]) {
      setRole(r)
      setStepIdx(s ? parseInt(s, 10) : 0)
    }
  }, [])

  // ── Activate step when pathname or stepIdx changes ──
  useEffect(() => {
    if (!role) return
    const steps = TOURS[role]
    if (!steps || stepIdx >= steps.length) return

    const step = steps[stepIdx]

    if (step.page !== pathname) {
      router.push(step.page)
      return
    }

    activateStep(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, role, stepIdx])

  // ── Apply highlight and position popover ──
  // No se oculta el popover durante la navegación para evitar el parpadeo
  const activateStep = useCallback(async (step: Step) => {
    document.querySelectorAll('.traza-tour-highlight').forEach(el => {
      el.classList.remove('traza-tour-highlight')
    })

    if (step.selector) {
      const el = await waitForElement(step.selector)
      if (el) {
        el.classList.add('traza-tour-highlight')
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          setVisible(true)
        }, 400)
      } else {
        setRect(null)
        setVisible(true)
      }
    } else {
      setRect(null)
      setVisible(true)
    }
  }, [])

  // ── Cerrar tour sin salir del demo ──
  const closeTour = useCallback(() => {
    document.querySelectorAll('.traza-tour-highlight').forEach(el => {
      el.classList.remove('traza-tour-highlight')
    })
    sessionStorage.removeItem('demo_role')
    sessionStorage.removeItem('demo_step')
    setVisible(false)
    setRole(null)
  }, [])

  // ── Finalizar demo: cerrar sesión y volver a la landing ──
  const finalizarDemo = useCallback(async () => {
    document.querySelectorAll('.traza-tour-highlight').forEach(el => {
      el.classList.remove('traza-tour-highlight')
    })
    sessionStorage.removeItem('demo_role')
    sessionStorage.removeItem('demo_step')
    setVisible(false)
    setRole(null)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }, [router])

  const goTo = useCallback((idx: number) => {
    if (!role) return
    const steps = TOURS[role]
    if (idx < 0 || idx >= steps.length) return
    sessionStorage.setItem('demo_step', String(idx))
    setStepIdx(idx)
  }, [role])

  const nextStep = useCallback(() => {
    if (!role) return
    const steps = TOURS[role]
    if (stepIdx + 1 >= steps.length) {
      finalizarDemo()
      return
    }
    goTo(stepIdx + 1)
  }, [role, stepIdx, goTo, finalizarDemo])

  const prevStep = useCallback(() => {
    goTo(stepIdx - 1)
  }, [stepIdx, goTo])

  if (!visible || !role) return null

  const steps = TOURS[role]
  const step  = steps[stepIdx]

  const popoverH = step.isFinal ? 260 : 200
  const style    = getPopoverStyle(rect, popoverH)
  const progress = ((stepIdx + 1) / steps.length) * 100

  return (
    <>
      <style>{`
        .traza-tour-highlight {
          outline: 3px solid ${PRIMARY} !important;
          outline-offset: 5px !important;
          border-radius: 12px !important;
          position: relative !important;
          z-index: 1000 !important;
          transition: outline 0.2s ease;
        }
        .traza-tour-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.38);
          z-index: 998;
          pointer-events: none;
        }
      `}</style>

      <div className="traza-tour-backdrop" />

      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          zIndex: 1001,
          width: 340,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, backgroundColor: '#E2E8F0', position: 'relative' }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${BRAND}, ${PRIMARY})`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F1F5F9' }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 12, color: BRAND }}>
              TRAZA Demo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {stepIdx + 1} / {steps.length}
            </span>
            <button
              onClick={closeTour}
              title="Cerrar guía"
              style={{
                width: 24, height: 24, borderRadius: 6,
                backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={13} color="#64748B" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <h3 style={{
            fontFamily: DISPLAY, fontWeight: 700, fontSize: 15,
            color: '#0F172A', marginBottom: 8, lineHeight: 1.35,
          }}>
            {step.title}
          </h3>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            {step.body}
          </p>

          {/* CTA final */}
          {step.isFinal && step.ctaHref && (
            <a
              href={step.ctaHref}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 16, paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
                color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', fontFamily: DISPLAY,
              }}
            >
              {step.ctaLabel}
            </a>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === stepIdx ? 16 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: i === stepIdx ? PRIMARY : '#CBD5E1',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid #F1F5F9', gap: 8 }}
        >
          <button
            onClick={prevStep}
            disabled={stepIdx === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              borderRadius: 8, border: '1px solid #E2E8F0', cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: '#fff', color: stepIdx === 0 ? '#CBD5E1' : '#64748B',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <button
            onClick={nextStep}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})`,
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: DISPLAY,
            }}
          >
            {step.isFinal ? 'Finalizar demo' : 'Siguiente'}
            {!step.isFinal && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </>
  )
}
