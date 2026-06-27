'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza, getValidacionStyle, getEstadoClasses, formatFecha } from '@/lib/traza'
import { CheckCircle2, Trophy, Award, MessageSquare, ChevronDown, ChevronRight, Link2, Paperclip } from 'lucide-react'
import type { Objetivo, Persona, Profile } from '@/types'

export default function PerfilPage() {
  const [loading, setLoading]       = useState(true)
  const [personas, setPersonas]     = useState<Persona[]>([])
  const [selected, setSelected]     = useState<string>('')
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [narrativa, setNarrativa]   = useState<string>('')
  const [loadingIA, setLoadingIA]   = useState(false)
  const [data, setData]             = useState<{
    persona: Persona | null
    objetivos: Objetivo[]
    avances: any[]
  }>({ persona: null, objetivos: [], avances: [] })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      setProfile(p)

      if (p?.rol === 'empleado') {
        // Solo ve su propio perfil
        const { data: persona } = await supabase.from('personas').select('*').eq('user_id', user!.id).eq('empleo_activo', true).single()
        if (persona) {
          setSelected(persona.id)
          await fetchPersonaData(persona.id)
        }
      } else {
        const { data: ps } = await supabase.from('personas').select('*').eq('empleo_activo', true).order('apellido')
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
    const objs = (obs ?? []) as Objetivo[]
    // Traer avances para calcular índice autónomo
    let avances: any[] = []
    if (objs.length > 0) {
      const { data: av } = await supabase
        .from('objetivo_avances')
        .select('*')
        .in('objetivo_id', objs.map(o => o.id))
      avances = av ?? []
    }
    setData({ persona: persona ?? null, objetivos: objs, avances })
  }

  async function handleSelect(personaId: string) {
    setSelected(personaId)
    setNarrativa('')
    await fetchPersonaData(personaId)
  }

  async function generarNarrativaIA() {
    if (!data.persona) return
    setLoadingIA(true)
    const indice = calcularIndiceTraza(data.objetivos, data.avances)
    try {
      const res = await fetch('/api/narrativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:      data.persona.nombre,
          apellido:    data.persona.apellido,
          cargo:       data.persona.cargo,
          area:        data.persona.area,
          score:       indice.score,
          moduloA:     indice.moduloA,
          moduloB:     indice.moduloB,
          moduloC:     indice.moduloC,
          autonomo:    indice.moduloC,
          cumplimiento: indice.cumplimiento,
          total:       indice.total,
          completados: indice.completados,
          positivos:   indice.positivos,
        }),
      })
      const json = await res.json()
      setNarrativa(json.narrativa ?? '')
    } catch {
      setNarrativa('No se pudo generar la narrativa.')
    }
    setLoadingIA(false)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const indice = calcularIndiceTraza(data.objetivos, data.avances)
  const { persona, objetivos } = data

  const scoreColor = indice.score >= 85 ? '#16a34a' : indice.score >= 65 ? '#0F4C81' : indice.score >= 40 ? '#d97706' : '#9ca3af'
  const scoreBg    = indice.score >= 85 ? '#dcfce7' : indice.score >= 65 ? '#dbeafe' : indice.score >= 40 ? '#fef3c7' : '#f3f4f6'
  const ultimasFeedbacks = objetivos.filter(o => o.comentario_supervisor?.trim()).slice(0, 5)
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
              {(persona as any).traza_id && (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2 bg-traza-50 border border-traza-200 rounded-xl px-3 py-2">
                    <span className="text-xs text-traza-500 font-medium">ID TRAZA</span>
                    <span className="text-sm font-bold text-traza-700 tracking-widest">{(persona as any).traza_id}</span>
                  </div>
                  <a
                    href={`/p/${(persona as any).traza_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-traza-700 transition-colors"
                  >
                    Ver Credencial TRAZA →
                  </a>
                </div>
              )}
            </div>

            {/* Narrativa IA */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              {narrativa ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Análisis TRAZA · IA</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{narrativa}</p>
                  <button
                    onClick={generarNarrativaIA}
                    className="text-xs text-gray-400 hover:text-traza-700 transition-colors mt-1"
                  >
                    Regenerar →
                  </button>
                </div>
              ) : (
                <button
                  onClick={generarNarrativaIA}
                  disabled={loadingIA}
                  className="flex items-center gap-2 text-sm font-medium text-traza-700 hover:text-traza-900 transition-colors disabled:opacity-50"
                >
                  {loadingIA ? (
                    <>
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-traza-300 border-t-traza-700 rounded-full" />
                      Generando análisis...
                    </>
                  ) : (
                    <>✦ Generar análisis con IA</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Índice TRAZA */}
          <div className="traza-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Índice TRAZA</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: scoreBg, color: scoreColor }}>
                {indice.badge}
              </span>
            </div>

            {/* Score principal */}
            <div className="flex items-end gap-3 mb-5">
              <span className="text-5xl font-bold leading-none" style={{ color: scoreColor }}>{indice.score}</span>
              <div className="pb-1">
                <span className="text-sm text-gray-400">/100</span>
                <p className="text-xs text-gray-400 mt-0.5">Score verificado</p>
              </div>
            </div>

            {/* Barras */}
            <div className="space-y-3">
              {[
                { label: 'Resultados',   pct: '35%', val: indice.moduloA,   color: '#0F4C81' },
                { label: 'Cumplimiento', pct: '25%', val: indice.moduloB,   color: '#0F4C81' },
                { label: 'Proactividad', pct: '20%', val: indice.moduloC,   color: '#0F4C81' },
                { label: 'Alineación',   pct: '10%', val: indice.alineacion, color: '#0891b2' },
                { label: 'Evolución',    pct: '10%', val: indice.evolucion,  color: '#d97706' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {m.label} <span className="text-gray-400">{m.pct}</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{m.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${m.val}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
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
                      {o.comentario_supervisor?.trim() && (
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

  const tieneDetalle = avances.length > 0 || obj.validacion || obj.comentario_supervisor || (obj as any).autoevaluacion || (obj as any).comentario_empleado

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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>
            {obj.estado}
          </span>
          {(obj as any).autoevaluacion && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              Auto: {(obj as any).autoevaluacion}
            </span>
          )}
          {obj.validacion && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle(obj.validacion)}>
              Sup: {obj.validacion}
            </span>
          )}
          {(obj as any).validacion_admin && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle((obj as any).validacion_admin)}>
              Admin: {(obj as any).validacion_admin}
            </span>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {open && (
        <div className="px-6 pb-4 ml-6 space-y-4 border-t border-gray-50">

          {/* Autoevaluación del empleado */}
          {((obj as any).autoevaluacion || (obj as any).comentario_empleado) && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Autoevaluación del colaborador</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1">
                {(obj as any).autoevaluacion && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                    {(obj as any).autoevaluacion}
                  </span>
                )}
                {(obj as any).comentario_empleado && (
                  <p className="text-sm text-gray-600 italic mt-1">"{(obj as any).comentario_empleado}"</p>
                )}
              </div>
            </div>
          )}

          {/* Feedback del supervisor */}
          {(obj.validacion || obj.comentario_supervisor) && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Validación del supervisor</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                {obj.validacion && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block" style={getValidacionStyle(obj.validacion)}>
                    {obj.validacion}
                  </span>
                )}
                {obj.comentario_supervisor?.trim() && (
                  <p className="text-sm text-gray-600 italic">"{obj.comentario_supervisor}"</p>
                )}
              </div>
            </div>
          )}

          {/* Feedback del admin */}
          {((obj as any).validacion_admin || (obj as any).comentario_admin) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Validación del administrador</p>
              <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-1">
                {(obj as any).validacion_admin && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block" style={getValidacionStyle((obj as any).validacion_admin)}>
                    {(obj as any).validacion_admin}
                  </span>
                )}
                {(obj as any).comentario_admin && (
                  <p className="text-sm text-gray-600 italic">"{(obj as any).comentario_admin}"</p>
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
                  <div key={a.id} className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-2">
                    {/* Contenido del avance */}
                    <div className="flex gap-2.5">
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{formatDT(a.creado_en)}</p>
                          {/* Badge estado revisión */}
                          {a.estado_revision === 'aprobado' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">✓ Aprobado</span>
                          )}
                          {a.estado_revision === 'visto' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Visto</span>
                          )}
                          {a.estado_revision === 'sin_revisar' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Sin revisar</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Respuesta del supervisor */}
                    {a.respuesta_supervisor && (
                      <div className="ml-5 pl-3 border-l-2 border-traza-200">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Supervisor respondió:</p>
                        <p className="text-xs text-gray-600 italic">"{a.respuesta_supervisor}"</p>
                      </div>
                    )}
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
