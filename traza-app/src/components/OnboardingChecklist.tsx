'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, ChevronRight, X, Building2, Target, ExternalLink, Send } from 'lucide-react'
import Link from 'next/link'

// ── Anillo de progreso SVG ────────────────────────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  const r    = 18
  const circ = 2 * Math.PI * r
  const pct  = total > 0 ? done / total : 0
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      {/* Track */}
      <circle cx="24" cy="24" r={r} fill="none" stroke="#EEF2FF" strokeWidth="4" />
      {/* Progress */}
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
      {/* Texto central */}
      <text
        x="24" y="28"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fill={done === total ? '#16a34a' : '#1C2B90'}
      >
        {done}/{total}
      </text>
    </svg>
  )
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface StepState {
  empresa:    boolean   // empresa_actual_nombre declarada
  supervisor: boolean   // supervisor_email enviado
  objetivo:   boolean   // al menos 1 objetivo cargado
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function OnboardingChecklist() {
  const [visible,    setVisible]    = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [steps,      setSteps]      = useState<StepState>({ empresa: false, supervisor: false, objetivo: false })
  const [trazaId,    setTrazaId]    = useState<string | null>(null)
  const [dismissKey, setDismissKey] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const key = `traza_onb_${user.id}`
      setDismissKey(key)
      if (localStorage.getItem(key) === '1') { setLoading(false); return }

      const { data: persona } = await supabase
        .from('personas')
        .select('id, traza_id, empresa_actual_nombre, empresa_id, supervisor_email')
        .eq('user_id', user.id)
        .maybeSingle()

      // Solo para modo independiente
      if (!persona || persona.empresa_id) { setLoading(false); return }

      setTrazaId(persona.traza_id ?? null)

      const { count } = await supabase
        .from('objetivos')
        .select('*', { count: 'exact', head: true })
        .eq('persona_id', persona.id)

      const empresaDone    = !!(persona.empresa_actual_nombre)
      const supervisorDone = !!(persona.supervisor_email)
      const objetivoDone   = (count ?? 0) > 0

      // Auto-ocultar si los 3 están listos
      if (empresaDone && supervisorDone && objetivoDone) {
        localStorage.setItem(key, '1')
        setLoading(false)
        return
      }

      setSteps({ empresa: empresaDone, supervisor: supervisorDone, objetivo: objetivoDone })
      setVisible(true)
      setLoading(false)
    }
    load()
  }, [])

  function dismiss() {
    if (dismissKey) localStorage.setItem(dismissKey, '1')
    setVisible(false)
  }

  if (loading || !visible) return null

  const doneCount = [steps.empresa, steps.supervisor, steps.objetivo].filter(Boolean).length
  const allDone   = doneCount === 3

  const checkItems = [
    {
      done:  steps.empresa,
      icon:  <Building2 size={14} />,
      label: 'Declarar empresa actual',
      sub:   'Dónde trabajás hoy.',
      href:  '/perfil?onboarding=1',
      cta:   'Ir al perfil',
    },
    {
      done:  steps.supervisor,
      icon:  <Send size={14} />,
      label: 'Declarar supervisor',
      sub:   'Le enviamos un email de confirmación.',
      href:  '/perfil?onboarding=1',
      cta:   'Ir al perfil',
    },
    {
      done:  steps.objetivo,
      icon:  <Target size={14} />,
      label: 'Cargar tu primer objetivo',
      sub:   'Empieza tu historial verificado.',
      href:  '/mi-trabajo',
      cta:   'Ir a mis objetivos',
    },
  ]

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
        <ProgressRing done={doneCount} total={3} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {allDone ? '¡Perfil completo!' : 'Primeros pasos'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            {doneCount === 0 && 'Completá estos pasos para construir tu historial.'}
            {doneCount === 1 && 'Vas bien, seguí con el siguiente paso.'}
            {doneCount === 2 && '¡Casi listo! Un paso más.'}
            {doneCount === 3 && 'Tu historial está listo para crecer.'}
          </p>
        </div>

        <button
          onClick={dismiss}
          title="Cerrar"
          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
          style={{ color: '#CBD5E1' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Barra de progreso ── */}
      <div className="h-1 w-full" style={{ backgroundColor: '#EEF2FF' }}>
        <div
          className="h-1 transition-all duration-700"
          style={{
            width:      `${(doneCount / 3) * 100}%`,
            background: doneCount === 3
              ? 'linear-gradient(90deg, #15803d, #22c55e)'
              : 'linear-gradient(90deg, #1C2B90, #3350D0)',
          }}
        />
      </div>

      {/* ── Pasos ── */}
      <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {checkItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ opacity: item.done ? 0.45 : 1 }}
          >
            {/* Icono check */}
            <div className="flex-shrink-0">
              {item.done
                ? <CheckCircle2 size={17} style={{ color: '#16a34a' }} />
                : <Circle      size={17} style={{ color: '#CBD5E1' }} />
              }
            </div>

            {/* Icono tipo */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: item.done ? '#f0fdf4' : '#EDEFFD',
                color:           item.done ? '#16a34a'  : '#3350D0',
              }}
            >
              {item.icon}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-gray-900"
                style={{ textDecoration: item.done ? 'line-through' : 'none' }}
              >
                {item.label}
              </p>
              <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                {item.sub}
              </p>
            </div>

            {/* CTA */}
            {!item.done && (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: '#3350D0' }}
              >
                {item.cta} <ChevronRight size={11} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── Footer credencial ── */}
      {trazaId && (
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{ borderTop: '1px solid #E8ECFD', backgroundColor: '#F0F3FF' }}
        >
          <p className="text-xs" style={{ color: '#6677CC' }}>
            Credencial pública activa
          </p>
          <a
            href={`/p/${trazaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: '#3350D0' }}
          >
            Ver <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
