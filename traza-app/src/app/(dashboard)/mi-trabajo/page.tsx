'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, getCategoriaStyle, detectarDiscrepancia, isVencido, formatFecha, cn } from '@/lib/traza'
import { AlertTriangle, ArrowLeft, MessageSquare, Link2, Paperclip, Plus, CheckCircle2, Star, Share2, Copy, Check } from 'lucide-react'
import type { Objetivo, Persona, CategoriaObjetivo } from '@/types'

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
    categoria: 'Resultado' as CategoriaObjetivo,
    es_continuo: false,
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
      categoria:    form.categoria,
      es_continuo:  form.es_continuo,
      fecha_limite: form.es_continuo ? null : (form.fecha_limite || null),
      tipo:         'Personal',
      estado:       'Pendiente',
    })

    setForm({ titulo: '', descripcion: '', prioridad: 'Media', categoria: 'Resultado', es_continuo: false, fecha_limite: '' })
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

  async function updateAutoevaluacion(id: string, autoevaluacion: string, comentario_empleado: string) {
    await supabase.from('objetivos').update({ autoevaluacion, comentario_empleado: comentario_empleado || null }).eq('id', id)
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, autoevaluacion: autoevaluacion as any, comentario_empleado } : o))
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

      {/* Cierre semanal */}
      {persona && <CierreSemanal personaId={persona.id} />}

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
                <label className="traza-label">Categoría</label>
                <select className="traza-input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaObjetivo }))}>
                  <option value="Resultado">Resultado</option>
                  <option value="Eficiencia">Eficiencia</option>
                  <option value="Aprendizaje">Aprendizaje</option>
                  <option value="Hábito">Hábito</option>
                </select>
              </div>
              <div>
                <label className="traza-label">Prioridad</label>
                <select className="traza-input" value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as any }))}>
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </select>
              </div>
            </div>
            <div>
              <label className="traza-label">Fecha límite</label>
              <input type="date" className={`traza-input ${form.es_continuo ? 'opacity-40 pointer-events-none' : ''}`} value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} disabled={form.es_continuo} />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.es_continuo}
                  onChange={e => setForm(f => ({ ...f, es_continuo: e.target.checked, fecha_limite: e.target.checked ? '' : f.fecha_limite }))}
                  className="w-4 h-4 rounded accent-traza-700" />
                <span className="text-xs text-gray-500">Sin fecha de vencimiento</span>
              </label>
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
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onUpdateAuto={updateAutoevaluacion} autoExpand={obj.id === objetivoDestacado} />
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
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onUpdateAuto={updateAutoevaluacion} onDelete={deleteObjetivo} personal autoExpand={obj.id === objetivoDestacado} />
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
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onUpdateAuto={updateAutoevaluacion} />
                ))}
              </div>
            </section>
          )}
          {personalesC.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Personales completados</h2>
              <div className="space-y-3">
                {personalesC.map(obj => (
                  <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onUpdateAuto={updateAutoevaluacion} personal />
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

// -------- Cierre Semanal --------
function CierreSemanal({ personaId }: { personaId: string }) {
  const [cierre, setCierre]   = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ que_avance: '', que_obstaculos: '', que_necesito: '' })

  // Lunes de la semana actual
  function getLunes() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const semana = getLunes()

  useEffect(() => {
    supabase.from('cierres_semanales')
      .select('*')
      .eq('persona_id', personaId)
      .eq('semana', semana)
      .maybeSingle()
      .then(({ data }) => {
        setCierre(data)
        if (data) setForm({ que_avance: data.que_avance ?? '', que_obstaculos: data.que_obstaculos ?? '', que_necesito: data.que_necesito ?? '' })
      })
  }, [personaId])

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()

    const payload = {
      empresa_id: profile!.empresa_id,
      persona_id: personaId,
      semana,
      que_avance: form.que_avance || null,
      que_obstaculos: form.que_obstaculos || null,
      que_necesito: form.que_necesito || null,
      creado_por: user!.id,
    }

    if (cierre) {
      await supabase.from('cierres_semanales').update(payload).eq('id', cierre.id)
    } else {
      await supabase.from('cierres_semanales').insert(payload)
    }

    const { data } = await supabase.from('cierres_semanales').select('*').eq('persona_id', personaId).eq('semana', semana).maybeSingle()
    setCierre(data)
    setEditing(false)
    setSaving(false)
  }

  const semanaLabel = new Date(semana + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  return (
    <div className="traza-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-traza-700" strokeWidth={1.75} />
          <h2 className="font-semibold text-gray-900">Cierre semanal</h2>
          <span className="text-xs text-gray-400">Semana del {semanaLabel}</span>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-traza-700 font-medium hover:underline"
        >
          {cierre ? 'Editar' : 'Completar'}
        </button>
      </div>

      {!editing && cierre && (
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">¿Qué avancé esta semana?</p>
            <p className="text-sm text-gray-700">{cierre.que_avance || <span className="text-gray-300">—</span>}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">¿Qué obstáculos tuve?</p>
            <p className="text-sm text-gray-700">{cierre.que_obstaculos || <span className="text-gray-300">—</span>}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">¿Qué necesito para la próxima?</p>
            <p className="text-sm text-gray-700">{cierre.que_necesito || <span className="text-gray-300">—</span>}</p>
          </div>
        </div>
      )}

      {!editing && !cierre && (
        <div className="px-5 py-5 text-center">
          <p className="text-sm text-gray-400 mb-2">Todavía no completaste el cierre de esta semana.</p>
          <button onClick={() => setEditing(true)} className="text-sm font-medium text-traza-700 hover:underline">
            Completar ahora →
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleGuardar} className="px-5 py-4 space-y-3">
          <div>
            <label className="traza-label">¿Qué avancé esta semana?</label>
            <textarea className="traza-input min-h-[64px] resize-none text-sm" value={form.que_avance} onChange={e => setForm(f => ({ ...f, que_avance: e.target.value }))} placeholder="Describí tus logros y avances más importantes..." />
          </div>
          <div>
            <label className="traza-label">¿Qué obstáculos tuve?</label>
            <textarea className="traza-input min-h-[64px] resize-none text-sm" value={form.que_obstaculos} onChange={e => setForm(f => ({ ...f, que_obstaculos: e.target.value }))} placeholder="¿Qué te frenó o complicó esta semana?" />
          </div>
          <div>
            <label className="traza-label">¿Qué necesito para la próxima semana?</label>
            <textarea className="traza-input min-h-[64px] resize-none text-sm" value={form.que_necesito} onChange={e => setForm(f => ({ ...f, que_necesito: e.target.value }))} placeholder="Recursos, apoyo, información..." />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>Guardar cierre</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// -------- ObjetivoCard --------
function ObjetivoCard({
  obj, saving, onUpdate, onUpdateAuto, onDelete, personal, autoExpand
}: {
  obj: Objetivo
  saving: string | null
  onUpdate: (id: string, estado: string) => void
  onUpdateAuto: (id: string, auto: string, comentario: string) => void
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
  const [autoEval, setAutoEval]         = useState((obj as any).autoevaluacion ?? '')
  const [comentarioEmp, setComentarioEmp] = useState((obj as any).comentario_empleado ?? '')
  const [savingAuto, setSavingAuto]     = useState(false)
  const [autoSaved, setAutoSaved]       = useState(false)
  const [tokenUrl,    setTokenUrl]    = useState<string | null>(null)
  const [tokenError,  setTokenError]  = useState<string | null>(null)
  const [generando,   setGenerando]   = useState(false)
  const [copiado,     setCopiado]     = useState(false)
  const vencido = isVencido(obj.fecha_limite, obj.estado)

  async function generarToken() {
    setGenerando(true)
    setTokenError(null)
    try {
      const res  = await fetch('/api/generar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objetivoId: obj.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setTokenUrl(data.url)
      } else {
        setTokenError(data.error ?? `Error ${res.status}`)
      }
    } catch (e: any) {
      setTokenError(e?.message ?? 'Error de conexión')
    } finally {
      setGenerando(false)
    }
  }

  async function copiarUrl() {
    if (!tokenUrl) return
    await navigator.clipboard.writeText(tokenUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

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

  async function handleGuardarAuto() {
    if (!autoEval) return
    setSavingAuto(true)
    await onUpdateAuto(obj.id, autoEval, comentarioEmp)
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
    setSavingAuto(false)
  }

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const yaCompletado = estado === 'Completado' || obj.estado === 'Completado'

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
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {obj.categoria && (() => {
            const cat = getCategoriaStyle(obj.categoria)
            return (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: cat.backgroundColor, color: cat.color }}>
                {cat.label}
              </span>
            )
          })()}
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

            {/* Autoevaluación — aparece cuando está completado */}
            {yaCompletado && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-400" strokeWidth={1.75} />
                  <p className="text-xs font-semibold text-gray-700">Tu autoevaluación</p>
                  {(obj as any).autoevaluacion && !autoSaved && (
                    <span className="text-xs text-gray-400">ya completada</span>
                  )}
                  {autoSaved && <span className="text-xs text-green-500">Guardada ✓</span>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {['Cumplido', 'Parcialmente cumplido', 'No cumplido'].map(opt => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${autoEval === opt ? 'border-traza-700 bg-traza-50 font-medium' : 'border-gray-200 hover:bg-white'}`}
                    >
                      <input type="radio" value={opt} checked={autoEval === opt} onChange={e => setAutoEval(e.target.value)} className="text-traza-700" />
                      {opt}
                    </label>
                  ))}
                </div>
                <textarea
                  className="traza-input text-sm min-h-[64px] resize-none"
                  placeholder="¿Querés agregar algo sobre cómo fue tu desempeño en este objetivo?"
                  value={comentarioEmp}
                  onChange={e => setComentarioEmp(e.target.value)}
                />
                <Button size="sm" loading={savingAuto} onClick={handleGuardarAuto} disabled={!autoEval}>
                  Guardar autoevaluación
                </Button>
              </div>
            )}

            {obj.validacion && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">Validación del supervisor</p>
                <p className="text-sm font-semibold text-gray-900">{obj.validacion}</p>
                {obj.comentario_supervisor?.trim() && (
                  <p className="text-sm text-gray-600 italic">"{obj.comentario_supervisor}"</p>
                )}
                {/* Alerta de discrepancia */}
                {(() => {
                  const disc = detectarDiscrepancia(obj.autoevaluacion, obj.validacion)
                  if (!disc) return null
                  return (
                    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs mt-1 ${disc === 'alta' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                      <span>
                        {disc === 'alta'
                          ? 'Tu autoevaluación difiere significativamente de la validación del supervisor. Si creés que hubo un error, podés solicitarle una revisión.'
                          : 'Hay una diferencia entre tu autoevaluación y la validación del supervisor.'}
                      </span>
                    </div>
                  )
                })()}
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
                {avances.map(a => {
                  const rev = a.estado_revision ?? 'sin_revisar'
                  const revStyle: Record<string, { bg: string; border: string; dot: string; label: string }> = {
                    sin_revisar: { bg: '#f9fafb', border: '#f3f4f6', dot: '#d1d5db', label: 'Sin revisar' },
                    visto:       { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', label: 'Visto'       },
                    aprobado:    { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', label: 'Aprobado'    },
                  }
                  const rs = revStyle[rev] ?? revStyle.sin_revisar
                  return (
                    <div key={a.id} className="rounded-xl border" style={{ backgroundColor: rs.bg, borderColor: rs.border }}>
                      <div className="flex gap-2.5 px-3 pt-3 pb-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {a.tipo === 'comentario' && <MessageSquare size={14} className="text-gray-400" />}
                          {a.tipo === 'link'       && <Link2 size={14} className="text-traza-500" />}
                          {a.tipo === 'archivo'    && <Paperclip size={14} className="text-orange-400" />}
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
                        {/* Estado de revisión */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rs.dot }} />
                          <span className="text-xs font-medium" style={{ color: rs.dot }}>{rs.label}</span>
                        </div>
                      </div>
                      {/* Respuesta del supervisor */}
                      {a.respuesta_supervisor && (
                        <div className="mx-3 mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
                          <p className="text-xs font-semibold text-gray-500 mb-0.5">Respuesta del supervisor</p>
                          <p className="text-sm text-gray-700">{a.respuesta_supervisor}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
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

          {/* Solicitar validación externa */}
          <div className="px-5 pb-5 pt-1 border-t border-gray-100 mt-2">
            {!tokenUrl ? (
              <div className="space-y-1.5">
                <button onClick={generarToken} disabled={generando}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-traza-700 transition-colors disabled:opacity-50">
                  <Share2 size={12} />
                  {generando ? 'Generando link...' : 'Solicitar validación externa'}
                </button>
                {tokenError && (
                  <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">{tokenError}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">
                  Link listo — mandáselo al evaluador
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-600 truncate flex-1 font-mono">{tokenUrl}</p>
                  <button onClick={copiarUrl}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
                    style={{ backgroundColor: copiado ? '#16a34a' : '#0F4C81', color: 'white' }}>
                    {copiado ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                  </button>
                </div>
                <p className="text-xs text-blue-400 mt-1.5">Vence en 7 días · Un solo uso</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
