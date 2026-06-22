'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getValidacionClasses, formatFecha } from '@/lib/traza'
import { Paperclip, MessageSquare, Link2 } from 'lucide-react'

export default function ValidacionPage() {
  const [objetivos, setObjetivos]   = useState<any[]>([])
  const [selected, setSelected]     = useState<string>('')
  const [validacion, setValidacion] = useState('De acuerdo')
  const [comentario, setComentario] = useState('')
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const [avances, setAvances]       = useState<any[]>([])

  async function fetchAvances(objetivoId: string) {
    const { data } = await supabase
      .from('objetivo_avances')
      .select('*')
      .eq('objetivo_id', objetivoId)
      .order('creado_en', { ascending: true })
    setAvances(data ?? [])
  }

  async function fetchObjetivos() {
    const { data } = await supabase
      .from('objetivos')
      .select('*, persona:personas(nombre, apellido)')
      .order('created_at', { ascending: false })

    setObjetivos(data ?? [])
    if (data && data.length > 0) {
      setSelected(data[0].id)
      fetchAvances(data[0].id)
    }
  }

  useEffect(() => { fetchObjetivos() }, [])

  async function handleValidar(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('objetivos').update({
      validacion,
      comentario_supervisor: comentario || null,
      validado_por: user!.id,
    }).eq('id', selected)

    setComentario('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    fetchObjetivos()
    setSaving(false)
  }

  const objSeleccionado = objetivos.find(o => o.id === selected)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validación</h1>
        <p className="text-gray-500 mt-1">Revisá y validá los objetivos del equipo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo: lista de objetivos */}
        <div className="traza-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">Seleccionar objetivo</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {objetivos.length === 0 && (
              <p className="text-gray-400 text-center py-12">No hay objetivos todavía.</p>
            )}
            {objetivos.map(obj => (
              <div
                key={obj.id}
                onClick={() => { setSelected(obj.id); fetchAvances(obj.id) }}
                className={`px-5 py-4 cursor-pointer transition-colors ${selected === obj.id ? 'bg-traza-50 border-l-2 border-traza-700' : 'hover:bg-gray-50'}`}
              >
                <p className="font-medium text-gray-900 text-sm truncate">{obj.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {obj.persona ? `${obj.persona.nombre} ${obj.persona.apellido}` : '—'}
                  {' · '}{formatFecha(obj.fecha_limite)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>
                    {obj.estado}
                  </span>
                  {obj.validacion && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getValidacionClasses(obj.validacion)}`}>
                      {obj.validacion}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho: formulario de validación */}
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Registrar validación</h2>

          {objSeleccionado ? (
            <>
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="font-semibold text-gray-900">{objSeleccionado.titulo}</p>
                {objSeleccionado.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">{objSeleccionado.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {objSeleccionado.persona
                    ? `${objSeleccionado.persona.nombre} ${objSeleccionado.persona.apellido}`
                    : '—'}
                </p>
              </div>

              {/* Historial de avances del empleado */}
              {avances.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avances del colaborador</p>
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
                              className="text-traza-700 hover:underline break-all text-xs">
                              {a.contenido}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-700">{a.contenido}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(a.creado_en).toLocaleString('es-AR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleValidar} className="space-y-4">
                <div>
                  <label className="traza-label">Resultado</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo'].map(opt => (
                      <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${validacion === opt ? 'border-traza-700 bg-traza-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" value={opt} checked={validacion === opt} onChange={e => setValidacion(e.target.value)} className="text-traza-700" />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="traza-label">Comentario / Feedback</label>
                  <textarea
                    className="traza-input min-h-[100px] resize-none"
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    placeholder="Escribí tu feedback..."
                  />
                </div>

                <Button type="submit" loading={saving}>Guardar validación</Button>
                {success && <p className="text-green-600 text-sm">Validación guardada correctamente</p>}
              </form>
            </>
          ) : (
            <p className="text-gray-400 text-center py-12">Seleccioná un objetivo de la lista.</p>
          )}
        </div>
      </div>
    </div>
  )
}
