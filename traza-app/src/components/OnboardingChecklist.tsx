'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, Circle, ChevronRight, X,
  Target, Calendar, Send, Users, CheckSquare,
  MessageSquare, Activity, User,
} from 'lucide-react'
import Link from 'next/link'

// ── Anillo de progreso ────────────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  const r    = 18
  const circ = 2 * Math.PI * r
  const pct  = total > 0 ? done / total : 0
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="#EEF2FF" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={done === total ? '#16a34a' : '#3350D0'}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
      />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="800"
        fill={done === total ? '#16a34a' : '#1C2B90'}>
        {done}/{total}
      </text>
    </svg>
  )
}

// ── Tipos ─────────────────────────────────────────────────────
interface CheckStep {
  key:   string
  done:  boolean
  icon:  React.ReactNode
  label: string
  sub:   string
  href:  string
  cta:   string
}

function subtitulo(done: number, total: number): string {
  if (done === 0)         return 'Completá estos pasos para empezar a construir tu historial.'
  if (done === total)     return 'Tu historial está listo para crecer.'
  if (done === total - 1) return '¡Un paso más y listo!'
  return `${done} de ${total} pasos completados. Seguí avanzando.`
}

// ── Componente ────────────────────────────────────────────────
export default function OnboardingChecklist() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [steps,   setSteps]   = useState<CheckStep[]>([])
  const [dimKey,  setDimKey]  = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Clave de dismiss por usuario (v2 para resetear la anterior)
      const key = `traza_onb_v2_${user.id}`
      setDimKey(key)
      if (localStorage.getItem(key) === '1') { setLoading(false); return }

      // Perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('rol, empresa_id')
        .eq('id', user.id)
        .single()

      const rol       = profile?.rol ?? 'individuo'
      const empresaId = profile?.empresa_id ?? null
      const esSupervisor = rol === 'supervisor' || rol === 'admin' || rol === 'super_admin'
      const esEmpleado   = rol === 'empleado' && !!empresaId
      const esIndividuo  = !esSupervisor && !esEmpleado

      // Persona del usuario
      let personaId: string | null = null
      let empresaActual: string | null = null

      if (esIndividuo) {
        const { data: p } = await supabase
          .from('personas')
          .select('id, empresa_actual_nombre')
          .eq('user_id', user.id)
          .is('empresa_id', null)
          .maybeSingle()
        personaId    = p?.id ?? null
        empresaActual = p?.empresa_actual_nombre ?? null
      } else {
        const { data: p } = await supabase
          .from('personas')
          .select('id')
          .eq('user_id', user.id)
          .eq('empresa_id', empresaId!)
          .maybeSingle()
        personaId = p?.id ?? null
      }

      // ── Checks comunes ─────────────────────────────────────
      const [
        { count: objCount },
        { count: avCount },
        { count: cierreCount },
      ] = await Promise.all([
        supabase.from('objetivos').select('*', { count: 'exact', head: true })
          .eq('persona_id', personaId ?? ''),
        supabase.from('objetivo_avances').select('*', { count: 'exact', head: true })
          .eq('persona_id', personaId ?? ''),
        supabase.from('cierres_semanales').select('*', { count: 'exact', head: true })
          .eq('persona_id', personaId ?? ''),
      ])

      const tieneObj    = (objCount    ?? 0) > 0
      const tieneAvance = (avCount     ?? 0) > 0
      const tieneCierre = (cierreCount ?? 0) > 0

      let builtSteps: CheckStep[] = []

      // ── INDIVIDUO ──────────────────────────────────────────
      if (esIndividuo) {
        // Validaciones externas para sus objetivos
        let tieneValidacion = false
        if (personaId) {
          const { data: objIds } = await supabase
            .from('objetivos')
            .select('id')
            .eq('persona_id', personaId)
          const ids = (objIds ?? []).map((o: any) => o.id)
          if (ids.length > 0) {
            const { count: vCount } = await supabase
              .from('validaciones_externas')
              .select('*', { count: 'exact', head: true })
              .in('objetivo_id', ids)
            tieneValidacion = (vCount ?? 0) > 0
          }
        }

        builtSteps = [
          {
            key:   'objetivo',
            done:  tieneObj,
            icon:  <Target size={14} />,
            label: 'Cargá tu primer objetivo',
            sub:   'Empezá tu historial con evidencia real.',
            href:  '/mi-trabajo',
            cta:   'Ir a mis objetivos',
          },
          {
            key:   'avance',
            done:  tieneAvance,
            icon:  <Activity size={14} />,
            label: 'Agregá un avance con evidencia',
            sub:   'Un comentario, link o archivo que respalde tu trabajo.',
            href:  '/mi-trabajo',
            cta:   'Cargar avance',
          },
          {
            key:   'cierre',
            done:  tieneCierre,
            icon:  <Calendar size={14} />,
            label: 'Hacé tu primer cierre semanal',
            sub:   '3 preguntas en 5 min. Suma Regularidad (20%) al Índice.',
            href:  '/mi-semana',
            cta:   'Ir a mi semana',
          },
          {
            key:   'validacion',
            done:  tieneValidacion,
            icon:  <Send size={14} />,
            label: 'Pedí tu primera validación externa',
            sub:   'Invitá a un cliente o colega. Vale el 35% del Índice.',
            href:  '/mi-trabajo',
            cta:   'Solicitar validación',
          },
        ]

        // Paso bonus: perfil (no cuenta para autocerrar, es opcional)
        if (!empresaActual) {
          builtSteps.push({
            key:   'perfil',
            done:  false,
            icon:  <User size={14} />,
            label: 'Completá tu perfil laboral',
            sub:   'Empresa actual y supervisor. Mejora Alineación (10%).',
            href:  '/perfil',
            cta:   'Completar perfil',
          })
        }
      }

      // ── EMPLEADO ───────────────────────────────────────────
      else if (esEmpleado) {
        // Validaciones externas del empleado
        let tieneValidacion = false
        if (personaId) {
          const { data: objIds } = await supabase
            .from('objetivos')
            .select('id')
            .eq('persona_id', personaId)
          const ids = (objIds ?? []).map((o: any) => o.id)
          if (ids.length > 0) {
            const { count: vCount } = await supabase
              .from('validaciones_externas')
              .select('*', { count: 'exact', head: true })
              .in('objetivo_id', ids)
            tieneValidacion = (vCount ?? 0) > 0
          }
        }

        builtSteps = [
          {
            key:   'objetivo',
            done:  tieneObj,
            icon:  <Target size={14} />,
            label: 'Revisá tus objetivos asignados',
            sub:   'Ves qué espera tu empresa de vos este período.',
            href:  '/mi-trabajo',
            cta:   'Ver objetivos',
          },
          {
            key:   'avance',
            done:  tieneAvance,
            icon:  <Activity size={14} />,
            label: 'Cargá tu primer avance con evidencia',
            sub:   'Documenta qué estás haciendo. Suma Cumplimiento (25%).',
            href:  '/mi-trabajo',
            cta:   'Cargar avance',
          },
          {
            key:   'cierre',
            done:  tieneCierre,
            icon:  <Calendar size={14} />,
            label: 'Hacé tu primer cierre semanal',
            sub:   '3 preguntas que le dan contexto a tu manager sin reuniones.',
            href:  '/mi-semana',
            cta:   'Ir a mi semana',
          },
          {
            key:   'validacion',
            done:  tieneValidacion,
            icon:  <Send size={14} />,
            label: 'Pedí validación a un cliente o colega',
            sub:   'Una confirmación externa suma en tu Índice (35%).',
            href:  '/mi-trabajo',
            cta:   'Solicitar validación',
          },
        ]
      }

      // ── SUPERVISOR / ADMIN ─────────────────────────────────
      else if (esSupervisor && empresaId) {
        const [
          { count: equipoCount },
          { count: valCount },
          { count: reunCount },
        ] = await Promise.all([
          supabase.from('personas').select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('empleo_activo', true)
            .neq('user_id', user.id),
          supabase.from('objetivos').select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .eq('validacion', 'De acuerdo'),
          supabase.from('reuniones_1on1').select('*', { count: 'exact', head: true })
            .eq('empresa_id', empresaId),
        ])

        builtSteps = [
          {
            key:   'equipo',
            done:  (equipoCount ?? 0) > 0,
            icon:  <Users size={14} />,
            label: 'Invitá a tu primer colaborador',
            sub:   'Desde Administración → podés invitar por email.',
            href:  '/administracion',
            cta:   'Ir a administración',
          },
          {
            key:   'validacion',
            done:  (valCount ?? 0) > 0,
            icon:  <CheckSquare size={14} />,
            label: 'Validá un objetivo completado',
            sub:   'Tu aval vale el 35% del Índice del colaborador.',
            href:  '/equipo',
            cta:   'Ir al equipo',
          },
          {
            key:   'reunion',
            done:  (reunCount ?? 0) > 0,
            icon:  <MessageSquare size={14} />,
            label: 'Agendá tu primer 1:1',
            sub:   'Quedará vinculado al historial del colaborador.',
            href:  '/reuniones',
            cta:   'Agendar reunión',
          },
          {
            key:   'cierre',
            done:  tieneCierre,
            icon:  <Calendar size={14} />,
            label: 'Hacé tu propio cierre semanal',
            sub:   'Tu Índice también cuenta. Liderá con el ejemplo.',
            href:  '/mi-semana',
            cta:   'Ir a mi semana',
          },
        ]
      }

      if (builtSteps.length === 0) { setLoading(false); return }

      // Auto-ocultar si todos están listos
      // (para individuo solo contamos los primeros 4; el perfil es bonus)
      const coreSteps = builtSteps.filter(s => s.key !== 'perfil')
      if (coreSteps.every(s => s.done)) {
        localStorage.setItem(key, '1')
        setLoading(false)
        return
      }

      setSteps(builtSteps)
      setVisible(true)
      setLoading(false)
    }

    load()
  }, [])

  function dismiss() {
    if (dimKey) localStorage.setItem(dimKey, '1')
    setVisible(false)
  }

  if (loading || !visible || steps.length === 0) return null

  const doneCount = steps.filter(s => s.done).length
  const total     = steps.length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border:          '1px solid #BBC5F7',
        backgroundColor: '#FAFBFF',
        boxShadow:       '0 1px 6px rgba(51,80,208,0.10)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ borderBottom: '1px solid #E8ECFD' }}
      >
        <ProgressRing done={doneCount} total={total} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
            {doneCount === total ? '¡Listo para crecer!' : 'Primeros pasos'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            {subtitulo(doneCount, total)}
          </p>
        </div>

        <button
          onClick={dismiss}
          title="Cerrar"
          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: '#CBD5E1', flexShrink: 0 }}
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ height: 3, width: '100%', backgroundColor: '#EEF2FF' }}>
        <div
          style={{
            height:     '100%',
            width:      `${(doneCount / total) * 100}%`,
            background: doneCount === total
              ? 'linear-gradient(90deg, #15803d, #22c55e)'
              : 'linear-gradient(90deg, #1C2B90, #3350D0)',
            transition: 'width 0.7s ease',
          }}
        />
      </div>

      {/* ── Pasos ── */}
      <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {steps.map((step) => (
          <div
            key={step.key}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ opacity: step.done ? 0.38 : 1 }}
          >
            {/* Estado check */}
            <div style={{ flexShrink: 0 }}>
              {step.done
                ? <CheckCircle2 size={17} style={{ color: '#16a34a' }} />
                : <Circle       size={17} style={{ color: '#CBD5E1' }} />
              }
            </div>

            {/* Icono tipo */}
            <div
              className="rounded-lg flex items-center justify-center"
              style={{
                width:           28,
                height:          28,
                flexShrink:      0,
                backgroundColor: step.done ? '#f0fdf4' : '#EDEFFD',
                color:           step.done ? '#16a34a' : '#3350D0',
              }}
            >
              {step.icon}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{
                  color:          '#0F172A',
                  textDecoration: step.done ? 'line-through' : 'none',
                }}
              >
                {step.label}
              </p>
              <p className="text-xs" style={{ color: '#94A3B8', marginTop: 2 }}>
                {step.sub}
              </p>
            </div>

            {/* CTA */}
            {!step.done && (
              <Link
                href={step.href}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#3350D0', flexShrink: 0 }}
              >
                {step.cta} <ChevronRight size={11} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
