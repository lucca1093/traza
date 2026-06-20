'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza, getValidacionClasses, getEstadoClasses, formatFecha } from '@/lib/traza'
import type { Objetivo, Persona, Profile } from '@/types'

export default function PerfilPage() {
  const [loading, setLoading]   = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<string>('')
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [data, setData]         = useState<{
    persona: Persona | null
    objetivos: Objetivo[]
  }>({ persona: null, objetivos: [] })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      setProfile(p)

      if (p?.rol === 'empleado') {
        // Solo ve su propio perfil
        const { data: persona } = await supabase.from('personas').select('*').eq('user_id', user!.id).single()
        if (persona) {
          setSelected(persona.id)
          await fetchPersonaData(persona.id)
        }
      } else {
        const { data: ps } = await supabase.from('personas').select('*').order('apellido')
        setPersonas(ps ?? [])
        if (ps && ps.length > 0) {
          setSelected(ps[0].id)
          await fetchPersonaData(ps[0].id)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function fetchPersonaData(personaId: string) {
    const [{ data: persona }, { data: obs }] = await Promise.all([
      supabase.from('personas').select('*').eq('id', personaId).single(),
      supabase.from('objetivos').select('*').eq('persona_id', personaId).order('created_at', { ascending: false }),
    ])
    setData({ persona: persona ?? null, objetivos: (obs ?? []) as Objetivo[] })
  }

  async function handleSelect(personaId: string) {
    setSelected(personaId)
    await fetchPersonaData(personaId)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const indice = calcularIndiceTraza(data.objetivos)
  const { persona, objetivos } = data
  const ultimasFeedbacks = objetivos.filter(o => o.comentario_supervisor).slice(0, 5)
  const logros = objetivos.filter(o => o.estado === 'Completado').slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👤 Perfil Profesional</h1>
          <p className="text-gray-500 mt-1">Historial de desempeño basado en objetivos y validaciones.</p>
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
        <>
          {/* Cabecera del perfil */}
          <div className="traza-card p-6">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-traza-100 flex items-center justify-center flex-shrink-0">
                <span className="text-traza-700 text-2xl font-bold">
                  {persona.nombre[0]}{persona.apellido[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{persona.nombre} {persona.apellido}</h2>
                <p className="text-gray-600 mt-0.5">{persona.cargo ?? '—'}</p>
                <p className="text-gray-400 text-sm">{persona.area ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Índice Traza */}
          <div className="traza-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 Índice Traza</h3>
            <TraceIndexBar indice={indice} size="lg" />
            <p className="text-sm text-gray-500 mt-4">
              {indice.score >= 85
                ? '💪 Desempeño sobresaliente. Ejecución consistente y resultados validados.'
                : indice.score >= 65
                ? '💪 Desempeño sólido y consistente.'
                : indice.score >= 40
                ? '🔧 Hay oportunidades de mejora identificadas.'
                : '⚠️ Requiere acompañamiento y seguimiento.'}
            </p>
          </div>

          {/* Grid de detalles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logros */}
            <div className="traza-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🏅 Logros destacados</h3>
              {logros.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay objetivos completados.</p>
              ) : (
                <div className="space-y-2">
                  {logros.map(o => (
                    <div key={o.id} className="flex items-start gap-3 py-2">
                      <span className="text-green-500 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.titulo}</p>
                        <p className="text-xs text-gray-400">{formatFecha(o.fecha_limite)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimos feedbacks */}
            <div className="traza-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💬 Feedback del supervisor</h3>
              {ultimasFeedbacks.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay feedback registrado.</p>
              ) : (
                <div className="space-y-4">
                  {ultimasFeedbacks.map(o => (
                    <div key={o.id} className="border-l-2 border-traza-200 pl-3">
                      <p className="text-xs font-medium text-gray-900">{o.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getValidacionClasses(o.validacion)}`}>
                        {o.validacion}
                      </span>
                      {o.comentario_supervisor && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{o.comentario_supervisor}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historial completo */}
          <div className="traza-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Historial de objetivos</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Objetivo</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Validación</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {objetivos.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900 text-sm">{o.titulo}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(o.estado)}`}>{o.estado}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getValidacionClasses(o.validacion)}`}>
                        {o.validacion ?? 'Sin validar'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">{formatFecha(o.fecha_limite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
