'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, getValidacionStyle, formatFecha, calcularIndiceTraza } from '@/lib/traza'
import { ChevronDown, ChevronRight, Paperclip, FileSpreadsheet, FileText, Lock, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'

// ─── helpers períodos ────────────────────────────────────────
function scoreColor(s: number) { return s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626' }
function estadoBadge(e: string) {
  if (e === 'Cumplió')              return 'bg-green-50 text-green-700 border border-green-200'
  if (e === 'Cumplió parcialmente') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (e === 'No cumplió')           return 'bg-red-50 text-red-700 border border-red-200'
  return 'bg-gray-50 text-gray-400 border border-gray-200'
}
function sugerirNombre(tipo: string) {
  const hoy = new Date(); const anio = hoy.getFullYear(); const mes = hoy.getMonth()
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  if (tipo === 'mensual')    return `${meses[mes]} ${anio}`
  if (tipo === 'trimestral') return `Q${Math.floor(mes/3)+1} ${anio}`
  if (tipo === 'semestral')  return mes < 6 ? `H1 ${anio}` : `H2 ${anio}`
  return `Anual ${anio}`
}
function sugerirFechas(tipo: string): { inicio: string; fin: string } {
  const hoy = new Date(); const anio = hoy.getFullYear(); const mes = hoy.getMonth()
  if (tipo === 'mensual') {
    return { inicio: new Date(anio,mes,1).toISOString().split('T')[0], fin: new Date(anio,mes+1,0).toISOString().split('T')[0] }
  }
  if (tipo === 'trimestral') {
    const q = Math.floor(mes/3)
    return { inicio: new Date(anio,q*3,1).toISOString().split('T')[0], fin: new Date(anio,q*3+3,0).toISOString().split('T')[0] }
  }
  if (tipo === 'semestral') {
    return mes < 6
      ? { inicio: `${anio}-01-01`, fin: `${anio}-06-30` }
      : { inicio: `${anio}-07-01`, fin: `${anio}-12-31` }
  }
  return { inicio: `${anio}-01-01`, fin: `${anio}-12-31` }
}

export default function ReportesPage() {
  const [tab, setTab] = useState<'reportes' | 'periodos'>('reportes')

  // ── estado reportes ──────────────────────────────────────
  const [datos, setDatos]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [filtroEstado, setFiltroEstado]   = useState('todos')
  const [empresas, setEmpresas]           = useState<any[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')
  const [expanded, setExpanded]           = useState<Set<string>>(new Set())
  const [isSuperAdmin, setIsSuperAdmin]   = useState(false)
  const [empresaId, setEmpresaId]         = useState<string>('todas')

  // ── estado períodos ──────────────────────────────────────
  const [periodos, setPeriodos]       = useState<any[]>([])
  const [resumenes, setResumenes]     = useState<Record<string, any[]>>({})
  const [loadingPer, setLoadingPer]   = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [expandedPer, setExpandedPer] = useState<Set<string>>(new Set())
  const [cerrando, setCerrando]       = useState<string | null>(null)
  const [savingPer, setSavingPer]     = useState(false)
  const [personasPer, setPersonasPer] = useState<any[]>([])
  const [form, setForm] = useState({ nombre: '', tipo: 'trimestral', fecha_inicio: '', fecha_fin: '' })

  // ── init ─────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('rol, empresa_id').eq('id', user!.id).single()
      const superAdmin = p?.rol === 'super_admin'
      setIsSuperAdmin(superAdmin)
      if (superAdmin) {
        const { data: es } = await supabase.from('empresas').select('*').order('nombre')
        setEmpresas(es ?? [])
        await fetchReportes('todas')
      } else if (p?.empresa_id) {
        setEmpresaId(p.empresa_id)
        setFiltroEmpresa(p.empresa_id)
        await fetchReportes(p.empresa_id)
        await fetchPeriodos(p.empresa_id)
        const { data: pers } = await supabase.from('personas').select('id,nombre,apellido,cargo,area').eq('empresa_id', p.empresa_id)
        setPersonasPer(pers ?? [])
      }
    }
    init()
  }, [])

  useEffect(() => {
    const fechas = sugerirFechas(form.tipo)
    setForm(f => ({ ...f, nombre: sugerirNombre(f.tipo), ...fechas }))
  }, [form.tipo])

  useEffect(() => { fetchReportes() }, [filtroEstado, filtroEmpresa])

  // ── reportes ─────────────────────────────────────────────
  async function fetchReportes(eid = filtroEmpresa) {
    setLoading(true)
    let q = supabase.from('objetivos').select('*, persona:personas(id, nombre, apellido, cargo, area)').order('created_at', { ascending: false })
    if (filtroEstado !== 'todos') q = q.eq('estado', filtroEstado)
    if (eid !== 'todas') q = q.eq('empresa_id', eid)
    const { data } = await q
    setDatos(data ?? [])
    setLoading(false)
  }

  function togglePersona(pid: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n })
  }

  function exportCSV() {
    const headers = ['Colaborador','Cargo','Área','Objetivo','Descripción','Prioridad','Fecha límite','Estado','Validación','Comentario supervisor']
    const rows = datos.map(d => [
      d.persona ? `${d.persona.nombre} ${d.persona.apellido}` : '',
      d.persona?.cargo ?? '', d.persona?.area ?? '', d.titulo, d.descripcion ?? '',
      d.prioridad, d.fecha_limite ?? '', d.estado, d.validacion ?? '', d.comentario_supervisor ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `reporte_traza_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const fecha = new Date().toISOString().split('T')[0]
    const wb = XLSX.utils.book_new()
    const hd = ['Colaborador','Cargo','Área','Objetivo','Descripción','Prioridad','Fecha límite','Estado','Validación','Comentario supervisor']
    const rd = datos.map(d => [
      d.persona ? `${d.persona.nombre} ${d.persona.apellido}` : '',
      d.persona?.cargo ?? '', d.persona?.area ?? '', d.titulo, d.descripcion ?? '',
      d.prioridad, d.fecha_limite ? formatFecha(d.fecha_limite) : '', d.estado, d.validacion ?? '', d.comentario_supervisor ?? '',
    ])
    const ws1 = XLSX.utils.aoa_to_sheet([hd, ...rd])
    ws1['!cols'] = [20,18,15,30,35,10,12,14,20,35].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws1, 'Detalle')

    const personasMap2: Record<string, { persona: any; objetivos: any[] }> = {}
    datos.forEach(d => { const pid = d.persona?.id ?? 'x'; if (!personasMap2[pid]) personasMap2[pid] = { persona: d.persona, objetivos: [] }; personasMap2[pid].objetivos.push(d) })
    const gr2 = Object.values(personasMap2)
    const hr = ['Colaborador','Cargo','Área','Total','Completados','Cumplimiento %','Índice Traza','Validados','Parciales','Rechazados']
    const rr = gr2.map(({ persona, objetivos: obs }) => {
      const i = calcularIndiceTraza(obs)
      return [persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar', persona?.cargo ?? '', persona?.area ?? '', i.total, i.completados, `${i.cumplimiento}%`, i.score, i.positivos, i.parciales, i.negativos]
    })
    const ws2 = XLSX.utils.aoa_to_sheet([hr, ...rr])
    ws2['!cols'] = [22,18,15,14,12,13,12,10,10,12].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen por persona')
    XLSX.writeFile(wb, `reporte_traza_${fecha}.xlsx`)
  }

  function exportPDF() {
    const personasMap3: Record<string, { persona: any; objetivos: any[] }> = {}
    datos.forEach(d => { const pid = d.persona?.id ?? 'x'; if (!personasMap3[pid]) personasMap3[pid] = { persona: d.persona, objetivos: [] }; personasMap3[pid].objetivos.push(d) })
    const grupos3 = Object.values(personasMap3)
    const fecha = new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })
    const pw = window.open('', '_blank'); if (!pw) return
    const rows = grupos3.map(({ persona, objetivos: obs }) => {
      const i = calcularIndiceTraza(obs)
      const nombre = persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar'
      const or = obs.map((o: any) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${o.titulo}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${o.prioridad}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${o.estado}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${o.validacion??'—'}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:11px;color:#666">${o.comentario_supervisor??'—'}</td></tr>`).join('')
      return `<div style="margin-bottom:32px;break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:center;background:#0F4C81;color:white;padding:10px 14px;border-radius:8px 8px 0 0"><div><strong style="font-size:14px">${nombre}</strong><span style="font-size:12px;margin-left:10px;opacity:.8">${persona?.cargo??''}${persona?.area?` · ${persona.area}`:''}</span></div><div style="text-align:right"><span style="font-size:20px;font-weight:bold">${i.score}</span><span style="font-size:11px;opacity:.8">/100</span><div style="font-size:11px;opacity:.7">${i.completados}/${i.total} completados</div></div></div><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#f8f9fa"><th style="padding:7px 10px;text-align:left;font-weight:600;color:#555">Objetivo</th><th style="padding:7px 10px;text-align:center;font-weight:600;color:#555">Prioridad</th><th style="padding:7px 10px;text-align:center;font-weight:600;color:#555">Estado</th><th style="padding:7px 10px;text-align:center;font-weight:600;color:#555">Validación</th><th style="padding:7px 10px;text-align:left;font-weight:600;color:#555">Comentario</th></tr></thead><tbody>${or}</tbody></table></div>`
    }).join('')
    pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte Traza — ${fecha}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,Arial,sans-serif;color:#1a1a1a;padding:40px}@media print{body{padding:20px}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #0F4C81"><div><div style="font-size:22px;font-weight:800;color:#0F4C81">TRAZA</div><div style="font-size:16px;font-weight:600;margin-top:4px">Reporte de Performance</div></div><div style="text-align:right;font-size:12px;color:#666"><div>${fecha}</div></div></div>${rows}</body></html>`)
    pw.document.close(); setTimeout(() => pw.print(), 400)
  }

  // ── períodos ──────────────────────────────────────────────
  async function fetchPeriodos(eid: string) {
    setLoadingPer(true)
    const { data: ps } = await supabase.from('periodos_evaluacion').select('*').eq('empresa_id', eid).order('fecha_inicio', { ascending: false })
    setPeriodos(ps ?? [])
    const cerrados = (ps ?? []).filter((p: any) => p.estado === 'cerrado').map((p: any) => p.id)
    if (cerrados.length > 0) {
      const { data: res } = await supabase.from('resumen_periodo_empleado').select('*').in('periodo_id', cerrados)
      const grouped: Record<string, any[]> = {}
      ;(res ?? []).forEach((r: any) => { if (!grouped[r.periodo_id]) grouped[r.periodo_id] = []; grouped[r.periodo_id].push(r) })
      setResumenes(grouped)
    }
    setLoadingPer(false)
  }

  async function handleCrearPeriodo(e: React.FormEvent) {
    e.preventDefault(); setSavingPer(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()
    await supabase.from('periodos_evaluacion').insert({ empresa_id: p!.empresa_id, nombre: form.nombre, tipo: form.tipo, fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin, estado: 'abierto' })
    setShowForm(false); await fetchPeriodos(p!.empresa_id); setSavingPer(false)
  }

  async function handleCerrarPeriodo(periodoId: string) {
    if (!confirm('¿Cerrar este período? Se generará un resumen de performance por cada colaborador. Esta acción no se puede deshacer.')) return
    setCerrando(periodoId)
    const res = await fetch('/api/periodos/cerrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodoId }) })
    if (!res.ok) { const { error } = await res.json(); alert(`Error: ${error}`) }
    else { await fetchPeriodos(empresaId); setExpandedPer(prev => new Set([...prev, periodoId])) }
    setCerrando(null)
  }

  function togglePer(id: string) {
    setExpandedPer(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── agrupado para reportes ────────────────────────────────
  const personasMap: Record<string, { persona: any; objetivos: any[] }> = {}
  datos.forEach(d => { const pid = d.persona?.id ?? 'sin'; if (!personasMap[pid]) personasMap[pid] = { persona: d.persona, objetivos: [] }; personasMap[pid].objetivos.push(d) })
  const grupos = Object.values(personasMap)

  const abiertos = periodos.filter(p => p.estado === 'abierto')
  const cerrados = periodos.filter(p => p.estado === 'cerrado')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1 text-sm">Exportá datos de performance y gestioná los ciclos de evaluación.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'reportes', label: 'Reporte general' },
          { key: 'periodos', label: 'Períodos de evaluación' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB REPORTES ── */}
      {tab === 'reportes' && (
        <div className="space-y-6">
          <div className="traza-card p-5 flex items-end gap-4 flex-wrap">
            {isSuperAdmin && (
              <div>
                <label className="traza-label">Empresa</label>
                <select className="traza-input w-48" value={filtroEmpresa} onChange={e => { setFiltroEmpresa(e.target.value); fetchReportes(e.target.value) }}>
                  <option value="todas">Todas</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="traza-label">Estado</label>
              <select className="traza-input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option>Pendiente</option>
                <option>En progreso</option>
                <option>Completado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportCSV} variant="secondary">CSV</Button>
              <Button onClick={exportExcel} variant="secondary">
                <FileSpreadsheet size={14} className="mr-1.5" /> Excel
              </Button>
              <Button onClick={exportPDF} variant="secondary">
                <FileText size={14} className="mr-1.5" /> PDF
              </Button>
            </div>
          </div>

          <div className="traza-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {grupos.length} colaborador{grupos.length !== 1 ? 'es' : ''} · {datos.length} objetivo{datos.length !== 1 ? 's' : ''}
              </h2>
              <button onClick={() => { const ids = grupos.map(g => g.persona?.id ?? 'sin'); const allOpen = ids.every(id => expanded.has(id)); setExpanded(allOpen ? new Set() : new Set(ids)) }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {grupos.every(g => expanded.has(g.persona?.id ?? 'sin')) ? 'Cerrar todo' : 'Expandir todo'}
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">Cargando...</div>
            ) : grupos.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No hay datos para mostrar.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {grupos.map(({ persona, objetivos: obs }) => {
                  const pid    = persona?.id ?? 'sin'
                  const isOpen = expanded.has(pid)
                  const comp   = obs.filter((o: any) => o.estado === 'Completado').length
                  return (
                    <div key={pid}>
                      <button onClick={() => togglePersona(pid)}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                        <span className="text-gray-300 flex-shrink-0">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                        <div className="w-9 h-9 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-traza-700 text-xs font-bold">{persona?.nombre?.[0]}{persona?.apellido?.[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar'}</p>
                          <p className="text-xs text-gray-400">{persona?.cargo ?? ''}{persona?.area ? ` · ${persona.area}` : ''}</p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-400">{comp}/{obs.length} completados</div>
                      </button>

                      {isOpen && (
                        <div className="bg-gray-50">
                          <div className="grid grid-cols-12 gap-2 px-16 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                            <div className="col-span-4">Objetivo</div><div className="col-span-2">Prioridad</div>
                            <div className="col-span-2">Estado</div><div className="col-span-2">Validación</div>
                            <div className="col-span-1">Vence</div><div className="col-span-1 text-center">Evidencia</div>
                          </div>
                          {obs.map((obj: any) => (
                            <div key={obj.id} className="grid grid-cols-12 gap-2 items-center px-16 py-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                              <div className="col-span-4"><p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>{obj.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{obj.descripcion}</p>}</div>
                              <div className="col-span-2"><span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getPrioridadClasses(obj.prioridad)}`}>{obj.prioridad}</span></div>
                              <div className="col-span-2"><span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getEstadoClasses(obj.estado)}`}>{obj.estado}</span></div>
                              <div className="col-span-2"><span className="text-xs px-2 py-0.5 rounded-md font-medium" style={getValidacionStyle(obj.validacion)}>{obj.validacion ?? 'Sin validar'}</span></div>
                              <div className="col-span-1 text-xs text-gray-400">{formatFecha(obj.fecha_limite)}</div>
                              <div className="col-span-1 flex justify-center">{obj.evidencia_url ? <a href={obj.evidencia_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-traza-700 hover:underline"><Paperclip size={12} strokeWidth={1.75} />Ver</a> : <span className="text-gray-300 text-xs">—</span>}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB PERÍODOS ── */}
      {tab === 'periodos' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={14} className="mr-1" /> Nuevo período
            </Button>
          </div>

          {showForm && (
            <div className="traza-card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Nuevo período de evaluación</h2>
              <form onSubmit={handleCrearPeriodo} className="space-y-4">
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
                  <Button type="submit" loading={savingPer}>Crear período</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {loadingPer ? <div className="text-gray-400 py-12 text-center">Cargando...</div> : (
            <>
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
                              {new Date(p.fecha_inicio+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long'})} → {new Date(p.fecha_fin+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})} · {p.tipo}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleCerrarPeriodo(p.id)} disabled={cerrando === p.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
                          <Lock size={12} />{cerrando === p.id ? 'Cerrando...' : 'Cerrar período'}
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
                  <p className="text-sm text-gray-400">No hay ningún período activo. Creá uno nuevo para empezar.</p>
                </div>
              )}

              {cerrados.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Historial</h2>
                  {cerrados.map(p => {
                    const isOpen = expandedPer.has(p.id)
                    const ress   = resumenes[p.id] ?? []
                    const prom   = ress.length > 0 ? Math.round(ress.reduce((s: number, r: any) => s + r.score, 0) / ress.length) : 0
                    return (
                      <div key={p.id} className="traza-card overflow-hidden">
                        <button onClick={() => togglePer(p.id)}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                          <span className="text-gray-300 flex-shrink-0">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                          <Lock size={13} className="text-gray-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(p.fecha_inicio+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long'})} → {new Date(p.fecha_fin+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})} · {p.tipo}
                            </p>
                          </div>
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="text-right"><p className="text-sm font-bold" style={{ color: scoreColor(prom) }}>{prom}</p><p className="text-xs text-gray-400">score prom.</p></div>
                            <div className="text-right"><p className="text-sm font-semibold text-gray-900">{ress.length}</p><p className="text-xs text-gray-400">colaboradores</p></div>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-100">
                            <div className="grid grid-cols-12 gap-2 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                              <div className="col-span-4">Colaborador</div><div className="col-span-2 text-center">Score</div>
                              <div className="col-span-2 text-center">Objetivos</div><div className="col-span-2 text-center">Completados</div>
                              <div className="col-span-2 text-center">Estado</div>
                            </div>
                            {ress.sort((a: any, b: any) => b.score - a.score).map((r: any) => {
                              const per = personasPer.find(p => p.id === r.persona_id)
                              return (
                                <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-6 py-3 border-b border-gray-50 last:border-0">
                                  <div className="col-span-4 flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-traza-700 text-[10px] font-bold">{per?.nombre?.[0]}{per?.apellido?.[0]}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{per ? `${per.nombre} ${per.apellido}` : 'Desconocido'}</p>
                                      <p className="text-xs text-gray-400 truncate">{per?.cargo}</p>
                                    </div>
                                  </div>
                                  <div className="col-span-2 text-center"><span className="text-base font-bold" style={{ color: scoreColor(r.score) }}>{r.score}</span></div>
                                  <div className="col-span-2 text-center text-sm text-gray-700">{r.total_objetivos}</div>
                                  <div className="col-span-2 text-center text-sm text-gray-700">{r.completados} <span className="text-xs text-gray-400">({r.cumplimiento}%)</span></div>
                                  <div className="col-span-2 flex justify-center"><span className={`text-xs px-2 py-0.5 rounded-md font-medium ${estadoBadge(r.estado_general)}`}>{r.estado_general}</span></div>
                                </div>
                              )
                            })}
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
                  <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-medium text-traza-700 hover:underline">Crear primer período →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
