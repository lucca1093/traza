'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza } from '@/lib/traza'
import type { Objetivo, Persona, Profile } from '@/types'

export default function TalentCardPage() {
  const [loading, setLoading]   = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<string>('')
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [persona, setPersona]   = useState<Persona | null>(null)
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      setProfile(p)

      if (p?.rol === 'empleado') {
        const { data: pers } = await supabase.from('personas').select('*').eq('user_id', user!.id).single()
        if (pers) await loadPersonaData(pers.id)
      } else {
        const { data: ps } = await supabase.from('personas').select('*').order('apellido')
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
    setPersona(p ?? null)
    setObjetivos((obs ?? []) as Objetivo[])
  }

  async function handleSelect(id: string) {
    setSelected(id)
    await loadPersonaData(id)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const indice = calcularIndiceTraza(objetivos)
  const logros = objetivos.filter(o => o.estado === 'Completado').slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Talent Card</h1>
          <p className="text-gray-500 mt-1">Credencial profesional basada en desempeño verificable.</p>
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
                TALENT CARD · TRAZA
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
                  <p className="text-traza-200 text-xs mb-1">Índice Traza</p>
                  <p className="text-white text-4xl font-bold">{indice.score}</p>
                  <p className="text-traza-300 text-sm">/100</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Barra de progreso con nivel */}
              <TraceIndexBar indice={indice} size="md" />

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-gray-900">{indice.total}</p>
                  <p className="text-sm text-gray-500">Objetivos totales</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-700">{indice.completados}</p>
                  <p className="text-sm text-green-600">Completados</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-700">{indice.positivos}</p>
                  <p className="text-sm text-blue-600">Validaciones ✓</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-700">{indice.cumplimiento}%</p>
                  <p className="text-sm text-yellow-600">Cumplimiento</p>
                </div>
              </div>

              {/* Logros */}
              {logros.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 mb-3">🏅 Logros destacados</p>
                  <div className="space-y-2">
                    {logros.map(o => (
                      <div key={o.id} className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        <span className="text-sm text-gray-700">{o.titulo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <strong>{persona.nombre} {persona.apellido}</strong> se desempeña
                  {persona.area ? ` en el área de ${persona.area}` : ''}
                  {persona.cargo ? ` como ${persona.cargo}` : ''}.
                  {' '}Posee un Índice Traza de <strong>{indice.score}/100</strong>,
                  nivel <strong>{indice.nivel}</strong>, con un cumplimiento
                  de objetivos del <strong>{indice.cumplimiento}%</strong>.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span>TRAZA Performance Intelligence Platform</span>
                <span>{new Date().toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
