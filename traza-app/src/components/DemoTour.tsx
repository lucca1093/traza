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
      title: 'Tu Índice TRAZA',
      body: 'Un número de 0 a 100 que resume tu desempeño real. Se calcula combinando objetivos completados, validaciones recibidas, consistencia semanal y años de trayectoria verificada — no con opiniones subjetivas.',
    },
    {
      page: '/dashboard',
      selector: '#demo-credencial-cta',
      title: 'Tu historial es portátil',
      body: 'Este link es tuyo para siempre. Lo compartís con empleadores o clientes para mostrar tu track record verificado. No depende de ninguna empresa — te acompaña toda la carrera.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-objetivos-header',
      title: 'Registrás tu trabajo con evidencia',
      body: 'Cada objetivo tiene descripción, categoría, fecha límite y evidencia: comentarios, archivos o links. Todo queda trazable. Así construís un historial de desempeño real, no una autobiografía.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-primer-objetivo',
      title: 'Validaciones de clientes y colegas',
      body: 'Cuando completás un objetivo, invitás a un cliente o colega a validarlo. Ellos confirman por email sin necesidad de crear una cuenta. Esa confirmación externa es lo que hace que tu score sea creíble.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Cierre semanal — 3 preguntas',
      body: '¿Qué avancé esta semana? ¿Qué me trabó? ¿Qué necesito para la próxima? Tres preguntas cada viernes. El registro continuo construye tu historial y alimenta el análisis de IA de tu perfil.',
    },
    {
      page: '/perfil',
      selector: '#demo-perfil-header',
      title: 'Tu perfil profesional completo',
      body: 'Acá ves tu historial consolidado: objetivos por empresa, score global de toda tu carrera, validaciones confirmadas y el PDF de tu informe. También controlás si tu credencial es pública o privada.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA',
      body: 'Tu historial profesional verificado, construido objetivo por objetivo. Empezá gratis hoy — siempre es tuyo, sin importar dónde trabajes.',
      ctaHref: '/registro',
      ctaLabel: 'Empezar gratis',
    },
  ],

  empleado: [
    {
      page: '/dashboard',
      selector: '#demo-indice-card',
      title: 'Tu Índice TRAZA',
      body: 'Un número de 0 a 100 que resume tu desempeño real en esta empresa. Se calcula con objetivos completados, validaciones del manager, consistencia semanal y tu autoevaluación — no con la memoria de nadie.',
    },
    {
      page: '/dashboard',
      selector: '#demo-credencial-cta',
      title: 'Tu historial te pertenece',
      body: 'Cuando cambiás de trabajo, tu historial verificado viene con vos. Es tu reputación profesional — no le pertenece a la empresa. Lo compartís con quien quieras desde tu link personal.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-objetivos-header',
      title: 'Objetivos con evidencia',
      body: 'Acá ves todos tus objetivos: los asignados por tu empresa y los que agregaste vos. A cada uno le podés cargar avances con comentarios, archivos o links. Todo queda registrado con fecha.',
    },
    {
      page: '/mi-trabajo',
      selector: '#demo-primer-objetivo',
      title: 'Validación directa del manager',
      body: 'Al completar un objetivo, tu supervisor lo revisa y lo valida o pide ajustes. También podés pedir validación a un cliente externo. Ese doble respaldo hace que el resultado sea confiable.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Cierre semanal — 3 preguntas',
      body: '¿Qué avancé? ¿Qué me trabó? ¿Qué necesito? Tres preguntas cada viernes. Le da contexto a tu manager sin reuniones de status. Además construye tu historial y alimenta el análisis con IA.',
    },
    {
      page: '/reuniones',
      selector: '#demo-reuniones-header',
      title: 'Reuniones 1:1 con tu manager',
      body: 'Acá quedan registradas tus reuniones con el manager: agenda, notas, acuerdos y fecha de la próxima. Todo vinculado a tu perfil. Nunca más "de eso no hablamos" en la evaluación.',
    },
    {
      page: '/perfil',
      selector: '#demo-perfil-header',
      title: 'Tu perfil profesional',
      body: 'Tu historial consolidado por empresa: objetivos, scores, validaciones confirmadas y el informe descargable en PDF. También controlás si tu credencial es pública para que empleadores te encuentren.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA para empleados',
      body: 'Registrá tu trabajo real, conseguí validaciones y construí un historial que te acompaña toda la carrera.',
      ctaHref: '/registro',
      ctaLabel: 'Empezar gratis',
    },
  ],

  manager: [
    {
      page: '/dashboard',
      selector: '#demo-metricas-equipo',
      title: 'Tu equipo de un vistazo',
      body: 'Colaboradores activos, objetivos en curso, completados en el período y % de cumplimiento. Números reales, siempre actualizados — sin pedir reportes manuales ni esperar al fin de mes.',
    },
    {
      page: '/dashboard',
      selector: '#demo-actividad-equipo',
      title: 'Actividad del equipo en tiempo real',
      body: 'Cada avance, link o archivo que sube tu equipo aparece acá. Ves qué está pasando en cada objetivo sin necesitar reuniones de status. Menos interrupciones, más contexto.',
    },
    {
      page: '/equipo',
      selector: '#demo-team-list',
      title: 'Vista individual de cada colaborador',
      body: 'Cada persona tiene su Índice TRAZA, sus objetivos en curso y el resumen de su semana. Ves quién va bien, quién necesita atención y cuánto avanzó — todo en un solo lugar.',
    },
    {
      page: '/analytics',
      selector: '#demo-analytics-header',
      title: 'Señales automáticas de riesgo',
      body: 'TRAZA detecta automáticamente: quién lleva más de 2 semanas sin registrar avances, discrepancias entre autoevaluación y validación del supervisor, y objetivos próximos a vencer. Información que antes se perdía.',
    },
    {
      page: '/reuniones',
      selector: '#demo-reuniones-header',
      title: 'Reuniones 1:1 con seguimiento',
      body: 'Agendás reuniones 1 a 1, registrás agenda, notas y acuerdos, y fijás la próxima fecha. Todo queda vinculado al historial del colaborador. Nunca más partís de cero en cada reunión.',
    },
    {
      page: '/mi-semana',
      selector: '#demo-cierre-semanal',
      title: 'Tu propio cierre semanal',
      body: 'Como manager también tenés tu historial personal. Registrás tus avances, obstáculos y necesidades cada semana. Eso alimenta tu propio Índice TRAZA y tu perfil profesional.',
    },
    {
      page: '/reportes',
      selector: '#demo-reportes-header',
      title: 'Reportes y ciclos de evaluación',
      body: 'Exportás datos de performance del equipo en Excel o PDF. También creás períodos formales de evaluación — mensual, trimestral o anual — y generás el cierre oficial con score consolidado por persona.',
    },
    {
      page: '/dashboard',
      isFinal: true,
      title: 'Eso es TRAZA para managers',
      body: 'Gestión basada en datos reales. Evaluaciones honestas, historial verificado, y un equipo que sabe exactamente en qué trabaja.',
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
