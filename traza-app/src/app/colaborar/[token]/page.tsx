'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Link2, Paperclip, Send, CheckCircle, Clock, Users, Check } from 'lucide-react'

function formatFecha(f: string | null) {
  if (!f) return 'Sin vencimiento'
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function formatDT(dt: string) {
  return new Date(dt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function formatFechaCorta(dt: string) {
  return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

type TipoAvance = 'comentario' | 'link' | 'archivo'

export default function ColaborarPage({ params }: { params: { token: string } }) {
  const [data, setData]               = useState<any>(null)
  const [cargando, setCargando]       = useState(true)
  const [noEncontrado, setNoEncontrado] = useState(false)

  const [tipo, setTipo]               = useState<TipoAvance>('comentario')
  const [contenido, setContenido]     = useState('')
  const [enviando, setEnviando]       = useState(false)
  const [enviado, setEnviado]         = useState(false)
  const [marcando, setMarcando]       = useState(false)
  const [confirmandoCompleto, setConfirmandoCompleto] = useState(false)

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/colaborar/${params.token}`)
    if (!res.ok) { setNoEncontrado(true); setCargando(false); return }
    const json = await res.json()
    setData(json)
    setCargando(false)
  }, [params.token])

  useEffect(() => { cargar() }, [cargar])

  async function handleEnviar() {
    if (!contenido.trim()) return
    setEnviando(true)
    await fetch(`/api/colaborar/${params.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: contenido.trim(), tipo }),
    })
    setContenido('')
    setTipo('comentario')
    setEnviado(true)
    setTimeout(() => setEnviado(false), 2500)
    cargar()
    setEnviando(false)
  }

  async function handleMarcarCompleto() {
    setMarcando(true)
    await fetch(`/api/colaborar/${params.token}`, { method: 'PATCH' })
    setConfirmandoCompleto(false)
    cargar()
    setMarcando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    )
  }

  if (noEncontrado || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-2">Link no válido</p>
          <p className="text-sm text-gray-400">Este link no existe o ya expiró.</p>
        </div>
      </div>
    )
  }

  const { externo, grupo, objetivos, avances, todosExternos } = data
  const yaComplete = !!externo.completado_en

  // Enriquecer avances con nombre del autor
  const avancesConNombre = avances.map((a: any) => {
    if (a.externo_id) {
      const ext = todosExternos.find((e: any) => e.id === a.externo_id)
      return {
        ...a,
        autorNombre: ext?.nombre ?? a.nombre_externo ?? 'Externo',
        empresaNombre: ext?.empresa_nombre,
        esExterno: true,
        esMio: a.externo_id === externo.id,
      }
    }
    const miembro = objetivos.find((o: any) => o.id === a.objetivo_id)
    const persona = miembro?.persona
    return {
      ...a,
      autorNombre: persona ? `${persona.nombre} ${persona.apellido[0]}.` : 'Interno',
      esExterno: false,
      esMio: false,
    }
  })

  const prioridadBorde: Record<string, string> = { Alta: '#111827', Media: '#9ca3af', Baja: '#e5e7eb' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#3350D0' }}>T</div>
          <p className="text-xs text-gray-400 font-medium">Objetivo compartido · TRAZA</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Objetivo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" style={{ borderLeft: `4px solid ${prioridadBorde[grupo?.prioridad ?? 'Media']}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{grupo?.categoria ?? ''}</p>
              <h1 className="text-xl font-bold text-gray-900">{grupo?.titulo}</h1>
              {grupo?.descripcion && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{grupo.descripcion}</p>}
            </div>
            <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#f0f6ff', color: '#3350D0' }}>
              {grupo?.prioridad}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {grupo?.es_continuo ? 'Sin vencimiento' : formatFecha(grupo?.fecha_limite)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {objetivos.length} interno{objetivos.length !== 1 ? 's' : ''} · {todosExternos.length} externo{todosExternos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Mi info como externo */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Participás como</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {externo.nombre}
                {externo.empresa_nombre && <span className="font-normal text-gray-500"> · {externo.empresa_nombre}</span>}
              </p>
            </div>
            {yaComplete ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle size={15} />
                Tu parte: completada {formatFechaCorta(externo.completado_en)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Tu parte: en progreso</span>
            )}
          </div>

          {/* Estado de todos los externos */}
          {todosExternos.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
              <p className="text-xs text-gray-400 font-medium mb-2">Estado de externos</p>
              {todosExternos.map((ex: any) => (
                <div key={ex.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ex.completado_en ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {ex.completado_en
                      ? <Check size={10} className="text-green-600" />
                      : <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                    }
                  </span>
                  <span className={ex.completado_en ? 'text-gray-700' : 'text-gray-500'}>{ex.nombre}</span>
                  {ex.empresa_nombre && <span className="text-xs text-gray-400">· {ex.empresa_nombre}</span>}
                  {ex.completado_en && <span className="text-xs text-green-500 ml-auto">{formatFechaCorta(ex.completado_en)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm">Progreso del equipo</h2>
          </div>
          {avancesConNombre.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Todavía no hay avances. ¡Sé el primero!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {avancesConNombre.map((a: any) => (
                <div key={a.id} className={`px-5 py-4 ${a.esMio ? 'bg-violet-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${a.esExterno ? 'bg-violet-100 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
                      {a.autorNombre[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{a.autorNombre}</p>
                        {a.empresaNombre && <span className="text-xs text-gray-400">· {a.empresaNombre}</span>}
                        {a.esMio && <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">Vos</span>}
                        <span className="text-xs text-gray-400 ml-auto">{formatDT(a.creado_en)}</span>
                      </div>
                      {(a.tipo === 'link' || a.tipo === 'archivo') ? (
                        <a href={a.contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all flex items-center gap-1">
                          {a.tipo === 'link' ? <Link2 size={12} /> : <Paperclip size={12} />}
                          {a.contenido}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700">{a.contenido}</p>
                      )}
                      {a.respuesta_supervisor && (
                        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-400 mb-0.5">Respuesta del equipo</p>
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

        {/* Form avance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Registrar avance</h2>
          <div className="flex gap-2 mb-3">
            {(['comentario', 'link', 'archivo'] as const).map(t => {
              const icons = { comentario: <MessageSquare size={12} />, link: <Link2 size={12} />, archivo: <Paperclip size={12} /> }
              const labels = { comentario: 'Nota', link: 'Link', archivo: 'Archivo' }
              return (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tipo === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {icons[t]}{labels[t]}
                </button>
              )
            })}
          </div>
          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            placeholder={tipo === 'comentario' ? 'Contá qué avanzaste...' : 'https://...'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none min-h-[80px]"
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleEnviar() }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">Ctrl+Enter para enviar</p>
            <button onClick={handleEnviar} disabled={!contenido.trim() || enviando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#3350D0' }}>
              {enviado ? <><CheckCircle size={14} />Enviado</> : <><Send size={14} />{enviando ? 'Enviando...' : 'Enviar'}</>}
            </button>
          </div>
        </div>

        {/* Marcar mi parte como completa */}
        {!yaComplete && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {!confirmandoCompleto ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">¿Terminaste tu parte?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Marcá cuando hayas completado tu contribución al objetivo.</p>
                </div>
                <button onClick={() => setConfirmandoCompleto(true)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all">
                  <Check size={14} />
                  Marcar completa
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">¿Confirmás que completaste tu parte?</p>
                <p className="text-xs text-gray-400 mb-4">El equipo interno va a ver que finalizaste. Igual podés seguir cargando avances.</p>
                <div className="flex gap-3">
                  <button onClick={handleMarcarCompleto} disabled={marcando}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-colors"
                    style={{ backgroundColor: '#16a34a' }}>
                    <CheckCircle size={14} />
                    {marcando ? 'Guardando...' : 'Sí, completé mi parte'}
                  </button>
                  <button onClick={() => setConfirmandoCompleto(false)}
                    className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {yaComplete && (
          <div className="flex items-center gap-3 px-5 py-4 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Marcaste tu parte como completada</p>
              <p className="text-xs text-green-600 mt-0.5">El equipo puede ver que finalizaste. Igualmente podés seguir cargando avances.</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Impulsado por TRAZA</p>
      </div>
    </div>
  )
}
