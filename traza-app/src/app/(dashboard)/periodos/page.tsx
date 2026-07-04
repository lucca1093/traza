'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { ChevronDown, ChevronRight, Lock, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'

function scoreColor(score: number) {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

function estadoBadge(estado: string) {
  if (estado === 'Cumplió')               return 'bg-green-50 text-green-700 border border-green-200'
  if (estado === 'Cumplió parcialmente')  return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (estado === 'No cumplió')            return 'bg-red-50 text-red-700 border border-red-200'
  return 'bg-gray-50 text-gray-400 border border-gray-200'
}

function sugerirNombre(tipo: string): string {
  const hoy   = new Date()
  const anio  = hoy.getFullYear()
  const mes   = hoy.getMonth() // 0-based
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  if (tipo === 'mensual') return `${meses[mes]} ${anio}`
  if (tipo === 'trimestral') {
    const q = Math.floor(mes / 3) + 1
    return `Q${q} ${anio}`
  }
  if (tipo === 'semestral') return mes < 6 ? `H1 ${anio}` : `H2 ${anio}`
  return `Anual ${anio}`
}

function sugerirFechas(tipo: string): { inicio: string; fin: string } {
  const hoy  = new Date()
  const anio = hoy.getFullYear()
  const mes  = hoy.getMonth()

  if (tipo === 'mensual') {
    const inicio = new Date(anio, mes, 1)
    const fin    = new Date(anio, mes + 1, 0)
    return { inicio: inicio.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] }
  }
  if (tipo === 'trimestral') {
    const q       = Math.floor(mes / 3)
    const inicio  = new Date(anio, q * 3, 1)
    const fin     = new Date(anio, q * 3 + 3, 0)
    return { inicio: inicio.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] }
  }
  if (tipo === 'semestral') {
    const inicio = mes < 6 ? new Date(anio, 0, 1) : new Date(anio, 6, 1)
    const fin    = mes < 6 ? new Date(anio, 5, 30) : new Date(anio, 11, 31)
    return { inicio: inicio.toISOString().split('T')[0], fin: fin.toISOString().split('T')[0] }
  }
  return { inicio: `${anio}-01-01`, fin: `${anio}-12-31` }
}

