'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, getValidacionStyle, formatFecha, calcularIndiceTraza } from '@/lib/traza'
import { ChevronDown, ChevronRight, Paperclip, FileSpreadsheet, FileText } from 'lucide-react'

export default function ReportesPage() {
  const [datos, setDatos]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado]     = useState('todos')
  const [empresas, setEmpresas]             = useState<any[]>([])
  const [filtroEmpresa, setFiltroEmpresa]   = useState('todas')
  const [expanded, setExpanded]             = useState<Set<string>>(new Set())
  const [isSuperAdmin, setIsSuperAdmin]     = useState(false)

  async function fetchData(empresaId = filtroEmpresa) {
    setLoading(true)
    let query = supabase
      .from('objetivos')
      .select('*, persona:personas(id, nombre, apellido, cargo, area)')
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') query = query.eq('estado', filtroEstado)
    if (empresaId !== 'todas') query = query.eq('empresa_id', empresaId)

    const { data } = await query
    setDatos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('rol, empresa_id').eq('id', user!.id).single()

      const superAdmin = p?.rol === 'super_admin'
      setIsSuperAdmin(superAdmin)

      if (superAdmin) {
        const { data: es } = await supabase.from('empresas').select('*').order('nombre')
        setEmpresas(es ?? [])
        await fetchData('todas')
      } else if (p?.empresa_id) {
        setFiltroEmpresa(p.empresa_id)
        await fetchData(p.empresa_id)
      }
    }
    init()
  }, [])

  useEffect(() => { fetchData() }, [filtroEstado, filtroEmpresa])

  function togglePersona(personaId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(personaId) ? next.delete(personaId) : next.add(personaId)
      return next
    })
  }

  function exportCSV() {
    const headers = ['Colaborador', 'Cargo', 'Área', 'Objetivo', 'Descripción', 'Prioridad', 'Fecha límite', 'Estado', 'Validación', 'Comentario supervisor', 'Evidencia']
    const rows = datos.map(d => [
      d.persona ? `${d.persona.nombre} ${d.persona.apellido}` : '',
      d.persona?.cargo ?? '',
      d.persona?.area ?? '',
      d.titulo,
      d.descripcion ?? '',
      d.prioridad,
      d.fecha_limite ?? '',
      d.estado,
      d.validacion ?? '',
      d.comentario_supervisor ?? '',
      d.evidencia_url ?? '',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_traza_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const fecha = new Date().toISOString().split('T')[0]
    const wb = XLSX.utils.book_new()

    // Hoja 1: Detalle por objetivo
    const headersDetalle = ['Colaborador', 'Cargo', 'Área', 'Objetivo', 'Descripción', 'Prioridad', 'Fecha límite', 'Estado', 'Validación', 'Comentario supervisor']
    const rowsDetalle = datos.map(d => [
      d.persona ? `${d.persona.nombre} ${d.persona.apellido}` : '',
      d.persona?.cargo ?? '',
      d.persona?.area ?? '',
      d.titulo,
      d.descripcion ?? '',
      d.prioridad,
      d.fecha_limite ? formatFecha(d.fecha_limite) : '',
      d.estado,
      d.validacion ?? '',
      d.comentario_supervisor ?? '',
    ])
    const wsDetalle = XLSX.utils.aoa_to_sheet([headersDetalle, ...rowsDetalle])
    wsDetalle['!cols'] = [20, 18, 15, 30, 35, 10, 12, 14, 20, 35].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle')

    // Hoja 2: Resumen por persona con score
    const headerResumen = ['Colaborador', 'Cargo', 'Área', 'Total objetivos', 'Completados', 'Cumplimiento %', 'Índice Traza', 'Validados', 'Parciales', 'Rechazados']
    const rowsResumen = grupos.map(({ persona, objetivos: obs }) => {
      const indice = calcularIndiceTraza(obs)
      return [
        persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar',
        persona?.cargo ?? '',
        persona?.area ?? '',
        indice.total,
        indice.completados,
        `${indice.cumplimiento}%`,
        indice.score,
        indice.positivos,
        indice.parciales,
        indice.negativos,
      ]
    })
    const wsResumen = XLSX.utils.aoa_to_sheet([headerResumen, ...rowsResumen])
    wsResumen['!cols'] = [22, 18, 15, 14, 12, 13, 12, 10, 10, 12].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por persona')

    XLSX.writeFile(wb, `reporte_traza_${fecha}.xlsx`)
  }

  function exportPDF() {
    const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = grupos.map(({ persona, objetivos: obs }) => {
      const indice = calcularIndiceTraza(obs)
      const nombre = persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar'
      const obsRows = obs.map((o: any) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;">${o.titulo}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">${o.prioridad}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">${o.estado}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">${o.validacion ?? '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:11px;color:#666;">${o.comentario_supervisor ?? '—'}</td>
        </tr>
      `).join('')
      return `
        <div style="margin-bottom:32px;break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;background:#0F4C81;color:white;padding:10px 14px;border-radius:8px 8px 0 0;">
            <div>
              <strong style="font-size:14px;">${nombre}</strong>
              <span style="font-size:12px;margin-left:10px;opacity:0.8;">${persona?.cargo ?? ''}${persona?.area ? ` · ${persona.area}` : ''}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:20px;font-weight:bold;">${indice.score}</span>
              <span style="font-size:11px;opacity:0.8;">/100</span>
              <div style="font-size:11px;opacity:0.7;">${indice.completados}/${indice.total} completados</div>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:7px 10px;text-align:left;font-weight:600;color:#555;">Objetivo</th>
                <th style="padding:7px 10px;text-align:center;font-weight:600;color:#555;">Prioridad</th>
                <th style="padding:7px 10px;text-align:center;font-weight:600;color:#555;">Estado</th>
                <th style="padding:7px 10px;text-align:center;font-weight:600;color:#555;">Validación</th>
                <th style="padding:7px 10px;text-align:left;font-weight:600;color:#555;">Comentario</th>
              </tr>
            </thead>
            <tbody>${obsRows}</tbody>
          </table>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Reporte Traza — ${fecha}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, Arial, sans-serif; color:#1a1a1a; padding:40px; }
        @media print { body { padding:20px; } }
      </style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #0F4C81;">
        <div>
          <div style="font-size:22px;font-weight:800;color:#0F4C81;letter-spacing:-0.5px;">TRAZA</div>
          <div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-top:4px;">Reporte de Performance</div>
        </div>
        <div style="text-align:right;font-size:12px;color:#666;">
          <div>${fecha}</div>
          <div>${datos.length} objetivo${datos.length !== 1 ? 's' : ''} · ${grupos.length} colaborador${grupos.length !== 1 ? 'es' : ''}</div>
        </div>
      </div>
      ${rows}
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 400)
  }

  // Agrupar por persona
  const personasMap: Record<string, { persona: any; objetivos: any[] }> = {}
  datos.forEach(d => {
    const pid = d.persona?.id ?? 'sin-persona'
    if (!personasMap[pid]) personasMap[pid] = { persona: d.persona, objetivos: [] }
    personasMap[pid].objetivos.push(d)
  })
  const grupos = Object.values(personasMap)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Exportá información de desempeño para análisis externo.</p>
      </div>

      {/* Filtros */}
      <div className="traza-card p-5 flex items-end gap-4 flex-wrap">
        {isSuperAdmin && (
          <div>
            <label className="traza-label">Empresa</label>
            <select className="traza-input w-48" value={filtroEmpresa} onChange={e => { setFiltroEmpresa(e.target.value); fetchData(e.target.value) }}>
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

      {/* Tabla agrupada */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {grupos.length} colaborador{grupos.length !== 1 ? 'es' : ''} · {datos.length} objetivo{datos.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={() => {
              const allIds = grupos.map(g => g.persona?.id ?? 'sin-persona')
              const allOpen = allIds.every(id => expanded.has(id))
              setExpanded(allOpen ? new Set() : new Set(allIds))
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {grupos.every(g => expanded.has(g.persona?.id ?? 'sin-persona')) ? 'Cerrar todo' : 'Expandir todo'}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : grupos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay datos para mostrar.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {grupos.map(({ persona, objetivos: obs }) => {
              const pid = persona?.id ?? 'sin-persona'
              const isOpen = expanded.has(pid)
              const completados = obs.filter((o: any) => o.estado === 'Completado').length

              return (
                <div key={pid}>
                  {/* Fila persona */}
                  <button
                    onClick={() => togglePersona(pid)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-gray-300 flex-shrink-0">
                      {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-traza-700 text-xs font-bold">
                        {persona?.nombre?.[0]}{persona?.apellido?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {persona?.cargo ?? ''}{persona?.area ? ` · ${persona.area}` : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-400">
                      {completados}/{obs.length} completados
                    </div>
                  </button>

                  {/* Objetivos expandidos */}
                  {isOpen && (
                    <div className="bg-gray-50">
                      {/* Header columnas */}
                      <div className="grid grid-cols-12 gap-2 px-16 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <div className="col-span-4">Objetivo</div>
                        <div className="col-span-2">Prioridad</div>
                        <div className="col-span-2">Estado</div>
                        <div className="col-span-2">Validación</div>
                        <div className="col-span-1">Vence</div>
                        <div className="col-span-1 text-center">Evidencia</div>
                      </div>
                      {obs.map((obj: any) => (
                        <div
                          key={obj.id}
                          className="grid grid-cols-12 gap-2 items-center px-16 py-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors"
                        >
                          <div className="col-span-4">
                            <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
                            {obj.descripcion && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{obj.descripcion}</p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getPrioridadClasses(obj.prioridad)}`}>
                              {obj.prioridad}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getEstadoClasses(obj.estado)}`}>
                              {obj.estado}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={getValidacionStyle(obj.validacion)}>
                              {obj.validacion ?? 'Sin validar'}
                            </span>
                          </div>
                          <div className="col-span-1 text-xs text-gray-400">
                            {formatFecha(obj.fecha_limite)}
                          </div>
                          <div className="col-span-1 flex justify-center">
                            {obj.evidencia_url ? (
                              <a href={obj.evidencia_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-traza-700 hover:underline">
                                <Paperclip size={12} strokeWidth={1.75} />
                                Ver
                              </a>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
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
  )
}
