'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, Circle, ChevronRight, X,
  Building2, Target, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface StepState {
  empresa:  boolean
  objetivo: boolean
}

export default function OnboardingChecklist() {
  const [visible,     setVisible]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [steps,       setSteps]       = useState<StepState>({ empresa: false, objetivo: false })
  const [trazaId,     setTrazaId]     = useState<string | null>(null)
  const [dismissKey,  setDismissKey]  = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const key = `traza_onb_${user.id}`
      setDismissKey(key)

      // Si ya cerró manualmente, no mostrar
      if (localStorage.getItem(key) === '1') { setLoading(false); return }

      const { data: persona } = await supabase
        .from('personas')
        .select('id, traza_id, empresa_actual_nombre, empresa_id, supervisor_nombre')
        .eq('user_id', user.id)
        .maybeSingle()

      // Solo para usuarios en modo independiente (sin empresa_id de empresa)
      if (!persona || persona.empresa_id) { setLoading(false); return }

      setTrazaId(persona.traza_id ?? null)

      const { count } = await supabase
        .from('objetivos')
        .select('*', { count: 'exact', head: true })
        .eq('persona_id', persona.id)

      const empresaDone  = !!(persona.empresa_actual_nombre)
      const objetivoDone = (count ?? 0) > 0

      // Auto-ocultar si ambos steps están completos
      if (empresaDone && objetivoDone) {
        localStorage.setItem(key, '1')
        setLoading(false)
        return
      }

      setSteps({ empresa: empresaDone, objetivo: objetivoDone })
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

  const doneCount = [steps.empresa, steps.objetivo].filter(Boolean).length

  const checkItems = [
    {
      done:  steps.empresa,
      icon:  <Building2 size={15} />,
      label: 'Declarar empresa y supervisor',
      sub:   'Le da contexto y credibilidad a tu historial profesional.',
      href:  '/perfil',
      cta:   'Ir al perfil',
    },
    {
      done:  steps.objetivo,
      icon:  <Target size={15} />,
      label: 'Cargar tu primer objetivo',
      sub:   'Cada logro que registrés queda verificado para siempre.',
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
        boxShadow:       '0 1px 4px rgba(51,80,208,0.08)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #E8ECFD' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}
          >
            T
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Primeros pasos</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {doneCount} de 2 completados
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          title="Cerrar"
          className="transition-colors p-1 rounded-lg hover:bg-gray-100"
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
            width:      `${(doneCount / 2) * 100}%`,
            background: 'linear-gradient(90deg, #1C2B90, #3350D0)',
          }}
        />
      </div>

      {/* ── Pasos ── */}
      <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {checkItems.map((item, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">

            {/* Check */}
            <div className="flex-shrink-0">
              {item.done
                ? <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                : <Circle      size={18} style={{ color: '#CBD5E1' }} />
              }
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0" style={{ opacity: item.done ? 0.45 : 1 }}>
              <p
                className="text-sm font-semibold text-gray-900"
                style={{ textDecoration: item.done ? 'line-through' : 'none' }}
              >
                {item.label}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#94A3B8' }}>
                {item.sub}
              </p>
            </div>

            {/* CTA (solo si pendiente) */}
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

      {/* ── Footer: credencial ── */}
      {trazaId && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid #E8ECFD', backgroundColor: '#F0F3FF' }}
        >
          <p className="text-xs" style={{ color: '#6677CC' }}>
            Tu credencial pública ya está activa
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
