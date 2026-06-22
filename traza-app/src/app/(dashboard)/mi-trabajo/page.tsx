'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, isVencido, formatFecha, cn } from '@/lib/traza'
import { AlertTriangle, ArrowLeft, MessageSquare, Link2, Paperclip, Plus } from 'lucide-react'
import type { Objetivo, Persona } from '@/types'

export default function MiTrabajoPage() {
  const searchParams = useSearchParams()
  const objetivoDestacado = searchParams.get('objetivo')
  const router = useRouter()

  const [objetivos, setObjetivos]   = useState<Objetivo[]>([])
  const [persona, setPersona]       = useState<Persona | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [tab, setTab]               = useState<'activos' | 'completados'>('activos')

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media' as const,
    fecha_limite: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPersona(p)

      if (p) {
        const { data: obs } = await supabase
          .from('objetivos')
          .select('*')
          .eq('persona_id', p.id)
          .order('fecha_limite', { ascending: true, nullsFirst: false })

        setObjetivos((obs ?? []) as Objetivo[])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleCreatePersonal(e: React.FormEvent) {
    e.preventDefault()
    if (!persona) return
    setSaving('new')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()

    await supabase.from('objetivos').insert({
      empresa_id:   profile!.empresa_id,
      persona_id:   persona.id,
      creado_por:   user!.id,
      titulo:       form.titulo,
      descripcion:  form.descripcion || null,
      prioridad:    form.prioridad,
      fecha_limite: form.fecha_limite || null,
      tipo:         'Personal',
      estado:       'Pendiente',
    })

    setForm({ titulo: '', descripcion: '', prioridad: 'Media', fecha_limite: '' })
    setShowForm(false)

    const { data: obs } = await supabase
      .from('objetivos')
      .select('*')
      .eq('persona_id', persona.id)
      .order('fecha_limite', { ascending: true, nullsFirst: false })
    setObjetivos((obs ?? []) as Objetivo[])
    setSaving(null)
  }

  async function updateEstado(id: string, estado: string) {
    setSaving(id)
    await supabase.from('objetivos').update({ estado }).eq('id', id)
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, estado: estado as any } : o))
    setSaving(null)
  }

  async function deleteObjetivo(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    setObjetivos(prev => prev.filter(o => o.id !== id))
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const activos     = objetivos.filter(o => o.estado !== 'Completado')
  const completados = objetivos.filter(o => o.estado === 'Completado')
  const asignados   = activos.filter(o => o.tipo === 'Asignado')
  const personales  = activos.filter(o => o.tipo === 'Personal')
  const asignadosC  = completados.filter(o => o.tipo === 'Asignado')
  const personalesC = completados.filter(o => o.tipo === 'Personal')
  const pendientes  = activos.filter(o => o.estado !== 'Completado').length
  const vencidos    = activos.filter(o => isVencido(o.fecha_limite, o.estado)).length

  return (
    <div className="space-y-8">
      {objetivoDestacado && (
        <button
          onClick={() => router.push('/calendario')}
          className="flex items-center gap-1.5 text-sm text-traza-700 hover:text-traza-900 font-medium transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Volver al calendario
        </button>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Trabajo</h1>
          <p className="text-gray-500 mt-1">Tus objetivos y avances.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Objetivo personal'}
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{pendientes}</p>
          <p className="text-sm text-gray-500">Activos</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completados.length}</p>
          <p className="text-sm text-gray-500">Completados</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{vencidos}</p>
          <p className="text-sm text-gray-500">Vencidos</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('activos')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'activos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Activos {activos.length > 0 && <span className="ml-1 text-xs text-gray-400">({activos.length})</span>}
        </button>
        <button
          onClick={() => setTab('completados')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'completados' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Completados {completados.length > 0 && <span className="ml-1 text-xs text-gray-400">({completados.length})</span>}
        </button>
      </div>

      {/* Formulario nuevo objetivo personal */}
      {showForm && (
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nuevo objetivo personal</h2>
          <form onSubmit={handleCreatePersonal} className="space-y-4">
            <div>
              <label className="traza-label">Título *</label>
              <input className="traza-input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="¿Qué querés lograr?" required />
            </div>
            <div>
              <label className="traza-label">Descripción</label>
              <textarea className="traza-input min-h-[80px] resize-none" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalles del objetivo..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="traza-label">Prioridad</label>
                <select className="traza-input" value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as any }))}>
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </select>
              </div>
              <div>
                <label className="traza-label">Fecha límite</label>
                <input type="date" className="traza-input" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" loading={saving === 'new'}>Guardar objetivo</Button>
          </form>
        </div>
      )}

      {tab === 'activos' && (
        <>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Objetivos asignados</h2>
            {asignados.length === 0 ? (
              <div className="traza-card p-8 text-center text-gray-400">No hay objetivos asignados activos.</div>
            ) : (
              <div className="space-y-3">
                {asignados.map(obj => (
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} autoExpand={obj.id === objetivoDestacado} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Objetivos personales</h2>
            {personales.length === 0 ? (
              <div className="traza-card p-8 text-center text-gray-400">No hay objetivos personales activos.</div>
            ) : (
              <div className="space-y-3">
                {personales.map(obj => (
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onDelete={deleteObjetivo} personal autoExpand={obj.id === objetivoDestacado} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'completados' && (
        <>
          {asignadosC.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Asignados completados</h2>
              <div className="space-y-3">
                {asignadosC.map(obj => (
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} />
                ))}
              </div>
            </section>
          )}
          {personalesC.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Personales completados</h2>
              <div className="space-y-3">
                {personalesC.map(obj => (
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} personal />
                ))}
              </div>
            </section>
          )}
          {completados.length === 0 && (
            <div className="traza-card p-8 text-center text-gray-400">Todavía no hay objetivos completados.</div>
          )}
        </>
      )}
    </div>
  )
}

// -------- Sub-componente --------
function ObjetivoCard({
  obj, saving, onUpdate, onDelete, personal, autoExpand
}: {
  obj: Objetivo
  saving: string | null
  onUpdate: (id: string, estado: string) => void
  onDelete?: (id: string) => void
  personal?: boolean
  autoExpand?: boolean
}) {
  const [expanded, setExpanded]         = useState(autoExpand ?? false)
  const [estado, setEstado]             = useState(obj.estado)
  const [avances, setAvances]           = useState<any[]>([])
  const [addingType, setAddingType]     = useState<'comentario' | 'link' | 'archivo' | null>(null)
  const [addingContent, setAddingContent] = useState('')
  const [savingAvance, setSavingAvance] = useState(false)
  const vencido = isVencido(obj.fecha_limite, obj.estado)

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true)
      setTimeout(() => {
        document.getElementById(`obj-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [autoExpand])

  useEffect(() => {
    if (expanded) loadAvances()
  }, [expanded])

  async function loadAvances() {
    const { data } = await supabase
      .from('objetivo_avances')
      .select('*')
      .eq('objetivo_id', obj.id)
      .order('creado_en', { ascending: true })
    setAvances(data ?? [])
  }

  async function addAvance() {
    if (!addingContent.trim() || !addingType) return
    setSavingAvance(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('objetivo_avances').insert({
      empresa_id:  (obj as any).empresa_id,
      objetivo_id: obj.id,
      persona_id:  (obj as any).persona_id,
      tipo:        addingType,
      contenido:   addingContent.trim(),
      creado_por:  user!.id,
    })
    setAddingContent('')
    setAddingType(null)
    await loadAvances()
    setSavingAvance(false)
  }

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div id={`obj-${obj.id}`} className={cn(
      'traza-card overflow-hidden transition-all',
      vencido && 'border-red-200',
      autoExpand && 'ring-2 ring-traza-300'
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">{obj.titulo}</p>
            {vencido && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle size={12} strokeWidth={1.75} />
                Vencido
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{formatFecha(obj.fecha_limite)}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getPrioridadClasses(obj.prioridad))}>
            {obj.prioridad}
          </span>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getEstadoClasses(obj.estado))}>
            {obj.estado}
          </span>
          <span className="text-gray-400 text-lg">{expanded ? '↑' : '↓'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">

          {/* Estado */}
          <div className="px-5 py-4 space-y-3">
            {obj.descripcion && (
              <p className="text-sm text-gray-600">{obj.descripcion}</p>
            )}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="traza-label">Estado</label>
                <select className="traza-input" value={estado} onChange={e => setEstado(e.target.value as any)}>
                  <option>Pendiente</option>
                  <option>En progreso</option>
                  <option>Completado</option>
                </select>
              </div>
              <Button size="sm" loading={saving === obj.id} onClick={() => onUpdate(obj.id, estado)}>
                Guardar
              </Button>
            </div>

            {obj.validacion && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Validación del supervisor</p>
                <p className="text-sm font-semibold text-gray-900">{obj.validacion}</p>
                {obj.comentario_supervisor && (
                  <p className="text-sm text-gray-600 mt-1 italic">"{obj.comentario_supervisor}"</p>
                )}
              </div>
            )}

            {personal && onDelete && (
              <button onClick={() => onDelete(obj.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Eliminar objetivo
              </button>
            )}
          </div>

          {/* Avances */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avances registrados</p>

            {avances.length === 0 ? (
              <p className="text-xs text-gray-400">Sin avances todavía.</p>
            ) : (
              <div className="space-y-2.5">
                {avances.map(a => (
                  <div key={a.id} className="flex gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      {a.tipo === 'comentario' && <MessageSquare size={14} className="text-gray-400" />}
                      {a.tipo === 'link'       && <Link2 size={14} className="text-traza-500" />}
                      {a.tipo === 'archivo'    && <Paperclip size={14} className="text-orange-400" />}
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
                      <p className="text-xs text-gray-400 mt-0.5">{formatDT(a.creado_en)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones agregar */}
            {addingType === null ? (
              <div className="flex gap-4 pt-1">
                <button onClick={() => setAddingType('comentario')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={11} strokeWidth={2.5} />
                  <MessageSquare size={12} />
                  Comentario
                </button>
                <button onClick={() => setAddingType('link')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={11} strokeWidth={2.5} />
                  <Link2 size={12} />
                  Link
                </button>
                <button onClick={() => setAddingType('archivo')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={11} strokeWidth={2.5} />
                  <Paperclip size={12} />
                  Archivo
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {addingType === 'comentario' ? (
                  <textarea
                    autoFocus
                    className="traza-input text-sm min-h-[72px] resize-none"
                    placeholder="Describí tu avance..."
                    value={addingContent}
                    onChange={e => setAddingContent(e.target.value)}
                  />
                ) : (
                  <input
                    autoFocus
                    type="url"
                    className="traza-input text-sm"
                    placeholder={addingType === 'link' ? 'https://...' : 'Link al archivo (Drive, Notion, etc.)'}
                    value={addingContent}
                    onChange={e => setAddingContent(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" loading={savingAvance} onClick={addAvance}>Agregar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingType(null); setAddingContent('') }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
