'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getValidacionStyle, getCategoriaStyle, detectarDiscrepancia, formatFecha } from '@/lib/traza'
import { MessageSquare, Link2, Paperclip, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

export default function ValidacionPage() {
  const [objetivos, setObjetivos]   = useState<any[]>([])
  const [personas, setPersonas]     = useState<any[]>([])
  const [selected, setSelected]     = useState<string>('')
  const [validacion, setValidacion] = useState('De acuerdo')
  const [comentario, setComentario] = useState('')
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const [avances, setAvances]       = useState<any[]>([])
  const [tab, setTab]               = useState<'pendientes' | 'validados'>('pendientes')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [editando, setEditando]     = useState(false)
  const [profile, setProfile]       = useState<any>(null)
  const [validacionAdmin, setValidacionAdmin] = useState('De acuerdo')
  const [comentarioAdmin, setComentarioAdmin] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [successAdmin, setSuccessAdmin] = useState(false)

  async function fetchData() {
    const { data: obs } = await supabase
      .from('objetivos')
      .select('*, persona:personas(id, nombre, apellido, cargo, area)')
      .order('fecha_limite', { ascending: true, nullsFirst: false })
    setObjetivos(obs ?? [])

    // Personas únicas con objetivos
    const personasMap: Record<string, any> = {}
    ;(obs ?? []).forEach((o: any) => {
      if (o.persona) personasMap[o.persona.id] = o.persona
    })
    setPersonas(Object.values(personasMap))
  }

  useEffect(() => {
    fetchData()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  async function fetchAvances(objetivoId: string) {
    const { data } = await supabase
      .from('objetivo_avances')
      .select('*')
      .eq('objetivo_id', objetivoId)
      .order('creado_en', { ascending: true })
    setAvances(data ?? [])
  }

  async function handleValidarAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSavingAdmin(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('objetivos').update({
      validacion_admin: validacionAdmin,
      comentario_admin: comentarioAdmin || null,
      validacion_admin_por: user!.id,
    }).eq('id', selected)
    setSuccessAdmin(true)
    setTimeout(() => setSuccessAdmin(false), 3000)
    fetchData()
    setSavingAdmin(false)
  }

  function handleSelect(objId: string) {
    setSelected(objId)
    setEditando(false)
    fetchAvances(objId)
    const obj = objetivos.find(o => o.id === objId)
    if (obj) {
      setValidacion(obj.validacion ?? 'De acuerdo')
      setComentario(obj.comentario_supervisor ?? '')
    }
  }

  function togglePersona(personaId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(personaId) ? next.delete(personaId) : next.add(personaId)
      return next
    })
  }

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
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    fetchData()
    setSaving(false)
  }

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  // Filtrar por tab
  const pendientes = objetivos.filter(o => o.estado === 'Completado' && !o.validacion)
  const validados  = objetivos.filter(o => !!o.validacion)
    .sort((a, b) => new Date(b.fecha_limite ?? '').getTime() - new Date(a.fecha_limite ?? '').getTime())

  const listaActiva = tab === 'pendientes' ? pendientes : validados

  // Agrupar por persona
  const porPersona = personas
    .map(p => ({
      persona: p,
      objetivos: listaActiva.filter((o: any) => o.persona?.id === p.id),
    }))
    .filter(g => g.objetivos.length > 0)

  const objSeleccionado = objetivos.find(o => o.id === selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validación</h1>
        <p className="text-gray-500 mt-1">Revisá y validá los objetivos completados del equipo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel izquierdo */}
        <div className="traza-card overflow-hidden">
          {/* Pestañas */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('pendientes'); setSelected('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'pendientes' ? 'text-traza-700 border-b-2 border-traza-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Por validar
              {pendientes.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {pendientes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab('validados'); setSelected('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'validados' ? 'text-traza-700 border-b-2 border-traza-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Validados
              {validados.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {validados.length}
                </span>
              )}
            </button>
          </div>

          {/* Lista agrupada por persona */}
          <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto">
            {porPersona.length === 0 ? (
              <p className="text-gray-400 text-center py-12 text-sm">
                {tab === 'pendientes' ? 'No hay objetivos pendientes de validación.' : 'No hay objetivos validados todavía.'}
              </p>
            ) : (
              porPersona.map(({ persona, objetivos: obs }) => {
                const isOpen = expanded.has(persona.id)
                return (
                  <div key={persona.id}>
                    {/* Cabecera persona */}
                    <button
                      onClick={() => togglePersona(persona.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-traza-700 text-xs font-bold">
                          {persona.nombre[0]}{persona.apellido[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{persona.nombre} {persona.apellido}</p>
                        <p className="text-xs text-gray-400">{obs.length} objetivo{obs.length > 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-gray-300">
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                    </button>

                    {/* Objetivos de la persona */}
                    {isOpen && (
                      <div className="bg-gray-50 divide-y divide-gray-100">
                        {obs.map((obj: any) => (
                          <div
                            key={obj.id}
                            onClick={() => handleSelect(obj.id)}
                            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${selected === obj.id ? 'bg-traza-50 border-l-2 border-traza-700' : 'hover:bg-white'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatFecha(obj.fecha_limite)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
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
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel derecho: detalle + formulario */}
        <div className="traza-card p-6">
          {!objSeleccionado ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-sm">Seleccioná un objetivo de la lista.</p>
            </div>
          ) : (
            <>
              {/* Info del objetivo */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="font-semibold text-gray-900">{objSeleccionado.titulo}</p>
                {objSeleccionado.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">{objSeleccionado.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {objSeleccionado.persona
                    ? `${objSeleccionado.persona.nombre} ${objSeleccionado.persona.apellido}`
                    : '—'}
                  {objSeleccionado.fecha_limite && ` · Vence ${formatFecha(objSeleccionado.fecha_limite)}`}
                </p>
              </div>

              {/* Categoría del objetivo */}
              {objSeleccionado.categoria && (() => {
                const cat = getCategoriaStyle(objSeleccionado.categoria)
                return (
                  <div className="mb-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: cat.backgroundColor, color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                )
              })()}

              {/* Autoevaluación del empleado */}
              {(objSeleccionado.autoevaluacion || objSeleccionado.comentario_empleado) && (
                <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Autoevaluación del colaborador</p>
                  {objSeleccionado.autoevaluacion && (
                    <p className="text-sm font-semibold text-gray-900 mb-1">{objSeleccionado.autoevaluacion}</p>
                  )}
                  {objSeleccionado.comentario_empleado && (
                    <p className="text-sm text-gray-600 italic">"{objSeleccionado.comentario_empleado}"</p>
                  )}
                </div>
              )}

              {/* Alerta de discrepancia — visible DESPUÉS de validar */}
              {objSeleccionado.validacion && objSeleccionado.autoevaluacion && (() => {
                const disc = detectarDiscrepancia(objSeleccionado.autoevaluacion, objSeleccionado.validacion)
                if (!disc) return null
                return (
                  <div className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-xs ${disc === 'alta' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">
                        {disc === 'alta' ? 'Alta discrepancia detectada' : 'Discrepancia moderada'}
                      </p>
                      <p>
                        {disc === 'alta'
                          ? 'El colaborador se evaluó muy diferente a tu validación. Considerá revisar el feedback o abrir una conversación al respecto.'
                          : 'Hay una diferencia entre la autoevaluación del colaborador y tu validación.'}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Avances del empleado */}
              {avances.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avances del colaborador</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {avances.map(a => (
                      <div key={a.id} className="flex gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
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
                </div>
              )}

              {/* Panel validación: resumen o formulario según tab y modo */}
              {tab === 'validados' && objSeleccionado.validacion && !editando ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Validación del supervisor</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <span className="text-sm font-semibold text-gray-900 inline-block px-3 py-1 rounded-full" style={getValidacionStyle(objSeleccionado.validacion)}>
                      {objSeleccionado.validacion}
                    </span>
                    {objSeleccionado.comentario_supervisor && (
                      <p className="text-sm text-gray-600 italic">"{objSeleccionado.comentario_supervisor}"</p>
                    )}
                  </div>
                  <button onClick={() => setEditando(true)} className="text-xs text-traza-700 font-medium hover:underline">
                    Editar validación
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => { await handleValidar(e); setEditando(false) }} className="space-y-4">
                  <div>
                    <label className="traza-label">Validación supervisor</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo'].map(opt => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${validacion === opt ? 'border-traza-700 bg-traza-50' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <input type="radio" value={opt} checked={validacion === opt} onChange={e => setValidacion(e.target.value)} className="text-traza-700" />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="traza-label">Comentario / Feedback</label>
                    <textarea
                      className="traza-input min-h-[80px] resize-none"
                      value={comentario}
                      onChange={e => setComentario(e.target.value)}
                      placeholder="Escribí tu feedback..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" loading={saving}>Guardar validación</Button>
                    {editando && (
                      <button type="button" onClick={() => setEditando(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
                    )}
                    {success && <p className="text-green-600 text-sm">Validación guardada</p>}
                  </div>
                </form>
              )}

              {/* Segunda validación — solo para admin/super_admin */}
              {objSeleccionado && objSeleccionado.validacion && profile && ['admin', 'super_admin'].includes(profile.rol) && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Segunda validación (Admin)
                  </p>
                  {objSeleccionado.validacion_admin && (
                    <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium inline-block"
                        style={getValidacionStyle(objSeleccionado.validacion_admin)}>
                        {objSeleccionado.validacion_admin}
                      </span>
                      {objSeleccionado.comentario_admin && (
                        <p className="text-sm text-gray-600 italic">"{objSeleccionado.comentario_admin}"</p>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleValidarAdmin} className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {['De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo'].map(opt => (
                        <label key={opt}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${validacionAdmin === opt ? 'border-traza-700 bg-traza-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" value={opt} checked={validacionAdmin === opt}
                            onChange={e => setValidacionAdmin(e.target.value)} className="text-traza-700" />
                          <span className="font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      className="traza-input min-h-[60px] resize-none text-sm"
                      value={comentarioAdmin}
                      onChange={e => setComentarioAdmin(e.target.value)}
                      placeholder="Comentario del admin (opcional)..."
                    />
                    <div className="flex items-center gap-3">
                      <Button type="submit" size="sm" loading={savingAdmin}>
                        {objSeleccionado.validacion_admin ? 'Actualizar' : 'Confirmar'} segunda validación
                      </Button>
                      {successAdmin && <p className="text-green-600 text-xs">Guardada ✓</p>}
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