export default function PeriodosPage() {
  const [periodos, setPeriodos]       = useState<any[]>([])
  const [resumenes, setResumenes]     = useState<Record<string, any[]>>({})
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [cerrando, setCerrando]       = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [personas, setPersonas]       = useState<any[]>([])

  const [form, setForm] = useState({
    nombre: 'Q3 2026', tipo: 'trimestral',
    fecha_inicio: '', fecha_fin: '',
  })

  useEffect(() => {
    const fechas = sugerirFechas(form.tipo)
    setForm(f => ({ ...f, nombre: sugerirNombre(f.tipo), ...fechas }))
  }, [form.tipo])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()
    const empresaId = profile?.empresa_id
    if (!empresaId) return

    const [{ data: ps }, { data: pers }] = await Promise.all([
      supabase.from('periodos_evaluacion').select('*').eq('empresa_id', empresaId).order('fecha_inicio', { ascending: false }),
      supabase.from('personas').select('id, nombre, apellido, cargo, area').eq('empresa_id', empresaId),
    ])
    setPeriodos(ps ?? [])
    setPersonas(pers ?? [])

    // Cargar resúmenes de períodos cerrados
    const cerrados = (ps ?? []).filter(p => p.estado === 'cerrado').map(p => p.id)
    if (cerrados.length > 0) {
      const { data: res } = await supabase
        .from('resumen_periodo_empleado')
        .select('*')
        .in('periodo_id', cerrados)
      const grouped: Record<string, any[]> = {}
      ;(res ?? []).forEach((r: any) => {
        if (!grouped[r.periodo_id]) grouped[r.periodo_id] = []
        grouped[r.periodo_id].push(r)
      })
      setResumenes(grouped)
    }
    setLoading(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()
    await supabase.from('periodos_evaluacion').insert({
      empresa_id:   profile!.empresa_id,
      nombre:       form.nombre,
      tipo:         form.tipo,
      fecha_inicio: form.fecha_inicio,
      fecha_fin:    form.fecha_fin,
      estado:       'abierto',
    })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleCerrar(periodoId: string) {
    if (!confirm('¿Cerrar este período? Se generará un resumen de performance por cada colaborador. Esta acción no se puede deshacer.')) return
    setCerrando(periodoId)
    const res = await fetch('/api/periodos/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodoId }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      alert(`Error: ${error}`)
    } else {
      await load()
      setExpanded(prev => new Set([...prev, periodoId]))
    }
    setCerrando(null)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const abiertos  = periodos.filter(p => p.estado === 'abierto')
  const cerrados  = periodos.filter(p => p.estado === 'cerrado')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Períodos de Evaluación</h1>
          <p className="text-gray-500 mt-1 text-sm">Ciclos formales de review con resumen de performance por colaborador.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> Nuevo período
        </Button>
      </div>

      {/* Formulario nuevo período */}
      {showForm && (
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nuevo período de evaluación</h2>
          <form onSubmit={handleCrear} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="traza-label">Tipo de ciclo</label>
                <select className="traza-input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div>
                <label className="traza-label">Nombre del período</label>
                <input className="traza-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="traza-label">Fecha de inicio</label>
                <input type="date" className="traza-input" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} required />
              </div>
              <div>
                <label className="traza-label">Fecha de cierre</label>
                <input type="date" className="traza-input" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} required />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>Crear período</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Cargando...</div>
      ) : (
        <>
          {/* Período abierto */}
          {abiertos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Período activo</h2>
              {abiertos.map(p => (
                <div key={p.id} className="traza-card overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(p.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} →{' '}
                          {new Date(p.fecha_fin + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{p.tipo}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCerrar(p.id)}
                      disabled={cerrando === p.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <Lock size={12} />
                      {cerrando === p.id ? 'Cerrando...' : 'Cerrar período'}
                    </button>
                  </div>
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Al cerrar el período se genera automáticamente el resumen de performance de cada colaborador. Esta acción es irreversible.</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {abiertos.length === 0 && periodos.length > 0 && (
            <div className="traza-card px-6 py-4 flex items-center gap-3 border border-dashed border-gray-200 bg-transparent shadow-none">
              <Plus size={15} className="text-gray-400" />
              <p className="text-sm text-gray-400">No hay ningún período activo. Creá uno nuevo para empezar a trackear.</p>
            </div>
          )}

          {/* Historial de períodos cerrados */}
          {cerrados.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Historial</h2>
              {cerrados.map(p => {
                const isOpen = expanded.has(p.id)
                const ress   = resumenes[p.id] ?? []
                const scorePromedio = ress.length > 0
                  ? Math.round(ress.reduce((s: number, r: any) => s + r.score, 0) / ress.length)
                  : 0

                return (
                  <div key={p.id} className="traza-card overflow-hidden">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-gray-300 flex-shrink-0">
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                      <Lock size={13} className="text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(p.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} →{' '}
                          {new Date(p.fecha_fin + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{p.tipo}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: scoreColor(scorePromedio) }}>{scorePromedio}</p>
                          <p className="text-xs text-gray-400">score prom.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{ress.length}</p>
                          <p className="text-xs text-gray-400">colaboradores</p>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100">
                        {/* Header columnas */}
                        <div className="grid grid-cols-12 gap-2 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                          <div className="col-span-3">Colaborador</div>
                          <div className="col-span-2 text-center">Score</div>
                          <div className="col-span-2 text-center">Objetivos</div>
                          <div className="col-span-2 text-center">Completados</div>
                          <div className="col-span-3 text-center">Estado</div>
                        </div>
                        {ress.length === 0 ? (
                          <p className="text-sm text-gray-400 px-6 py-4">Sin datos para este período.</p>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {ress
                              .sort((a: any, b: any) => b.score - a.score)
                              .map((r: any) => {
                                const persona = personas.find(p => p.id === r.persona_id)
                                return (
                                  <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-6 py-3">
                                    <div className="col-span-3 flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-traza-700 text-[10px] font-bold">
                                          {persona?.nombre?.[0]}{persona?.apellido?.[0]}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{persona?.cargo}</p>
                                      </div>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                      <span className="text-base font-bold" style={{ color: scoreColor(r.score) }}>{r.score}</span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                      <span className="text-sm text-gray-700">{r.total_objetivos}</span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                      <span className="text-sm text-gray-700">{r.completados}</span>
                                      <span className="text-xs text-gray-400 ml-1">({r.cumplimiento}%)</span>
                                    </div>
                                    <div className="col-span-3 flex justify-center">
                                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${estadoBadge(r.estado_general)}`}>
                                        {r.estado_general}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {periodos.length === 0 && !showForm && (
            <div className="traza-card p-12 text-center">
              <CheckCircle2 size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Todavía no creaste ningún período de evaluación.</p>
              <p className="text-gray-400 text-sm mt-1">Creá uno para empezar a estructurar los ciclos de performance.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-medium text-traza-700 hover:underline">
                Crear primer período →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
