'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza } from '@/lib/traza'
import { Award, CheckCircle2 } from 'lucide-react'
import type { Objetivo, Persona, Profile } from '@/types'

export default function TalentCardPage() {
  const [loading, setLoading]   = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<string>('')
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [persona, setPersona]   = useState<Persona | null>(null)
  const [avances, setAvances]   = useState<any[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      setProfile(p)

      if (p?.rol === 'empleado') {
        const { data: pers } = await supabase.from('personas').select('*').eq('user_id', user!.id).eq('empleo_activo', true).single()
        if (pers) await loadPersonaData(pers.id)
      } else {
        let psQuery = supabase.from('personas').select('*').eq('empleo_activo', true).order('apellido')
        if (p?.rol !== 'super_admin' && p?.empresa_id) {
          psQuery = psQuery.eq('empresa_id', p.empresa_id)
        }
        const { data: ps } = await psQuery
        setPersonas(ps ?? [])
        if (ps && ps.length > 0) {
          setSelected(ps[0].id)
          await loadPersonaData(ps[0].id)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function loadPersonaData(id: string) {
    const [{ data: p }, { data: obs }] = await Promise.all([
      supabase.from('personas').select('*').eq('id', id).single(),
      supabase.from('objetivos').select('*').eq('persona_id', id),
    ])
    const objs = (obs ?? []) as Objetivo[]
    setPersona(p ?? null)
    setObjetivos(objs)
    if (objs.length > 0) {
      const { data: av } = await supabase
        .from('objetivo_avances').select('*')
        .in('objetivo_id', objs.map(o => o.id))
      setAvances(av ?? [])
    } else {
      setAvances([])
    }
  }

  async function handleSelect(id: string) {
    setSelected(id)
    await loadPersonaData(id)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const indice = calcularIndiceTraza(objetivos, avances)
  const logros   = objetivos.filter(o => o.estado === 'Completado').slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Talent Card</h1>
          <p className="traza-page-sub">Credencial profesional basada en desempeño verificable.</p>
        </div>
        {profile?.rol !== 'empleado' && personas.length > 0 && (
          <select
            className="traza-input w-auto"
            value={selected}
            onChange={e => handleSelect(e.target.value)}
          >
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
            ))}
          </select>
        )}
      </div>

      {persona && (
        <div className="max-w-2xl">
          {/* Card principal */}
          <div className="traza-card overflow-hidden">
            {/* Header con fondo */}
            <div className="bg-gradient-to-br from-traza-700 to-traza-800 px-8 py-8">
              <p className="text-traza-300 text-xs font-semibold uppercase tracking-widest mb-4">
                TALENT CARD · traza
              </p>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-white text-3xl font-bold">
                    {persona.nombre} {persona.apellido}
                  </h2>
                  <p className="text-traza-200 mt-1">{persona.cargo ?? '—'}</p>
                  <p className="text-traza-300 text-sm">{persona.area ?? '—'}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                  <p className="text-traza-200 text-xs mb-1">Índice TRAZA</p>
                  <p className="text-white text-4xl font-bold">{indice.score}</p>
                  <p className="text-traza-300 text-sm">/100</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Score verificado */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{indice.badge}</span>
                  <span className="text-sm text-gray-400">{indice.score}/100 · score verificado</span>
                </div>
                {[
                  { label: 'Resultados',   pct: '35%', val: indice.moduloA,    color: '#3350D0' },
                  { label: 'Cumplimiento', pct: '25%', val: indice.moduloB,    color: '#3350D0' },
                  { label: 'Proactividad', pct: '20%', val: indice.moduloC,    color: '#3350D0' },
                  { label: 'Alineación',   pct: '10%', val: indice.alineacion, color: '#0891b2' },
                  { label: 'Evolución',    pct: '10%', val: indice.evolucion,  color: '#d97706' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{m.label} <span className="text-gray-400">{m.pct}</span></span>
                      <span className="font-semibold text-gray-700">{m.val}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${m.val}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <p className="text-2xl font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.03em' }}>{indice.total}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Objetivos totales</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p className="text-2xl font-bold" style={{ color: '#15803d', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.03em' }}>{indice.completados}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#16a34a' }}>Completados</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#EDEFFD', border: '1px solid #BBC5F7' }}>
                  <p className="text-2xl font-bold" style={{ color: '#1C2B90', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.03em' }}>{indice.positivos}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#3350D0' }}>Validaciones ✓</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                  <p className="text-2xl font-bold" style={{ color: '#b45309', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.03em' }}>{indice.cumplimiento}%</p>
                  <p className="text-sm mt-0.5" style={{ color: '#d97706' }}>Cumplimiento</p>
                </div>
              </div>

              {/* Logros */}
              {logros.length > 0 && (
                <div>
                  <p className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                    <Award size={15} strokeWidth={1.75} className="text-traza-700" />
                    Logros destacados
                  </p>
                  <div className="space-y-2">
                    {logros.map(o => (
                      <div key={o.id} className="flex items-center gap-2">
                        <CheckCircle2 size={14} strokeWidth={1.75} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{o.titulo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                  <strong style={{ color: '#0F172A' }}>{persona.nombre} {persona.apellido}</strong> se desempeña
                  {persona.area ? ` en el área de ${persona.area}` : ''}
                  {persona.cargo ? ` como ${persona.cargo}` : ''}.
                  {' '}Posee un Índice Traza de <strong style={{ color: '#1C2B90' }}>{indice.score}/100</strong>,
                  nivel <strong style={{ color: '#0F172A' }}>{indice.nivel}</strong>, con un cumplimiento
                  de objetivos del <strong style={{ color: '#0F172A' }}>{indice.cumplimiento}%</strong>.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs pt-3" style={{ color: '#CBD5E1', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ color: '#94A3B8', fontWeight: 600, letterSpacing: '-0.01em' }}>traza</span>
                <span>{new Date().toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
