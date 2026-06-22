'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza, getValidacionStyle, getEstadoClasses, formatFecha } from '@/lib/traza'
import { CheckCircle2, Trophy, Award, MessageSquare, ChevronDown, ChevronRight, Link2, Paperclip } from 'lucide-react'
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
          <h1 className="text-2xl font-bold text-gray-900">Perfil Profesional</h1>
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
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
              <Trophy size={16} strokeWidth={1.75} className="text-traza-700" />
              Índice Traza
            </h3>
            <TraceIndexBar indice={indice} size="lg" />
            <p className="text-sm text-gray-500 mt-4">
              {indice.score >= 85
                ? 'Desempeño sobresaliente. Ejecución consistente y resultados validados.'
                : indice.score >= 65
                ? 'Desempeño sólido y consistente.'
                : indice.score >= 40
                ? 'Hay oportunidades de mejora identificadas.'
                : 'Requiere acompañamiento y seguimiento.'}
            </p>
          </div>

          {/* Grid de detalles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logros */}
            <div className="traza-card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <Award size={16} strokeWidth={1.75} className="text-traza-700" />
                Logros destacados
              </h3>
              {logros.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay objetivos completados.</p>
              ) : (
                <div className="space-y-2">
                  {logros.map(o => (
                    <div key={o.id} className="flex items-start gap-3 py-2">
                      <CheckCircle2 size={16} strokeWidth={1.75} className="text-green-500 mt-0.5 flex-shrink-0" />
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
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <MessageSquare size={16} strokeWidth={1.75} className="text-traza-700" />
                Feedback del supervisor
              </h3>
              {ultimasFeedbacks.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay feedback registrado.</p>
              ) : (
                <div className="space-y-4">
                  {ultimasFeedbacks.map(o => (
                    <div key={o.id} className="border-l-2 border-traza-200 pl-3">
                      <p className="text-xs font-medium text-gray-900">{o.titulo}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle(o.validacion)}>
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
              <p className="text-xs text-gray-400 mt-0.5">Tocá un objetivo para ver sus avances y feedback</p>
            </div>
            <div className="divide-y divide-gray-100">
              {objetivos.map(o => (
                <ObjetivoHistorialRow key={o.id} obj={o} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// -------- Fila expandible con avances + feedback --------
function ObjetivoHistorialRow({ obj }: { obj: Objetivo }) {
  const [open, setOpen]       = useState(false)
  const [avances, setAvances] = useState<any[]>([])

  useEffect(() => {
    if (open && avances.length === 0) {
      supabase
        .from('objetivo_avances')
        .select('*')
        .eq('objetivo_id', obj.id)
        .order('creado_en', { ascending: true })
        .then(({ data }) => setAvances(data ?? []))
    }
  }, [open])

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const tieneDetalle = avances.length > 0 || obj.validacion || obj.comentario_supervisor

  return (
    <div>
      {/* Fila resumen */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-300 flex-shrink-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatFecha(obj.fecha_limite)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>
            {obj.estado}
          </span>
          {obj.validacion && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle(obj.validacion)}>
              {obj.validacion}
            </span>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {open && (
        <div className="px-6 pb-4 ml-6 space-y-4 border-t border-gray-50">

          {/* Feedback del supervisor */}
          {(obj.validacion || obj.comentario_supervisor) && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Feedback del supervisor</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                {obj.validacion && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block" style={getValidacionStyle(obj.validacion)}>
                    {obj.validacion}
                  </span>
                )}
                {obj.comentario_supervisor && (
                  <p className="text-sm text-gray-600 italic">"{obj.comentario_supervisor}"</p>
                )}
              </div>
            </div>
          )}

          {/* Avances */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avances registrados</p>
            {avances.length === 0 ? (
              <p className="text-xs text-gray-400">Sin avances registrados.</p>
            ) : (
              <div className="space-y-2.5">
                {avances.map(a => (
                  <div key={a.id} className="flex gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      {a.tipo === 'comentario' && <MessageSquare size={13} className="text-gray-400" />}
                      {a.tipo === 'link'       && <Link2 size={13} className="text-traza-500" />}
                      {a.tipo === 'archivo'    && <Paperclip size={13} className="text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {(a.tipo === 'link' || a.tipo === 'archivo') ? (
                        <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                          className="text-traza-700 hover:underline break-all text-xs">{a.contenido}</a>
                      ) : (
                        <p className="text-sm text-gray-700">{a.contenido}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDT(a.creado_en)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!obj.validacion && !obj.comentario_supervisor && avances.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">Este objetivo todavía no tiene avances ni feedback.</p>
          )}
        </div>
      )}
    </div>
  )
}
