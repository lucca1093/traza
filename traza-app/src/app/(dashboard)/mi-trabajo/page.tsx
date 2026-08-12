'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { detectarDiscrepancia, isVencido, formatFecha, cn } from '@/lib/traza'
import { track } from '@/lib/posthog'
import { AlertTriangle, ArrowLeft, MessageSquare, Link2, Paperclip, Plus, CheckCircle2, Star, Share2, Copy, Check, ChevronDown, ChevronUp, Users, Pencil, Mail, Upload } from 'lucide-react'
import type { Objetivo, Persona, CategoriaObjetivo } from '@/types'

// Indicador de prioridad como borde lateral — Sapphire Indigo system
function prioridadBorde(prioridad: string): string {
  if (prioridad === 'Alta')  return '#1C2B90' // traza-700 brand
  if (prioridad === 'Media') return '#8899EE' // traza-300 soft
  return '#E2E8F0'                            // slate-300 muted
}

export default function MiTrabajoPage() {
  const searchParams      = useSearchParams()
  const objetivoDestacado = searchParams.get('objetivo')
  const router            = useRouter()

  const [objetivos, setObjetivos]   = useState<Objetivo[]>([])
  const [persona, setPersona]       = useState<Persona | null>(null)
  const [loading, setLoading]       = useState(true)
  const [valExtMap, setValExtMap]         = useState<Record<string, any[]>>({})
  const [reconocimientos, setReconocimientos] = useState<any[]>([])
  const [feedbacks, setFeedbacks]         = useState<any[]>([])
  const [saving, setSaving]       = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [tab, setTab]             = useState<'activos' | 'historial'>('activos')
  const [primerObjCreado, setPrimerObjCreado] = useState(false)

  // Filtros
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroEstado, setFiltroEstado]       = useState('Todos')
  const [ordenPor, setOrdenPor]               = useState<'prioridad' | 'fecha'>('prioridad')
  const [showFiltros, setShowFiltros]         = useState(false)

  const [form, setForm] = useState({
    titulo: '', descripcion: '',
    prioridad: 'Media' as const,
    categoria: 'Resultado' as CategoriaObjetivo,
    es_continuo: false, fecha_limite: '',
    evidencia_url: '',
    con_externo: false,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let { data: p } = await supabase.from('personas').select('*').eq('user_id', user.id).single()

      // Si no hay persona, crearla via API con service role (bypasea RLS)
      if (!p) {
        try {
          const res = await fetch('/api/setup-persona', { method: 'POST' })
          if (res.ok) {
            const json = await res.json()
            if (json.persona) p = json.persona
            else {
              // Ya existía, re-leer
              const { data: refetch } = await supabase.from('personas').select('*').eq('user_id', user.id).maybeSingle()
              p = refetch
            }
          }
        } catch { /* silencioso */ }
      }

      setPersona(p)
      if (p) {
        // Cargar objetivos via API admin (bypasea RLS para usuarios independientes sin empresa_id)
        let objs: Objetivo[] = []
        try {
          const res = await fetch('/api/mis-objetivos')
          if (res.ok) {
            const json = await res.json()
            objs = json.objetivos ?? []
          }
        } catch { /* fallback silencioso */ }
        setObjetivos(objs)

        // Validaciones externas para todos los objetivos
        if (objs.length > 0) {
          const { data: valExt } = await supabase
            .from('validaciones_externas')
            .select('*')
            .in('objetivo_id', objs.map(o => o.id))
            .order('created_at', { ascending: false })
          const map: Record<string, any[]> = {}
          ;(valExt ?? []).forEach(v => {
            if (!map[v.objetivo_id]) map[v.objetivo_id] = []
            map[v.objetivo_id].push(v)
          })
          setValExtMap(map)
        }

        // Reconocimientos recibidos
        const { data: recons } = await supabase
          .from('reconocimientos')
          .select('*')
          .eq('persona_id', p.id)
          .order('created_at', { ascending: false })
        setReconocimientos(recons ?? [])

        // Feedback formal recibido
        const fbRes = await fetch(`/api/feedback?persona_id=${p.id}`)
        const fbJson = await fbRes.json()
        setFeedbacks(fbJson.feedback ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleCreatePersonal(e: React.FormEvent) {
    e.preventDefault()
    if (!persona) return
    setSaving('new')

    const eraPrimero = objetivos.length === 0

    try {
      const res = await fetch('/api/crear-objetivo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id:    persona.id,
          titulo:        form.titulo,
          descripcion:   form.descripcion,
          prioridad:     form.prioridad,
          categoria:     form.categoria,
          es_continuo:   form.es_continuo,
          fecha_limite:  form.fecha_limite,
          evidencia_url: form.evidencia_url,
          con_externo:   form.con_externo,
        }),
      })

      const json = await res.json()

      if (res.ok && json.objetivo) {
        track('objective_created', { categoria: form.categoria, prioridad: form.prioridad, es_primero: eraPrimero })
        setForm({ titulo: '', descripcion: '', prioridad: 'Media', categoria: 'Resultado', es_continuo: false, fecha_limite: '', evidencia_url: '', con_externo: false })
        setShowForm(false)
        setObjetivos(prev =>
          [...prev, json.objetivo as Objetivo].sort((a, b) => {
            if (!a.fecha_limite) return 1
            if (!b.fecha_limite) return -1
            return a.fecha_limite.localeCompare(b.fecha_limite)
          })
        )
        if (eraPrimero) {
          setPrimerObjCreado(true)
          setTimeout(() => setPrimerObjCreado(false), 6000)
        }
      } else {
        console.error('Error creando objetivo:', json.error)
        alert('Error al guardar el objetivo: ' + (json.error ?? 'Error desconocido'))
      }
    } catch (err) {
      console.error('Error de conexión al crear objetivo:', err)
      alert('Error de conexión. Revisá tu conexión a internet.')
    }

    setSaving(null)
  }

  async function updateEstado(id: string, estado: string, completadoEn?: string) {
    setSaving(id)
    const payload: any = { objetivo_id: id, estado }
    if (estado === 'Completado') payload.completado_en = completadoEn ?? new Date().toISOString()
    try {
      await fetch('/api/actualizar-objetivo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    } catch { /* silencioso — el estado local igual se actualiza */ }
    setObjetivos(prev => prev.map(o => o.id === id
      ? { ...o, estado: estado as any, ...(estado === 'Completado' ? { completado_en: payload.completado_en } : {}) }
      : o
    ))
    setSaving(null)
  }

  async function updateAutoevaluacion(id: string, autoevaluacion: string, comentario_empleado: string) {
    try {
      await fetch('/api/actualizar-objetivo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objetivo_id: id, autoevaluacion, comentario_empleado: comentario_empleado || null }),
      })
    } catch { /* fallback */ }
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, autoevaluacion: autoevaluacion as any, comentario_empleado } : o))
  }

  async function deleteObjetivo(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    setObjetivos(prev => prev.filter(o => o.id !== id))
  }

  if (loading) return (
    <div className="py-16 text-center text-sm" style={{ color: '#94A3B8' }}>Cargando...</div>
  )

  if (!persona) return (
    <div className="space-y-6">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi Trabajo</h1>
          <p className="traza-page-sub">Tus objetivos y avances.</p>
        </div>
      </div>
      <div className="rounded-2xl p-10 text-center flex flex-col items-center gap-4"
        style={{ background: '#F8FAFF', border: '1.5px dashed #C7D2FE' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: '#EDEFFD' }}>
          <AlertTriangle size={24} style={{ color: '#1C2B90' }} />
        </div>
        <div>
          <p className="font-semibold text-base" style={{ color: '#1C2B90' }}>
            Completá tu perfil primero
          </p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Para cargar objetivos necesitás tener un perfil activo.
          </p>
        </div>
        <Button onClick={() => router.push('/perfil?setup=1')} variant="primary">
          Completar perfil
        </Button>
      </div>
    </div>
  )

  const activos     = objetivos.filter(o => o.estado !== 'Completado')
  const completados = objetivos.filter(o => o.estado === 'Completado')
  const vencidosN   = activos.filter(o => isVencido(o.fecha_limite, o.estado)).length

  // Aplicar filtros a activos
  const activosFiltrados = activos.filter(o => {
    if (filtroPrioridad !== 'Todas' && o.prioridad !== filtroPrioridad) return false
    if (filtroCategoria !== 'Todas' && o.categoria !== filtroCategoria) return false
    if (filtroEstado !== 'Todos' && o.estado !== filtroEstado) return false
    return true
  })

  const prioOrden: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 }
  const activosOrdenados = [...activosFiltrados].sort((a, b) => {
    if (ordenPor === 'fecha') {
      if (!a.fecha_limite) return 1
      if (!b.fecha_limite) return -1
      return a.fecha_limite.localeCompare(b.fecha_limite)
    }
    // prioridad primero, luego fecha
    const pDiff = (prioOrden[a.prioridad] ?? 1) - (prioOrden[b.prioridad] ?? 1)
    if (pDiff !== 0) return pDiff
    if (!a.fecha_limite) return 1
    if (!b.fecha_limite) return -1
    return a.fecha_limite.localeCompare(b.fecha_limite)
  })

  const hayFiltrosActivos = filtroPrioridad !== 'Todas' || filtroCategoria !== 'Todas' || filtroEstado !== 'Todos'

  return (
    <div className="space-y-6">
      {objetivoDestacado && (
        <button onClick={() => router.push('/calendario')}
          className="flex items-center gap-1.5 text-sm text-traza-700 hover:text-traza-900 font-medium transition-colors">
          <ArrowLeft size={15} strokeWidth={2} /> Volver al calendario
        </button>
      )}

      {/* Header */}
      <div id="demo-objetivos-header" className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi Trabajo</h1>
          <p className="traza-page-sub">Tus objetivos y avances.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? 'Cancelar' : '+ Objetivo personal'}
        </Button>
      </div>

      {/* Banner primer objetivo creado */}
      {primerObjCreado && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4 animate-pulse-once"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid #86efac',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#22c55e' }}>
            <CheckCircle2 size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">¡Primer objetivo cargado! 🎉</p>
            <p className="text-xs text-green-700 mt-0.5">
              Tu historial profesional verificado ya empezó. Seguí registrando avances.
            </p>
          </div>
        </div>
      )}

      {/* Cierre semanal */}
      {persona && <CierreSemanal personaId={persona.id} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}>{activos.length}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Activos</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}>{completados.length}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Completados</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: vencidosN > 0 ? '#EF4444' : '#CBD5E1', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}>{vencidosN}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Vencidos</p>
        </div>
      </div>

      {/* Formulario nuevo objetivo */}
      {showForm && (
        <div className="traza-card p-6">
          <h2 className="font-semibold mb-5" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.01em' }}>Nuevo objetivo personal</h2>
          <form onSubmit={handleCreatePersonal} className="space-y-4">
            <div>
              <label className="traza-label">Título *</label>
              <input className="traza-input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="¿Qué querés lograr?" required />
            </div>
            <div>
              <label className="traza-label">Descripción</label>
              <textarea className="traza-input min-h-[80px] resize-none" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalles del objetivo..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option>Alta</option><option>Media</option><option>Baja</option>
                </select>
              </div>
              <div>
                <label className="traza-label">Fecha límite</label>
                <input type="date" className={`traza-input ${form.es_continuo ? 'opacity-40 pointer-events-none' : ''}`}
                  value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} disabled={form.es_continuo} />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.es_continuo}
                    onChange={e => setForm(f => ({ ...f, es_continuo: e.target.checked, fecha_limite: e.target.checked ? '' : f.fecha_limite }))}
                    className="w-4 h-4 rounded accent-traza-700" />
                  <span className="text-xs text-gray-500">Sin fecha de vencimiento</span>
                </label>
              </div>
            </div>

            {/* Evidencia + colaborador externo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="traza-label flex items-center gap-1.5">
                  <Link2 size={12} className="text-gray-400" /> Evidencia (link)
                </label>
                <input type="url" className="traza-input" placeholder="https://..."
                  value={form.evidencia_url} onChange={e => setForm(f => ({ ...f, evidencia_url: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Podés agregar más archivos después de crear el objetivo.</p>
              </div>
              <div>
                <label className="traza-label">Tipo de objetivo</label>
                <label
                  className="flex items-start gap-3 mt-1 px-3 py-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: form.con_externo ? '#3350D0' : '#E2E8F0',
                    backgroundColor: form.con_externo ? '#EDEFFD' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={form.con_externo}
                    onChange={e => setForm(f => ({ ...f, con_externo: e.target.checked }))}
                    className="w-4 h-4 rounded accent-traza-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Con colaborador externo</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Incluye a alguien de afuera de la empresa. Podrás compartirles un link después de crear el objetivo.</p>
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" loading={saving === 'new'}>Guardar objetivo</Button>
          </form>
        </div>
      )}

      {/* Reconocimientos recibidos */}
      {reconocimientos.length > 0 && (
        <div className="traza-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <span className="text-base">⭐</span>
            <p className="text-sm font-semibold text-gray-900">Reconocimientos recibidos</p>
            <span className="text-xs text-gray-400 ml-1">({reconocimientos.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {reconocimientos.map((r: any) => (
              <div key={r.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-800">⭐ {r.titulo}</p>
                {r.descripcion && (
                  <p className="text-xs text-gray-500 mt-1 italic">"{r.descripcion}"</p>
                )}
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback formal del supervisor */}
      {feedbacks.length > 0 && (
        <div className="traza-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <span className="text-base">💬</span>
            <p className="text-sm font-semibold text-gray-900">Feedback de mi supervisor</p>
            <span className="text-xs text-gray-400 ml-1">({feedbacks.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {feedbacks.map((fb: any) => {
              const dims = [
                { label: 'Ejecución',     val: fb.dim_ejecucion },
                { label: 'Comunicación',  val: fb.dim_comunicacion },
                { label: 'Colaboración',  val: fb.dim_colaboracion },
                { label: 'Iniciativa',    val: fb.dim_iniciativa },
                { label: 'Liderazgo',     val: fb.dim_liderazgo },
              ].filter(d => d.val != null)
              return (
                <div key={fb.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Período: {fb.periodo}</p>
                    <p className="text-xs text-gray-300">
                      {new Date(fb.enviado_en ?? fb.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {dims.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {dims.map(d => (
                        <div key={d.label} className="text-center">
                          <p className="text-xs text-gray-400 mb-1">{d.label}</p>
                          <p className="text-base font-bold" style={{ color: d.val >= 4 ? '#16a34a' : d.val >= 3 ? '#d97706' : '#dc2626' }}>
                            {d.val}/5
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {fb.comentario_general && (
                    <p className="text-xs text-gray-600 italic leading-relaxed border-l-2 border-gray-100 pl-3">
                      "{fb.comentario_general}"
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="traza-tabs w-fit">
        <button onClick={() => setTab('activos')} className={`traza-tab ${tab === 'activos' ? 'active' : ''}`}>
          Activos {activos.length > 0 && <span className="ml-1 text-xs" style={{ color: '#94A3B8' }}>({activos.length})</span>}
        </button>
        <button onClick={() => setTab('historial')} className={`traza-tab ${tab === 'historial' ? 'active' : ''}`}>
          Historial {completados.length > 0 && <span className="ml-1 text-xs" style={{ color: '#94A3B8' }}>({completados.length})</span>}
        </button>
      </div>

      {/* ACTIVOS */}
      {tab === 'activos' && (
        <div className="space-y-3">
          {/* Barra de filtros inline */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Ordenar */}
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              {(['prioridad', 'fecha'] as const).map(v => (
                <button key={v} onClick={() => setOrdenPor(v)}
                  className="text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all capitalize"
                  style={ordenPor === v
                    ? { backgroundColor: 'white', color: '#0F172A', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }
                    : { color: '#64748B' }
                  }
                >
                  {v === 'prioridad' ? 'Por prioridad' : 'Por fecha'}
                </button>
              ))}
            </div>

            <div className="w-px h-4" style={{ backgroundColor: '#E2E8F0' }} />

            {/* Estado */}
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 font-semibold bg-white focus:outline-none"
              style={{ border: '1px solid #E2E8F0', color: '#475569' }}>
              <option value="Todos">Estado</option>
              <option>Pendiente</option>
              <option>En progreso</option>
            </select>

            {/* Prioridad */}
            <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 font-semibold bg-white focus:outline-none"
              style={{ border: '1px solid #E2E8F0', color: '#475569' }}>
              <option value="Todas">Prioridad</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>

            {/* Tipo */}
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 font-semibold bg-white focus:outline-none"
              style={{ border: '1px solid #E2E8F0', color: '#475569' }}>
              <option value="Todas">Tipo</option>
              <option>Resultado</option>
              <option>Eficiencia</option>
              <option>Aprendizaje</option>
              <option>Hábito</option>
            </select>

            {hayFiltrosActivos && (
              <button
                onClick={() => { setFiltroPrioridad('Todas'); setFiltroCategoria('Todas'); setFiltroEstado('Todos') }}
                className="text-xs font-medium transition-colors"
                style={{ color: '#94A3B8' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
              >
                Limpiar
              </button>
            )}

            <span className="text-xs ml-auto" style={{ color: '#94A3B8' }}>
              {activosOrdenados.length} objetivo{activosOrdenados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {activosOrdenados.length === 0 ? (
            hayFiltrosActivos ? (
              <div className="traza-card p-10 text-center text-gray-400 text-sm">
                Ningún objetivo coincide con los filtros.
              </div>
            ) : (
              /* ── Empty state simple ── */
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  Todavía no tenés objetivos activos. Usá el botón de arriba para agregar uno.
                </p>
              </div>
            )
          ) : (
            <div id="demo-primer-objetivo" className="space-y-2">
              {activosOrdenados.map(obj => (
                <ObjetivoCard key={obj.id} obj={obj} saving={saving}
                  onUpdate={updateEstado} onUpdateAuto={updateAutoevaluacion}
                  onDelete={obj.tipo === 'Personal' ? deleteObjetivo : undefined}
                  autoExpand={obj.id === objetivoDestacado}
                  valExt={valExtMap[obj.id] ?? []} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <div className="space-y-2">
          {completados.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center space-y-4"
              style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F0FDF4 100%)', border: '1px solid #E2E8F0' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#DCFCE7' }}
              >
                <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-gray-800">Tu historial está vacío todavía</p>
                <p className="text-sm max-w-xs mx-auto" style={{ color: '#94A3B8' }}>
                  Cuando completes un objetivo, quedará guardado acá para siempre — incluso si cambiás de empresa.
                </p>
              </div>
            </div>
          ) : (
            completados.map(obj => <HistorialCard key={obj.id} obj={obj} valExt={valExtMap[obj.id] ?? []} />)
          )}
        </div>
      )}
    </div>
  )
}

// ── HistorialCard — vista para completados con autoevaluación ──
function HistorialCard({ obj, valExt = [] }: { obj: Objetivo; valExt?: any[] }) {
  const [expanded, setExpanded]     = useState(false)
  const [autoEval, setAutoEval]     = useState((obj as any).autoevaluacion ?? '')
  const [comentarioEmp, setComentarioEmp] = useState((obj as any).comentario_empleado ?? '')
  const [savingAuto, setSavingAuto] = useState(false)
  const [autoSaved, setAutoSaved]   = useState(false)

  const validacion = (obj as any).validacion
  const auto       = (obj as any).autoevaluacion

  // Resultado final: prioriza validación del supervisor, sino autoevaluación
  let resultado = ''
  let resultadoColor = '#6b7280'
  if (validacion === 'De acuerdo')                   { resultado = 'Validado';       resultadoColor = '#15803d' }
  else if (validacion === 'Parcialmente de acuerdo') { resultado = 'Parcial';        resultadoColor = '#b45309' }
  else if (validacion === 'En desacuerdo')           { resultado = 'En desacuerdo';  resultadoColor = '#b91c1c' }
  else if (auto === 'Cumplido')                      { resultado = 'Cumplido';       resultadoColor = '#15803d' }
  else if (auto === 'Parcialmente cumplido')         { resultado = 'Parcial';        resultadoColor = '#b45309' }
  else if (auto === 'No cumplido')                   { resultado = 'No cumplido';    resultadoColor = '#b91c1c' }

  // Indicador: falta autoevaluación propia
  const faltaAuto = !autoEval

  async function handleGuardarAuto() {
    if (!autoEval) return
    setSavingAuto(true)
    await supabase.from('objetivos').update({
      autoevaluacion:     autoEval,
      comentario_empleado: comentarioEmp || null,
    }).eq('id', obj.id)
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2500)
    setSavingAuto(false)
  }

  return (
    <div className="traza-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CheckCircle2 size={15} className="text-gray-300 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{obj.titulo}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {obj.fecha_limite && (
                <p className="text-xs text-gray-400">{formatFecha(obj.fecha_limite)}</p>
              )}
              {(obj as any).completado_en && (
                <p className="text-[10px] text-gray-300">
                  · Completado {new Date((obj as any).completado_en).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
              {!(obj as any).completado_en && (obj as any).created_at && (
                <p className="text-[10px] text-gray-300">
                  Creado {new Date((obj as any).created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          {faltaAuto && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
              <Star size={11} strokeWidth={2} /> Pendiente
            </span>
          )}
          {resultado && !faltaAuto && (
            <span className="text-xs font-semibold" style={{ color: resultadoColor }}>{resultado}</span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {obj.descripcion && <p className="text-sm text-gray-600">{obj.descripcion}</p>}

          {/* Validación del supervisor */}
          {(obj as any).validacion && (
            <div className="rounded-xl border border-gray-100 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400">Validación del supervisor</p>
              <p className="text-sm font-medium text-gray-800">{(obj as any).validacion}</p>
              {(obj as any).comentario_supervisor?.trim() && (
                <p className="text-sm text-gray-500 italic">"{(obj as any).comentario_supervisor}"</p>
              )}
            </div>
          )}
          {(obj as any).validacion_admin && (
            <div className="rounded-xl border border-gray-100 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400">Validación del admin</p>
              <p className="text-sm font-medium text-gray-800">{(obj as any).validacion_admin}</p>
            </div>
          )}

          {/* Validaciones externas */}
          {valExt.length > 0 && (
            <div className="rounded-xl border border-gray-100 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400">Validaciones externas ({valExt.length})</p>
              {valExt.map((v: any, i: number) => {
                const color = v.calificacion === 'De acuerdo' ? '#15803d' : v.calificacion === 'Parcialmente de acuerdo' ? '#b45309' : '#b91c1c'
                const nivelLabel = v.nivel_confianza === 'corporativo' ? '🏢 Corporativo' : v.nivel_confianza === 'personal' ? '👤 Personal' : '—'
                return (
                  <div key={i} className="flex items-start gap-3 py-1.5 border-t border-gray-50 first:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700">{v.nombre || 'Anónimo'}</span>
                        <span className="text-xs text-gray-400">{nivelLabel}</span>
                        <span className="text-xs font-medium" style={{ color }}>{v.calificacion}</span>
                        {v.confirmado === false && (
                          <span className="text-xs text-amber-500 font-medium">· Pendiente de confirmación</span>
                        )}
                      </div>
                      {v.comentario?.trim() && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">"{v.comentario}"</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">
                      {new Date(v.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Autoevaluación — formulario editable */}
          <div className="bg-amber-50 rounded-xl p-4 space-y-3 border border-amber-100">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-amber-400" strokeWidth={1.75} />
              <p className="text-xs font-semibold text-gray-700">Tu autoevaluación</p>
              {autoSaved && <span className="text-xs text-green-500 ml-auto">Guardada ✓</span>}
              {!autoSaved && autoEval && <span className="text-xs text-gray-400 ml-auto">completada</span>}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['Cumplido', 'Parcialmente cumplido', 'No cumplido'].map(opt => (
                <label key={opt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${autoEval === opt ? 'border-traza-700 bg-traza-50 font-medium' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" value={opt} checked={autoEval === opt} onChange={e => setAutoEval(e.target.value)} className="text-traza-700" />
                  {opt}
                </label>
              ))}
            </div>
            <textarea className="traza-input text-sm min-h-[64px] resize-none bg-white"
              placeholder="¿Cómo evaluás tu desempeño en este objetivo?"
              value={comentarioEmp} onChange={e => setComentarioEmp(e.target.value)} />
            <Button size="sm" loading={savingAuto} onClick={handleGuardarAuto} disabled={!autoEval}>
              {autoEval ? 'Actualizar autoevaluación' : 'Guardar autoevaluación'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CierreSemanal ─────────────────────────────────────────────
function CierreSemanal({ personaId }: { personaId: string }) {
  const [cierre, setCierre]   = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ que_avance: '', que_obstaculos: '', que_necesito: '' })

  function getLunes() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }
  const semana = getLunes()

  useEffect(() => {
    supabase.from('cierres_semanales').select('*').eq('persona_id', personaId).eq('semana', semana).maybeSingle()
      .then(({ data }) => {
        setCierre(data)
        if (data) setForm({ que_avance: data.que_avance ?? '', que_obstaculos: data.que_obstaculos ?? '', que_necesito: data.que_necesito ?? '' })
      })
  }, [personaId])

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).maybeSingle()
    const payload = { empresa_id: profile?.empresa_id ?? null, persona_id: personaId, semana, que_avance: form.que_avance || null, que_obstaculos: form.que_obstaculos || null, que_necesito: form.que_necesito || null, creado_por: user!.id }
    if (cierre) { await supabase.from('cierres_semanales').update(payload).eq('id', cierre.id) }
    else        { await supabase.from('cierres_semanales').insert(payload) }
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
        <button onClick={() => setEditing(!editing)} className="text-xs text-traza-700 font-medium hover:underline">
          {cierre ? 'Editar' : 'Completar'}
        </button>
      </div>
      {!editing && cierre && (
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '¿Qué avancé esta semana?', val: cierre.que_avance },
            { label: '¿Qué obstáculos tuve?',    val: cierre.que_obstaculos },
            { label: '¿Qué necesito para la próxima?', val: cierre.que_necesito },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-sm text-gray-700">{item.val || <span className="text-gray-300">—</span>}</p>
            </div>
          ))}
        </div>
      )}
      {!editing && !cierre && (
        <div className="px-5 py-5 text-center">
          <p className="text-sm text-gray-400 mb-2">Todavía no completaste el cierre de esta semana.</p>
          <button onClick={() => setEditing(true)} className="text-sm font-medium text-traza-700 hover:underline">Completar ahora →</button>
        </div>
      )}
      {editing && (
        <form onSubmit={handleGuardar} className="px-5 py-4 space-y-3">
          {[
            { label: '¿Qué avancé esta semana?', key: 'que_avance', ph: 'Describí tus logros...' },
            { label: '¿Qué obstáculos tuve?',    key: 'que_obstaculos', ph: '¿Qué te frenó?' },
            { label: '¿Qué necesito para la próxima semana?', key: 'que_necesito', ph: 'Recursos, apoyo...' },
          ].map(({ label, key, ph }) => (
            <div key={key}>
              <label className="traza-label">{label}</label>
              <textarea className="traza-input min-h-[64px] resize-none text-sm" value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>Guardar cierre</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── ObjetivoCard ──────────────────────────────────────────────
function ObjetivoCard({ obj, saving, onUpdate, onUpdateAuto, onDelete, autoExpand, valExt = [] }: {
  obj: Objetivo
  saving: string | null
  onUpdate: (id: string, estado: string, completadoEn?: string) => void
  onUpdateAuto: (id: string, auto: string, comentario: string) => void
  onDelete?: (id: string) => void
  autoExpand?: boolean
  valExt?: any[]
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
  const [tokenUrl, setTokenUrl]         = useState<string | null>(null)
  const [tokenError, setTokenError]     = useState<string | null>(null)
  const [generando, setGenerando]       = useState(false)
  const [copiado, setCopiado]           = useState(false)
  // Upload de archivos
  const [uploadingFile, setUploadingFile]     = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  // Concluir objetivo (independientes)
  const [showConcluir, setShowConcluir]       = useState(false)
  const [concluirFecha, setConcluirFecha]     = useState(new Date().toISOString().split('T')[0])
  const [concluirAuto, setConcluirAuto]       = useState('')
  const [concluirComentario, setConcluirComentario] = useState('')
  const [savingConcluir, setSavingConcluir]   = useState(false)
  // Edición de avances
  const [editingAvanceId,  setEditingAvanceId]  = useState<string | null>(null)
  const [editingContent,   setEditingContent]   = useState('')
  const [savingEdit,       setSavingEdit]       = useState(false)
  // Feedback de cliente (feature 4.1)
  const [fbClienteShowing,  setFbClienteShowing]  = useState(false)
  const [fbClienteNombre,   setFbClienteNombre]   = useState('')
  const [fbClienteEmail,    setFbClienteEmail]    = useState('')
  const [fbClienteEnviando, setFbClienteEnviando] = useState(false)
  const [fbClienteOk,       setFbClienteOk]       = useState(false)
  const vencido = isVencido(obj.fecha_limite, obj.estado)

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true)
      setTimeout(() => document.getElementById(`obj-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [autoExpand])

  useEffect(() => { if (expanded) loadAvances() }, [expanded])

  async function loadAvances() {
    const { data } = await supabase.from('objetivo_avances').select('*').eq('objetivo_id', obj.id).order('creado_en', { ascending: true })
    setAvances(data ?? [])
  }

  async function addAvance() {
    if (!addingContent.trim() || !addingType) return
    setSavingAvance(true)
    try {
      const res = await fetch('/api/crear-avance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objetivo_id: obj.id, tipo: addingType, contenido: addingContent.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert('Error al guardar el avance: ' + (json.error ?? 'Error desconocido'))
        setSavingAvance(false)
        return
      }
      track('advance_added', { tipo: addingType })
      setAddingContent('')
      setAddingType(null)
      setUploadedFileName(null)
      await loadAvances()
    } catch (err: any) {
      alert('Error de conexión al guardar el avance.')
    }
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

  async function updateAvance(avanceId: string, newContent: string) {
    if (!newContent.trim()) return
    setSavingEdit(true)
    await supabase.from('objetivo_avances').update({ contenido: newContent.trim() }).eq('id', avanceId)
    setAvances(prev => prev.map(a => a.id === avanceId ? { ...a, contenido: newContent.trim() } : a))
    setEditingAvanceId(null)
    setEditingContent('')
    setSavingEdit(false)
  }

  async function deleteAvance(avanceId: string) {
    if (!confirm('¿Eliminar este avance?')) return
    await supabase.from('objetivo_avances').delete().eq('id', avanceId)
    setAvances(prev => prev.filter(a => a.id !== avanceId))
    setEditingAvanceId(null)
    setEditingContent('')
  }

  async function generarToken() {
    setGenerando(true); setTokenError(null)
    try {
      const res  = await fetch('/api/generar-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objetivoId: obj.id }) })
      const data = await res.json()
      if (res.ok) setTokenUrl(data.url)
      else setTokenError(data.error ?? `Error ${res.status}`)
    } catch (e: any) { setTokenError(e?.message ?? 'Error de conexión') }
    finally { setGenerando(false) }
  }

  async function copiarUrl() {
    if (!tokenUrl) return
    await navigator.clipboard.writeText(tokenUrl)
    setCopiado(true); setTimeout(() => setCopiado(false), 2500)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede superar 10MB')
      return
    }
    setUploadingFile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${obj.id}/${Date.now()}_${safeName}`
      const { error } = await supabase.storage.from('evidencias').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(path)
      setAddingContent(publicUrl)
      setUploadedFileName(file.name)
    } catch (err: any) {
      alert('Error al subir el archivo: ' + (err?.message ?? 'Error desconocido'))
    }
    setUploadingFile(false)
  }

  async function handleConcluir() {
    if (!concluirAuto) { alert('Seleccioná tu autoevaluación antes de concluir.'); return }
    setSavingConcluir(true)
    try {
      await fetch('/api/actualizar-objetivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivo_id: obj.id,
          estado: 'Completado',
          completado_en: new Date(concluirFecha + 'T12:00:00').toISOString(),
          autoevaluacion: concluirAuto,
          comentario_empleado: concluirComentario || null,
        }),
      })
      onUpdate(obj.id, 'Completado', concluirFecha)
      setShowConcluir(false)
      setExpanded(false)
    } catch {
      alert('Error de conexión. Intentá de nuevo.')
    }
    setSavingConcluir(false)
  }

  async function pedirFeedbackCliente() {
    if (!fbClienteNombre.trim() || !fbClienteEmail.trim()) return
    setFbClienteEnviando(true)
    try {
      await fetch('/api/feedback-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:         'solicitar',
          objetivo_id:    obj.id,
          persona_id:     obj.persona_id,
          empresa_id:     (obj as any).empresa_id ?? null,
          nombre_cliente: fbClienteNombre.trim(),
          email_cliente:  fbClienteEmail.trim(),
        }),
      })
      setFbClienteOk(true)
      setFbClienteShowing(false)
    } catch { /* silenciar */ }
    setFbClienteEnviando(false)
  }

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const yaCompletado = estado === 'Completado' || obj.estado === 'Completado'
  const borde = prioridadBorde(obj.prioridad)

  // Estado como texto simple
  const estadoLabel = vencido ? 'Vencido' : estado === 'En progreso' ? 'En progreso' : ''

  return (
    <div
      id={`obj-${obj.id}`}
      className={cn('bg-white rounded-2xl overflow-hidden transition-all', autoExpand && 'ring-2 ring-traza-300')}
      style={{
        border: '1px solid #E2E8F0',
        borderLeft: `3px solid ${borde}`,
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 leading-tight">{obj.titulo}</p>
            {(obj as any).grupo_id && (() => {
              const tipo = (obj as any).grupo?.tipo ?? 'equipo'
              const label: Record<string, string> = { equipo: 'En equipo', area: 'Por área', externo: 'Con externos' }
              return (
                <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border border-gray-200 text-gray-500 bg-white font-medium flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {label[tipo] ?? 'Grupal'}
                </span>
              )
            })()}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {obj.fecha_limite && <p className="text-xs text-gray-400">{formatFecha(obj.fecha_limite)}</p>}
            {vencido && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle size={11} /> Vencido
              </span>
            )}
            {!vencido && estadoLabel && (
              <span className="text-xs text-gray-400">{estadoLabel}</span>
            )}
            {obj.categoria && <span className="text-xs text-gray-300">{obj.categoria}</span>}
            {(obj as any).created_at && (
              <span className="text-[10px] text-gray-300 ml-auto">
                Creado {new Date((obj as any).created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {/* Estado */}
          <div className="px-5 py-4 space-y-3">
            {obj.descripcion && <p className="text-sm text-gray-600">{obj.descripcion}</p>}

            {/* === Independientes: panel "Concluir objetivo" === */}
            {(obj as any).empresa_id === null && !yaCompletado && (
              <div>
                {!showConcluir ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <label className="traza-label">Estado</label>
                      <select className="traza-input" value={estado} onChange={e => setEstado(e.target.value as any)}>
                        <option>Pendiente</option>
                        <option>En progreso</option>
                      </select>
                    </div>
                    <Button size="sm" loading={saving === obj.id} onClick={() => { onUpdate(obj.id, estado); setExpanded(false) }}>Guardar</Button>
                    <button
                      onClick={() => setShowConcluir(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border-2 border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle2 size={13} /> Concluir objetivo
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-green-600" />
                        <p className="text-sm font-bold text-green-800">Concluir este objetivo</p>
                      </div>
                      <button onClick={() => setShowConcluir(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                    </div>

                    <div>
                      <label className="traza-label">¿Cuándo lo completaste?</label>
                      <input type="date" className="traza-input"
                        value={concluirFecha} max={new Date().toISOString().split('T')[0]}
                        onChange={e => setConcluirFecha(e.target.value)} />
                    </div>

                    <div>
                      <label className="traza-label flex items-center gap-1">
                        <Star size={12} className="text-amber-400" /> ¿Cómo lo evaluás? *
                      </label>
                      <div className="grid grid-cols-1 gap-2 mt-1">
                        {[
                          { val: 'Cumplido',              label: 'Cumplido',              desc: 'Lograste el objetivo según lo planeado' },
                          { val: 'Parcialmente cumplido', label: 'Parcialmente cumplido', desc: 'Lo lograste en parte' },
                          { val: 'No cumplido',           label: 'No cumplido',           desc: 'No llegaste al resultado esperado' },
                        ].map(opt => (
                          <label key={opt.val}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${concluirAuto === opt.val ? 'border-green-500 bg-white font-semibold' : 'border-green-200 bg-white/60 hover:bg-white'}`}>
                            <input type="radio" value={opt.val} checked={concluirAuto === opt.val}
                              onChange={e => setConcluirAuto(e.target.value)} className="mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-800">{opt.label}</p>
                              <p className="text-xs text-gray-400">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="traza-label">Comentario (opcional)</label>
                      <textarea className="traza-input text-sm min-h-[60px] resize-none bg-white"
                        placeholder="¿Algo que quieras agregar sobre cómo fue?"
                        value={concluirComentario} onChange={e => setConcluirComentario(e.target.value)} />
                    </div>

                    <Button loading={savingConcluir} onClick={handleConcluir} disabled={!concluirAuto}>
                      Guardar y concluir objetivo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* === Empleados de empresa: panel estándar === */}
            {(obj as any).empresa_id !== null && (
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="traza-label">Estado</label>
                  <select className="traza-input" value={estado} onChange={e => setEstado(e.target.value as any)}>
                    <option>Pendiente</option>
                    <option>En progreso</option>
                    <option>Completado</option>
                  </select>
                </div>
                <Button size="sm" loading={saving === obj.id} onClick={() => { onUpdate(obj.id, estado); setExpanded(false) }}>Guardar</Button>
              </div>
            )}

            {/* Autoevaluación — para objetivos ya completados o empleados de empresa */}
            {yaCompletado && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-400" strokeWidth={1.75} />
                  <p className="text-xs font-semibold text-gray-700">Tu autoevaluación</p>
                  {(obj as any).autoevaluacion && !autoSaved && <span className="text-xs text-gray-400">ya completada</span>}
                  {autoSaved && <span className="text-xs text-green-500">Guardada ✓</span>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {['Cumplido', 'Parcialmente cumplido', 'No cumplido'].map(opt => (
                    <label key={opt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${autoEval === opt ? 'border-traza-700 bg-traza-50 font-medium' : 'border-gray-200 hover:bg-white'}`}>
                      <input type="radio" value={opt} checked={autoEval === opt} onChange={e => setAutoEval(e.target.value)} className="text-traza-700" />
                      {opt}
                    </label>
                  ))}
                </div>
                <textarea className="traza-input text-sm min-h-[64px] resize-none"
                  placeholder="¿Querés agregar algo sobre tu desempeño en este objetivo?"
                  value={comentarioEmp} onChange={e => setComentarioEmp(e.target.value)} />
                <Button size="sm" loading={savingAuto} onClick={handleGuardarAuto} disabled={!autoEval}>Guardar autoevaluación</Button>
              </div>
            )}

            {/* Validación supervisor — solo si existe */}
            {(obj as any).validacion && (
              <div className="rounded-xl border border-gray-100 px-4 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400">Validación del supervisor</p>
                <p className="text-sm font-medium text-gray-800">{(obj as any).validacion}</p>
                {(obj as any).comentario_supervisor?.trim() && (
                  <p className="text-sm text-gray-500 italic">"{(obj as any).comentario_supervisor}"</p>
                )}
                {(() => {
                  const disc = detectarDiscrepancia((obj as any).autoevaluacion, (obj as any).validacion)
                  if (!disc) return null
                  return (
                    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs mt-1 ${disc === 'alta' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                      <span>{disc === 'alta' ? 'Tu autoevaluación difiere significativamente de la validación del supervisor.' : 'Hay una diferencia entre tu autoevaluación y la del supervisor.'}</span>
                    </div>
                  )
                })()}
              </div>
            )}

            {onDelete && (
              <button onClick={() => onDelete(obj.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar objetivo</button>
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
                    visto:       { bg: '#EDEFFD', border: '#BBC5F7', dot: '#3350D0', label: 'Visto'       },
                    aprobado:    { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', label: 'Aprobado'    },
                    a_revisar:   { bg: '#fff1f2', border: '#fecaca', dot: '#dc2626', label: 'A revisar'   },
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
                          {editingAvanceId === a.id ? (
                            <div className="space-y-2">
                              {a.tipo === 'comentario' ? (
                                <textarea
                                  autoFocus rows={3}
                                  className="w-full text-sm rounded-xl border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-traza-400 bg-white"
                                  value={editingContent}
                                  onChange={e => setEditingContent(e.target.value)}
                                />
                              ) : (
                                <input
                                  autoFocus type="url"
                                  className="w-full text-sm rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:border-traza-400 bg-white"
                                  value={editingContent}
                                  onChange={e => setEditingContent(e.target.value)}
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateAvance(a.id, editingContent)}
                                  disabled={!editingContent.trim() || savingEdit}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all"
                                  style={{ backgroundColor: '#3350D0' }}
                                >
                                  {savingEdit ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={() => { setEditingAvanceId(null); setEditingContent('') }}
                                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => deleteAvance(a.id)}
                                  className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 ml-auto transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  {a.tipo === 'archivo'
                                    ? <a href={a.contenido} target="_blank" rel="noopener noreferrer" className="text-traza-700 hover:underline text-xs flex items-center gap-1"><Paperclip size={11} />{(() => { try { return decodeURIComponent(a.contenido.split('/').pop()?.replace(/^\d+_/, '') ?? 'archivo') } catch { return 'archivo' } })()}</a>
                                    : a.tipo === 'link'
                                    ? <a href={a.contenido} target="_blank" rel="noopener noreferrer" className="text-traza-700 hover:underline break-all text-xs">{a.contenido}</a>
                                    : <p className="text-sm text-gray-700">{a.contenido}</p>}
                                </div>
                                <span className="text-[10px] text-gray-300 flex-shrink-0 whitespace-nowrap" style={{ lineHeight: '1.5rem' }}>
                                  {formatDT(a.creado_en)}
                                </span>
                              </div>
                              {a.aprobado_en && (
                                <p className="text-[10px] text-gray-300 mt-0.5">✓ Aprobado · {formatDT(a.aprobado_en)}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 ml-2">
                          {editingAvanceId !== a.id && (a.estado_revision ?? 'sin_revisar') === 'sin_revisar' && (
                            <button
                              onClick={() => { setEditingAvanceId(a.id); setEditingContent(a.contenido) }}
                              title="Editar avance"
                              className="text-gray-300 hover:text-gray-500 transition-colors"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rs.dot }} />
                          <span className="text-xs font-medium" style={{ color: rs.dot }}>{rs.label}</span>
                        </div>
                      </div>
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
            {/* Input conversacional */}
            <div className="pt-1">
              {/* Selector de tipo */}
              <div className="flex gap-1 mb-2">
                {([
                  { type: 'comentario' as const, icon: <MessageSquare size={12} />, label: 'Nota' },
                  { type: 'link'       as const, icon: <Link2 size={12} />,         label: 'Link' },
                  { type: 'archivo'    as const, icon: <Upload size={12} />,         label: 'Archivo' },
                ] as const).map(({ type, icon, label }) => (
                  <button key={type} onClick={() => { setAddingType(type); setAddingContent(''); setUploadedFileName(null) }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={addingType === type
                      ? { backgroundColor: '#3350D0', color: 'white' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {/* Campo de entrada */}
              {addingType === 'comentario' && (
                <div className="space-y-2">
                  <textarea autoFocus rows={3}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-gray-50"
                    placeholder="¿Qué avanzaste en este objetivo?"
                    value={addingContent} onChange={e => setAddingContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addAvance() }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Ctrl+Enter para enviar</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setAddingType(null); setAddingContent('') }} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancelar</button>
                      <button onClick={addAvance} disabled={!addingContent.trim() || savingAvance}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all"
                        style={{ backgroundColor: '#3350D0' }}>
                        {savingAvance ? 'Enviando...' : 'Registrar avance'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {addingType === 'link' && (
                <div className="space-y-2">
                  <input autoFocus type="url"
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-gray-50"
                    placeholder="https://..."
                    value={addingContent} onChange={e => setAddingContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addAvance() }}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setAddingType(null); setAddingContent('') }} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancelar</button>
                    <button onClick={addAvance} disabled={!addingContent.trim() || savingAvance}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40"
                      style={{ backgroundColor: '#3350D0' }}>
                      {savingAvance ? 'Enviando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              )}
              {addingType === 'archivo' && (
                <div className="space-y-2">
                  {!addingContent ? (
                    <label
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 cursor-pointer transition-colors"
                      style={uploadingFile ? { borderColor: '#3350D0', backgroundColor: '#EDEFFD' } : {}}
                      onMouseEnter={e => !uploadingFile && ((e.currentTarget as HTMLElement).style.borderColor = '#8899EE')}
                      onMouseLeave={e => !uploadingFile && ((e.currentTarget as HTMLElement).style.borderColor = '')}
                    >
                      <Upload size={20} style={{ color: uploadingFile ? '#3350D0' : '#CBD5E1' }} />
                      <span className="text-sm font-medium" style={{ color: uploadingFile ? '#3350D0' : '#94A3B8' }}>
                        {uploadingFile ? 'Subiendo archivo...' : 'Tocá para seleccionar un archivo'}
                      </span>
                      <span className="text-xs" style={{ color: '#CBD5E1' }}>PDF, Word, Excel, imagen · Máx. 10MB</span>
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploadingFile}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.zip"
                        onChange={handleFileUpload}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-green-200 bg-green-50">
                      <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 font-medium flex-1 min-w-0 truncate">{uploadedFileName}</span>
                      <button
                        onClick={() => { setAddingContent(''); setUploadedFileName(null) }}
                        className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setAddingType(null); setAddingContent(''); setUploadedFileName(null) }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addAvance}
                      disabled={!addingContent || uploadingFile || savingAvance}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40"
                      style={{ backgroundColor: '#3350D0' }}
                    >
                      {savingAvance ? 'Guardando...' : 'Guardar archivo'}
                    </button>
                  </div>
                </div>
              )}
              {!addingType && (
                <button onClick={() => setAddingType('comentario')}
                  className="w-full text-left text-sm text-gray-300 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 hover:border-gray-300 hover:text-gray-400 transition-colors">
                  Registrá un avance...
                </button>
              )}
            </div>
          </div>

          {/* Marcar mi parte — solo para objetivos grupales */}
          {(obj as any).grupo_id && (
            <div className="px-5 pb-4 pt-3 border-t border-gray-100">
              {yaCompletado ? (
                <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                  <CheckCircle2 size={13} />
                  Marcaste tu parte como completada
                </div>
              ) : (
                <button
                  onClick={() => { onUpdate(obj.id, 'Completado'); setEstado('Completado') }}
                  disabled={saving === obj.id}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-all disabled:opacity-40"
                >
                  <Check size={12} />
                  Marcar mi parte como completada
                </button>
              )}
            </div>
          )}

          {/* Validaciones externas recibidas */}
          {valExt.length > 0 && (
            <div className="px-5 pb-4">
              <div className="rounded-xl border border-gray-100 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-gray-400">Validaciones externas ({valExt.length})</p>
                {valExt.map((v: any, i: number) => {
                  const color = v.calificacion === 'De acuerdo' ? '#15803d' : v.calificacion === 'Parcialmente de acuerdo' ? '#b45309' : '#b91c1c'
                  const nivelLabel = v.nivel_confianza === 'corporativo' ? '🏢 Corporativo' : v.nivel_confianza === 'personal' ? '👤 Personal' : '—'
                  return (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-t border-gray-50 first:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-700">{v.nombre || 'Anónimo'}</span>
                          <span className="text-xs text-gray-400">{nivelLabel}</span>
                          <span className="text-xs font-medium" style={{ color }}>{v.calificacion}</span>
                          {v.confirmado === false && (
                            <span className="text-xs text-amber-500 font-medium">· Pendiente de confirmación</span>
                          )}
                        </div>
                        {v.comentario?.trim() && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">"{v.comentario}"</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 flex-shrink-0">
                        {new Date(v.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Validación externa + Feedback de cliente */}
          <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3">
            {/* Solicitar validación externa */}
            {!tokenUrl ? (
              <div className="space-y-1.5">
                <button onClick={generarToken} disabled={generando}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-traza-700 transition-colors disabled:opacity-50">
                  <Share2 size={12} />
                  {generando ? 'Generando link...' : 'Solicitar validación externa'}
                </button>
                {tokenError && <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">{tokenError}</p>}
              </div>
            ) : (
              <div className="rounded-xl p-3 space-y-2.5" style={{ backgroundColor: '#EDEFFD', border: '1px solid #BBC5F7' }}>
                <p className="text-xs font-semibold" style={{ color: '#1C2B90' }}>Link listo — compartí con el evaluador</p>
                {/* Link + copiar */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5" style={{ border: '1px solid #BBC5F7' }}>
                  <p className="text-xs truncate flex-1 font-mono" style={{ color: '#3350D0' }}>{tokenUrl}</p>
                  <button onClick={copiarUrl}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-all flex-shrink-0"
                    style={{ backgroundColor: copiado ? '#16a34a' : '#3350D0', color: 'white' }}>
                    {copiado ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                  </button>
                </div>
                {/* Compartir directo */}
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Hola! Te pido que valides uno de mis objetivos profesionales en TRAZA. Solo toma 2 minutos: ' + tokenUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.534 5.867L0 24l6.336-1.517A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.667-.523-5.18-1.433l-.372-.22-3.761.9.944-3.658-.242-.388A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent('Te pido una validación profesional')}&body=${encodeURIComponent('Hola,\n\nTe pido que valides uno de mis objetivos profesionales en TRAZA.\nPodés hacerlo desde este link (tarda menos de 2 minutos):\n\n' + tokenUrl + '\n\n¡Muchas gracias!')}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#3350D0' }}
                  >
                    <Mail size={11} />
                    Email
                  </a>
                </div>
                <p className="text-xs" style={{ color: '#8899EE' }}>Vence en 7 días · Un solo uso</p>
              </div>
            )}

            {/* Pedir feedback de cliente */}
            {fbClienteOk ? (
              <p className="text-xs text-green-600 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Email enviado al cliente
              </p>
            ) : !fbClienteShowing ? (
              <button
                onClick={() => setFbClienteShowing(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-traza-700 transition-colors"
              >
                <Users size={12} />
                Pedir opinión a un cliente
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500">Opinión de cliente</p>
                <input
                  type="text"
                  value={fbClienteNombre}
                  onChange={e => setFbClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"
                />
                <input
                  type="email"
                  value={fbClienteEmail}
                  onChange={e => setFbClienteEmail(e.target.value)}
                  placeholder="Email del cliente"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFbClienteShowing(false); setFbClienteNombre(''); setFbClienteEmail('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={pedirFeedbackCliente}
                    disabled={!fbClienteNombre.trim() || !fbClienteEmail.trim() || fbClienteEnviando}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-40"
                    style={{ backgroundColor: '#3350D0' }}
                  >
                    {fbClienteEnviando ? 'Enviando...' : 'Enviar pedido'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
