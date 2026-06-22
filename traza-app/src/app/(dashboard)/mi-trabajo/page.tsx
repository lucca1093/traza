'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, isVencido, formatFecha, cn } from '@/lib/traza'
import { AlertTriangle } from 'lucide-react'
import type { Objetivo, Persona } from '@/types'

export default function MiTrabajoPage() {
  const searchParams = useSearchParams()
  const objetivoDestacado = searchParams.get('objetivo')

  const [objetivos, setObjetivos]   = useState<Objetivo[]>([])
  const [persona, setPersona]       = useState<Persona | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

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

    // Refrescar
    const { data: obs } = await supabase
      .from('objetivos')
      .select('*')
      .eq('persona_id', persona.id)
      .order('fecha_limite', { ascending: true, nullsFirst: false })
    setObjetivos((obs ?? []) as Objetivo[])
    setSaving(null)
  }

  async function updateEstado(id: string, estado: string, evidencia_url?: string) {
    setSaving(id)
    await supabase.from('objetivos').update({ estado, evidencia_url: evidencia_url ?? null }).eq('id', id)
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, estado: estado as any, evidencia_url: evidencia_url ?? o.evidencia_url } : o))
    setSaving(null)
  }

  async function deleteObjetivo(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    setObjetivos(prev => prev.filter(o => o.id !== id))
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const asignados  = objetivos.filter(o => o.tipo === 'Asignado')
  const personales = objetivos.filter(o => o.tipo === 'Personal')
  const pendientes = objetivos.filter(o => o.estado !== 'Completado').length
  const completados = objetivos.filter(o => o.estado === 'Completado').length
  const vencidos   = objetivos.filter(o => isVencido(o.fecha_limite, o.estado)).length

  return (
    <div className="space-y-8">
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
          <p className="text-sm text-gray-500">Pendientes</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completados}</p>
          <p className="text-sm text-gray-500">Completados</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{vencidos}</p>
          <p className="text-sm text-gray-500">Vencidos</p>
        </div>
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

      {/* Objetivos asignados */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Objetivos asignados</h2>
        {asignados.length === 0 ? (
          <div className="traza-card p-8 text-center text-gray-400">No hay objetivos asignados.</div>
        ) : (
          <div className="space-y-3">
            {asignados.map(obj => (
              <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} autoExpand={obj.id === objetivoDestacado} />
            ))}
          </div>
        )}
      </section>

      {/* Objetivos personales */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Objetivos personales</h2>
        {personales.length === 0 ? (
          <div className="traza-card p-8 text-center text-gray-400">No hay objetivos personales.</div>
        ) : (
          <div className="space-y-3">
            {personales.map(obj => (
              <ObjetivoCard key={obj.id} obj={obj} saving={saving} onUpdate={updateEstado} onDelete={deleteObjetivo} personal autoExpand={obj.id === objetivoDestacado} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// -------- Sub-componente --------
function ObjetivoCard({
  obj, saving, onUpdate, onDelete, personal, autoExpand
}: {
  obj: Objetivo
  saving: string | null
  onUpdate: (id: string, estado: string, evidencia?: string) => void
  onDelete?: (id: string) => void
  personal?: boolean
  autoExpand?: boolean
}) {
  const [expanded, setExpanded] = useState(autoExpand ?? false)

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true)
      setTimeout(() => {
        document.getElementById(`obj-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [autoExpand])
  const [estado, setEstado]     = useState(obj.estado)
  const [evidencia, setEvidencia] = useState(obj.evidencia_url ?? '')
  const vencido = isVencido(obj.fecha_limite, obj.estado)

  return (
    <div id={`obj-${obj.id}`} className={cn(
      'traza-card overflow-hidden transition-all',
      vencido && 'border-red-200',
      autoExpand && 'ring-2 ring-traza-300'
    )}>
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
          <p className="text-xs text-gray-500 mt-0.5">
            {formatFecha(obj.fecha_limite)}
          </p>
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
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          {obj.descripcion && (
            <p className="text-sm text-gray-600">{obj.descripcion}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="traza-label">Estado</label>
              <select
                className="traza-input"
                value={estado}
                onChange={e => setEstado(e.target.value as any)}
              >
                <option>Pendiente</option>
                <option>En progreso</option>
                <option>Completado</option>
              </select>
            </div>
            <div>
              <label className="traza-label">Link de evidencia</label>
              <input
                className="traza-input"
                value={evidencia}
                onChange={e => setEvidencia(e.target.value)}
                placeholder="https://..."
              />
            </div>
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

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              loading={saving === obj.id}
              onClick={() => onUpdate(obj.id, estado, evidencia)}
            >
              Guardar avance
            </Button>
            {personal && onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(obj.id)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
