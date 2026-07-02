'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Link2, Paperclip, Send, CheckCircle, Clock, Users } from 'lucide-react'

function formatFecha(f: string | null) {
  if (!f) return 'Sin vencimiento'
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDT(dt: string) {
  return new Date(dt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

type TipoAvance = 'comentario' | 'link' | 'archivo'

export default function ColaborarPage({ params }: { params: { token: string } }) {
  const [externo, setExterno]         = useState<any>(null)
  const [grupo, setGrupo]             = useState<any>(null)
  const [avances, setAvances]         = useState<any[]>([])
  const [miembros, setMiembros]       = useState<any[]>([])
  const [cargando, setCargando]       = useState(true)
  const [noEncontrado, setNoEncontrado] = useState(false)

  const [tipo, setTipo]               = useState<TipoAvance>('comentario')
  const [contenido, setContenido]     = useState('')
  const [enviando, setEnviando]       = useState(false)
  const [enviado, setEnviado]         = useState(false)

  async function cargarDatos() {
    // 1. Buscar el registro externo por token
    const { data: ext, error } = await supabase
      .from('objetivo_externos')
      .select('*, grupo:objetivo_grupos(*)')
      .eq('token', params.token)
      .single()

    if (error || !ext) { setNoEncontrado(true); setCargando(false); return }

    setExterno(ext)
    setGrupo(ext.grupo)

    // 2. Cargar todos los objetivos del grupo y sus avances
    const { data: obs } = await supabase
      .from('objetivos')
      .select('id, persona:personas(nombre, apellido)')
      .eq('grupo_id', ext.grupo_id)

    setMiembros(obs ?? [])

    if (obs && obs.length > 0) {
      const ids = obs.map((o: any) => o.id)
      const { data: avs } = await supabase
        .from('objetivo_avances')
        .select('*')
        .in('objetivo_id', ids)
        .order('creado_en', { ascending: true })
      setAvances(avs ?? [])
    }

    // 3. También cargar avances propios del externo (con externo_id)
    const { data: avsExt } = await supabase
      .from('objetivo_avances')
      .select('*')
      .eq('externo_id', ext.id)
      .order('creado_en', { ascending: true })

    if (avsExt && avsExt.length > 0) {
      setAvances(prev => {
        const ids = new Set(prev.map((a: any) => a.id))
        const nuevos = avsExt.filter((a: any) => !ids.has(a.id))
        return [...prev, ...nuevos].sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime())
      })
    }

    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [params.token])

  async function handleEnviar() {
    if (!contenido.trim() || !externo) return
    setEnviando(true)

    // El avance del externo no tiene objetivo_id de un interno específico.
    // Lo guardamos con externo_id + nombre_externo, objetivo_id null si no hay internos,
    // o apuntando al primer objetivo del grupo.
    const primerObjetivoId = miembros[0]?.id ?? null

    const { error } = await supabase.from('objetivo_avances').insert({
      objetivo_id:     primerObjetivoId,
      externo_id:      externo.id,
      nombre_externo:  externo.nombre,
      contenido:       contenido.trim(),
      tipo,
      creado_en:       new Date().toISOString(),
    })

    if (!error) {
      setContenido('')
      setTipo('comentario')
      setEnviado(true)
      setTimeout(() => setEnviado(false), 3000)
      cargarDatos()
    }
    setEnviando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (noEncontrado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-2">Link no encontrado</p>
          <p className="text-sm text-gray-400">Este link no es válido o ya expiró.</p>
        </div>
      </div>
    )
  }

  // Enriquecer avances con nombre del autor
  const avancesConNombre = avances.map(a => {
    if (a.externo_id) {
      return { ...a, autorNombre: a.nombre_externo ?? 'Colaborador externo', esExterno: true, esMio: a.externo_id === externo.id }
    }
    const miembro = miembros.find((m: any) => m.id === a.objetivo_id)
    const persona = miembro?.persona
    return { ...a, autorNombre: persona ? `${persona.nombre} ${persona.apellido[0]}.` : 'Interno', esExterno: false, esMio: false }
  })

  const prioridadColor: Record<string, string> = { Alta: '#111827', Media: '#9ca3af', Baja: '#e5e7eb' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#0F4C81' }}>
            T
          </div>
          <div>
            <p className="text-xs text-gray-400">Objetivo compartido · TRAZA</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Tarjeta del objetivo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" style={{ borderLeft: `4px solid ${prioridadColor[grupo?.prioridad ?? 'Media']}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{grupo?.categoria ?? ''}</p>
              <h1 className="text-xl font-bold text-gray-900">{grupo?.titulo}</h1>
              {grupo?.descripcion && <p className="text-sm text-gray-500 mt-2">{grupo.descripcion}</p>}
            </div>
            <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#f0f6ff', color: '#0F4C81' }}>
              {grupo?.prioridad}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {grupo?.es_continuo ? 'Sin vencimiento' : formatFecha(grupo?.fecha_limite)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {miembros.length} interno{miembros.length !== 1 ? 's' : ''} + {externo?.nombre}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Participás como</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{externo?.nombre}
              {externo?.empresa_nombre && <span className="font-normal text-gray-500"> · {externo.empresa_nombre}</span>}
            </p>
          </div>
        </div>

        {/* Timeline de avances */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm">Progreso del equipo</h2>
          </div>
          {avancesConNombre.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Todavía no hay avances registrados. ¡Sé el primero en agregar uno!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {avancesConNombre.map(a => (
                <div key={a.id} className={`px-5 py-4 ${a.esMio ? 'bg-violet-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${a.esExterno ? 'bg-violet-100 text-violet-700' : 'bg-traza-100 text-traza-700'}`}>
                      {a.autorNombre[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{a.autorNombre}</p>
                        {a.esMio && <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">Vos</span>}
                        {a.esExterno && !a.esMio && <span className="text-xs text-violet-500">· Externo</span>}
                        <span className="text-xs text-gray-400">{formatDT(a.creado_en)}</span>
                      </div>
                      {a.tipo === 'link' || a.tipo === 'archivo' ? (
                        <a href={a.contenido} target="_blank" rel="noopener noreferrer" className="text-traza-700 hover:underline text-sm break-all mt-0.5 flex items-center gap-1">
                          {a.tipo === 'link' ? <Link2 size={12} /> : <Paperclip size={12} />}
                          {a.contenido}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 mt-0.5">{a.contenido}</p>
                      )}
                      {a.respuesta_supervisor && (
                        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Respuesta</p>
                          <p className="text-sm text-gray-700">{a.respuesta_supervisor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form para agregar avance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Registrar avance</h2>

          {/* Tipo chips */}
          <div className="flex gap-2 mb-3">
            {(['comentario', 'link', 'archivo'] as const).map(t => {
              const icons = { comentario: <MessageSquare size={13} />, link: <Link2 size={13} />, archivo: <Paperclip size={13} /> }
              const labels = { comentario: 'Nota', link: 'Link', archivo: 'Archivo' }
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tipo === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {icons[t]}{labels[t]}
                </button>
              )
            })}
          </div>

          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            placeholder={tipo === 'comentario' ? 'Contá qué avanzaste...' : tipo === 'link' ? 'https://...' : 'URL del archivo...'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-traza-300 resize-none min-h-[90px]"
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleEnviar() }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">Ctrl+Enter para enviar</p>
            <button
              onClick={handleEnviar}
              disabled={!contenido.trim() || enviando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#0F4C81' }}
            >
              {enviado ? <><CheckCircle size={14} /> Enviado</> : <><Send size={14} /> {enviando ? 'Enviando...' : 'Enviar avance'}</>}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">Impulsado por TRAZA</p>
      </div>
    </div>
  )
}
