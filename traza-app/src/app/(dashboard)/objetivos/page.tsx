'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, getCategoriaStyle, formatFecha } from '@/lib/traza'
import { ChevronDown, ChevronRight, Search, MessageSquare, Link2, Paperclip, X } from 'lucide-react'
import type { Objetivo, Persona, Profile, CategoriaObjetivo } from '@/types'

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<any[]>([])
  const [personas, setPersonas]   = useState<Persona[]>([])
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const searchParams = useSearchParams()
  const objetivoDestacado = searchParams.get('objetivo')
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda]   = useState('')
  const [tabObj, setTabObj]       = useState<'activos' | 'completados'>('activos')

  const [form, setForm] = useState({
    persona_id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    categoria: 'Resultado' as CategoriaObjetivo,
    es_continuo: false,
    fecha_limite: '',
    estado: 'Pendiente',
    tipo: 'Asignado',
    evidencia_url: '',
  })

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
    setProfile(p)

    const [{ data: obs }, { data: pers }] = await Promise.all([
      supabase.from('objetivos').select('*, persona:personas(id, nombre, apellido, area)').eq('empresa_id', p!.empresa_id).order('fecha_limite', { ascending: true, nullsFirst: false }),
      supabase.from('personas').select('*').eq('empresa_id', p!.empresa_id).eq('empleo_activo', true).order('apellido'),
    ])

    setObjetivos(obs ?? [])
    setPersonas(pers ?? [])
    if (pers && pers.length > 0 && !form.persona_id) {
      setForm(f => ({ ...f, persona_id: pers[0].id }))
    }

    // Si viene con ?objetivo=ID, expandir la persona correspondiente
    if (objetivoDestacado && obs) {
      const obj = obs.find((o: any) => o.id === objetivoDestacado)
      if (obj?.persona_id) {
        setExpanded(new Set([obj.persona_id]))
        setTimeout(() => {
          document.getElementById(`obj-row-${objetivoDestacado}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      }
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()

    const payload = {
      empresa_id:    prof!.empresa_id,
      persona_id:    form.persona_id || null,
      creado_por:    user!.id,
      titulo:        form.titulo,
      descripcion:   form.descripcion || null,
      prioridad:     form.prioridad,
      categoria:     form.categoria,
      es_continuo:   form.es_continuo,
      fecha_limite:  form.es_continuo ? null : (form.fecha_limite || null),
      estado:        form.estado,
      tipo:          profile?.rol === 'supervisor' ? 'Asignado' : form.tipo,
      evidencia_url: form.evidencia_url || null,
    }

    if (editId) {
      await supabase.from('objetivos').update(payload).eq('id', editId)
    } else {
      await supabase.from('objetivos').insert(payload)
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    resetForm()
    fetchData()
    setLoading(false)
  }

  function resetForm() {
    setForm({ persona_id: personas[0]?.id ?? '', titulo: '', descripcion: '', prioridad: 'Media', categoria: 'Resultado', es_continuo: false, fecha_limite: '', estado: 'Pendiente', tipo: 'Asignado', evidencia_url: '' })
    setEditId(null)
  }

  function handleEdit(obj: any) {
    setForm({
      persona_id:    obj.persona_id ?? '',
      titulo:        obj.titulo,
      descripcion:   obj.descripcion ?? '',
      prioridad:     obj.prioridad,
      categoria:     obj.categoria ?? 'Resultado',
      es_continuo:   obj.es_continuo ?? false,
      fecha_limite:  obj.fecha_limite ?? '',
      estado:        obj.estado,
      tipo:          obj.tipo,
      evidencia_url: obj.evidencia_url ?? '',
    })
    setEditId(obj.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    fetchData()
  }

  function toggleExpanded(personaId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(personaId) ? next.delete(personaId) : next.add(personaId)
      return next
    })
  }

  const f = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }))

  // Filtrar y agrupar objetivos por persona
  const objFiltradosPorTab = objetivos.filter(o =>
    tabObj === 'activos' ? o.estado !== 'Completado' : o.estado === 'Completado'
  )

  const personasFiltradas = busqueda.trim()
    ? personas.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
      )
    : personas

  const porPersona = personasFiltradas.map(p => ({
    persona: p,
    objetivos: objFiltradosPorTab.filter(o => o.persona_id === p.id),
  })).filter(g => g.objetivos.length > 0)

  // Objetivos sin persona asignada
  const sinPersona = objFiltradosPorTab.filter(o => !o.persona_id)

  const totalActivos     = objetivos.filter(o => o.estado !== 'Completado').length
  const totalCompletados = objetivos.filter(o => o.estado === 'Completado').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Objetivos</h1>
        <p className="text-gray-500 mt-1">Creá y administrá los objetivos del equipo.</p>
      </div>

      {/* Formulario */}
      <div className="traza-card p-6">
        <h2 className="font-semibold text-gray-900 mb-5">{editId ? 'Editar objetivo' : 'Nuevo objetivo'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="traza-label">Colaborador</label>
            <select className="traza-input" value={form.persona_id} onChange={e => f('persona_id', e.target.value)}>
              {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="traza-label">Título *</label>
            <input className="traza-input" value={form.titulo} onChange={e => f('titulo', e.target.value)} placeholder="Título del objetivo" required />
          </div>
          <div className="md:col-span-2">
            <label className="traza-label">Descripción</label>
            <textarea className="traza-input min-h-[80px] resize-none" value={form.descripcion} onChange={e => f('descripcion', e.target.value)} placeholder="Descripción del objetivo..." />
          </div>
          <div>
            <label className="traza-label">Prioridad</label>
            <select className="traza-input" value={form.prioridad} onChange={e => f('prioridad', e.target.value)}>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
          </div>
          <div>
            <label className="traza-label">Categoría</label>
            <select className="traza-input" value={form.categoria} onChange={e => f('categoria', e.target.value)}>
              <option value="Resultado">Resultado</option>
              <option value="Eficiencia">Eficiencia</option>
              <option value="Aprendizaje">Aprendizaje</option>
              <option value="Hábito">Hábito</option>
            </select>
          </div>
          <div>
            <label className="traza-label">Fecha límite</label>
            <input
              type="date"
              className="traza-input disabled:opacity-40"
              value={form.fecha_limite}
              onChange={e => f('fecha_limite', e.target.value)}
              disabled={form.es_continuo}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.es_continuo}
                onChange={e => {
                  f('es_continuo', e.target.checked)
                  if (e.target.checked) f('fecha_limite', '')
                }}
                className="w-4 h-4 rounded accent-traza-700"
              />
              <span className="text-xs text-gray-500">Sin fecha de vencimiento</span>
            </label>
          </div>
          <div>
            <label className="traza-label">Estado</label>
            <select className="traza-input" value={form.estado} onChange={e => f('estado', e.target.value)}>
              <option>Pendiente</option><option>En progreso</option><option>Completado</option>
            </select>
          </div>
          {profile?.rol !== 'supervisor' && (
            <div>
              <label className="traza-label">Tipo</label>
              <select className="traza-input" value={form.tipo} onChange={e => f('tipo', e.target.value)}>
                <option>Asignado</option><option>Personal</option>
              </select>
            </div>
          )}
          {/* Evidencia: inline discreta */}
          <div className="md:col-span-2">
            <EvidenciaInline
              value={form.evidencia_url}
              onChange={v => f('evidencia_url', v)}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={loading}>{editId ? 'Guardar cambios' : 'Guardar objetivo'}</Button>
            {editId && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>}
            {success && <p className="text-green-600 text-sm">Guardado correctamente</p>}
          </div>
        </form>
      </div>

      {/* Lista agrupada por persona */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          {/* Pestañas */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTabObj('activos')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${tabObj === 'activos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Activos <span className="text-xs text-gray-400">({totalActivos})</span>
            </button>
            <button
              onClick={() => setTabObj('completados')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${tabObj === 'completados' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Completados <span className="text-xs text-gray-400">({totalCompletados})</span>
            </button>
          </div>
          <div className="mr-auto" />
          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.75} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar colaborador..."
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-traza-300 w-48"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(new Set(personas.map(p => p.id)))}
              className="text-xs text-traza-700 hover:underline"
            >
              Expandir todos
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => setExpanded(new Set())}
              className="text-xs text-gray-500 hover:underline"
            >
              Colapsar todos
            </button>
          </div>
        </div>

        {objetivos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay objetivos todavía.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {porPersona.map(({ persona, objetivos: obs }) => {
              const isOpen = expanded.has(persona.id)
              const completados = obs.filter(o => o.estado === 'Completado').length
              const pendientes  = obs.filter(o => o.estado === 'Pendiente').length
              const enProgreso  = obs.filter(o => o.estado === 'En progreso').length

              return (
                <div key={persona.id}>
                  {/* Fila de persona */}
                  <button
                    onClick={() => toggleExpanded(persona.id)}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-traza-700 text-xs font-bold">
                        {persona.nombre[0]}{persona.apellido[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{persona.nombre} {persona.apellido}</p>
                      <p className="text-xs text-gray-500">
                        {persona.cargo ?? persona.area ?? ''}
                        {persona.cargo && persona.area ? ` · ${persona.area}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex gap-2">
                        {completados > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{completados} completado{completados > 1 ? 's' : ''}</span>
                        )}
                        {enProgreso > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">{enProgreso} en progreso</span>
                        )}
                        {pendientes > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{pendientes} pendiente{pendientes > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </div>
                  </button>

                  {/* Objetivos expandidos */}
                  {isOpen && (
                    <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                      {obs.map((obj: any) => (
                        <ObjetivoRow
                          key={obj.id}
                          obj={obj}
                          autoExpand={obj.id === objetivoDestacado}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Sin persona asignada */}
            {sinPersona.length > 0 && (
              <div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 font-medium uppercase">Sin colaborador asignado</div>
                {sinPersona.map((obj: any) => (
                  <div key={obj.id} className="flex items-center px-6 py-3 border-t border-gray-100 hover:bg-gray-50 gap-4">
                    <p className="flex-1 text-sm font-medium text-gray-900">{obj.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPrioridadClasses(obj.prioridad)}`}>{obj.prioridad}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>{obj.estado}</span>
                    <span className="text-xs text-gray-500">{formatFecha(obj.fecha_limite)}</span>
                    <div className="space-x-2">
                      <button onClick={() => handleEdit(obj)} className="text-xs text-traza-700 hover:underline">Editar</button>
                      <button onClick={() => handleDelete(obj.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Estado visual de revisión de avance
const REVISION_STYLES: Record<string, { bg: string; border: string; label: string; labelColor: string }> = {
  sin_revisar: { bg: '#f9fafb', border: '#f3f4f6', label: 'Sin revisar', labelColor: '#9ca3af' },
  visto:       { bg: '#eff6ff', border: '#bfdbfe', label: 'Visto',       labelColor: '#2563eb' },
  aprobado:    { bg: '#f0fdf4', border: '#bbf7d0', label: 'Aprobado',    labelColor: '#16a34a' },
}

// -------- Fila de objetivo expandible con avances --------
function ObjetivoRow({ obj, autoExpand, onEdit, onDelete }: {
  obj: any
  autoExpand?: boolean
  onEdit: (obj: any) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen]               = useState(autoExpand ?? false)
  const [avances, setAvances]         = useState<any[]>([])
  const [cambiando, setCambiando]     = useState<string | null>(null)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [textoResp, setTextoResp]     = useState<Record<string, string>>({})

  useEffect(() => {
    if (autoExpand) {
      setOpen(true)
      setTimeout(() => {
        document.getElementById(`obj-row-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [autoExpand])

  useEffect(() => {
    if (open) loadAvances()
  }, [open])

  async function loadAvances() {
    const { data } = await supabase
      .from('objetivo_avances')
      .select('*')
      .eq('objetivo_id', obj.id)
      .order('creado_en', { ascending: true })
    setAvances(data ?? [])
  }

  async function cambiarEstado(avanceId: string, estado: string) {
    setCambiando(avanceId)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('objetivo_avances').update({
      estado_revision: estado,
      aprobado: estado === 'aprobado',
      aprobado_por: estado === 'aprobado' ? user!.id : null,
      aprobado_en: estado === 'aprobado' ? new Date().toISOString() : null,
    }).eq('id', avanceId)
    setCambiando(null)
    loadAvances()
  }

  async function enviarRespuesta(avanceId: string) {
    const texto = textoResp[avanceId]?.trim()
    if (!texto) return
    setRespondiendo(avanceId)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('objetivo_avances').update({
      respuesta_supervisor: texto,
      respondido_por: user!.id,
      respondido_en: new Date().toISOString(),
      estado_revision: 'visto',
    }).eq('id', avanceId)
    setTextoResp(prev => ({ ...prev, [avanceId]: '' }))
    setRespondiendo(null)
    loadAvances()
  }

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div id={`obj-row-${obj.id}`} className={open ? 'bg-white' : ''}>
      {/* Fila resumen */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 pl-16 pr-4 py-3 cursor-pointer hover:bg-white transition-colors"
      >
        <p className="flex-1 font-medium text-gray-900 text-sm truncate">{obj.titulo}</p>
        {obj.es_continuo && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>Continuo</span>
        )}
        {obj.categoria && (() => {
          const cat = getCategoriaStyle(obj.categoria)
          return (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cat.backgroundColor, color: cat.color }}>
              {cat.label}
            </span>
          )
        })()}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPrioridadClasses(obj.prioridad)}`}>{obj.prioridad}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>{obj.estado}</span>
        <span className="text-xs text-gray-400 w-20 text-right">{obj.es_continuo ? '—' : formatFecha(obj.fecha_limite)}</span>
        <div className="flex gap-2 ml-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(obj)} className="text-xs text-traza-700 hover:underline">Editar</button>
          <button onClick={() => onDelete(obj.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
        </div>
        <span className="text-gray-300 text-sm ml-1">{open ? '↑' : '↓'}</span>
      </div>

      {/* Panel de avances */}
      {open && (
        <div className="pl-16 pr-6 pb-5 space-y-3">
          {avances.length === 0 ? (
            <p className="text-xs text-gray-400 italic">El colaborador aún no registró avances.</p>
          ) : avances.map(a => {
            const rev = a.estado_revision ?? 'sin_revisar'
            const style = REVISION_STYLES[rev] ?? REVISION_STYLES.sin_revisar
            const mostrando = respondiendo === null || respondiendo === a.id
            return (
              <div key={a.id} className="rounded-xl border transition-colors" style={{ backgroundColor: style.bg, borderColor: style.border }}>
                {/* Contenido del avance */}
                <div className="flex gap-2.5 px-3 pt-3 pb-2">
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
                  {/* Controles de estado */}
                  <div className="flex-shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {(['sin_revisar', 'visto', 'aprobado'] as const).map(estado => {
                      const s = REVISION_STYLES[estado]
                      const activo = rev === estado
                      return (
                        <button key={estado}
                          onClick={() => cambiarEstado(a.id, estado)}
                          disabled={cambiando === a.id}
                          title={s.label}
                          className="text-xs px-2 py-0.5 rounded-full border font-medium transition-all"
                          style={activo
                            ? { backgroundColor: style.border, color: style.labelColor, borderColor: style.border }
                            : { backgroundColor: 'transparent', color: '#d1d5db', borderColor: '#e5e7eb' }
                          }
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Respuesta del supervisor si ya existe */}
                {a.respuesta_supervisor && (
                  <div className="mx-3 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Supervisor</p>
                    <p className="text-sm text-gray-700">{a.respuesta_supervisor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.respondido_en ? formatDT(a.respondido_en) : ''}</p>
                  </div>
                )}

                {/* Input para responder */}
                <div className="px-3 pb-3 flex gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-traza-400 bg-white"
                    placeholder={a.respuesta_supervisor ? 'Editar respuesta...' : 'Responder al colaborador...'}
                    value={textoResp[a.id] ?? ''}
                    onChange={e => setTextoResp(prev => ({ ...prev, [a.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarRespuesta(a.id) }}}
                  />
                  <button
                    onClick={() => enviarRespuesta(a.id)}
                    disabled={respondiendo === a.id || !textoResp[a.id]?.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                    style={{ backgroundColor: '#0F4C81', color: 'white' }}
                  >
                    {respondiendo === a.id ? '...' : 'Enviar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// -------- Evidencia inline discreta --------
function EvidenciaInline({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value)
  const [input, setInput] = useState(value)

  function handleChange(v: string) {
    setInput(v)
    onChange(v)
  }

  function handleClear() {
    setInput('')
    onChange('')
    setOpen(false)
  }

  return (
    <div>
      {!open && !value ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
        >
          <Paperclip size={13} strokeWidth={1.75} />
          <span>Agregar evidencia</span>
          <Link2 size={13} strokeWidth={1.75} className="ml-0.5" />
        </button>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <Link2 size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-traza-400 bg-white placeholder:text-gray-300"
            placeholder="https://..."
            value={input}
            onChange={e => handleChange(e.target.value)}
            autoFocus={!value}
          />
          <button type="button" onClick={handleClear} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
