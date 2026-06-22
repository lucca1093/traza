'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getValidacionStyle, formatFecha } from '@/lib/traza'
import { Paperclip } from 'lucide-react'

export default function ReportesPage() {
  const [datos, setDatos]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [empresas, setEmpresas] = useState<any[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from('objetivos')
      .select('*, persona:personas(nombre, apellido, cargo, area)')
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') query = query.eq('estado', filtroEstado)
    if (filtroEmpresa !== 'todas') query = query.eq('empresa_id', filtroEmpresa)

    const { data } = await query
    setDatos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      const { data: es } = await supabase.from('empresas').select('*').order('nombre')
      setEmpresas(es ?? [])
      await fetchData()
    }
    init()
  }, [])

  useEffect(() => { fetchData() }, [filtroEstado, filtroEmpresa])

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📄 Reportes</h1>
        <p className="text-gray-500 mt-1">Exportá información de desempeño para análisis externo.</p>
      </div>

      {/* Filtros */}
      <div className="traza-card p-5 flex items-end gap-4 flex-wrap">
        <div>
          <label className="traza-label">Empresa</label>
          <select className="traza-input w-48" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
            <option value="todas">Todas</option>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="traza-label">Estado</label>
          <select className="traza-input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos</option>
            <option>Pendiente</option>
            <option>En progreso</option>
            <option>Completado</option>
          </select>
        </div>
        <Button onClick={exportCSV} variant="secondary">⬇️ Exportar CSV</Button>
      </div>

      {/* Tabla */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Resultados ({datos.length})</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : datos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-2">📄</p>
            <p>No hay datos para mostrar con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Colaborador</th>
                  <th className="px-5 py-3 text-left">Objetivo</th>
                  <th className="px-5 py-3 text-left">Prioridad</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Validación</th>
                  <th className="px-5 py-3 text-left">Vence</th>
                  <th className="px-5 py-3 text-left">Evidencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {datos.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {d.persona ? `${d.persona.nombre} ${d.persona.apellido}` : '—'}
                      </p>
                      <p className="text-xs text-gray-400">{d.persona?.cargo ?? ''}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900 max-w-xs">
                      <p className="font-medium truncate">{d.titulo}</p>
                      {d.descripcion && <p className="text-xs text-gray-400 truncate">{d.descripcion}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.prioridad === 'Alta' ? 'bg-red-100 text-red-700' : d.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {d.prioridad}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(d.estado)}`}>{d.estado}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle(d.validacion)}>
                        {d.validacion ?? 'Sin validar'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{formatFecha(d.fecha_limite)}</td>
                    <td className="px-5 py-3">
                      {d.evidencia_url ? (
                        <a href={d.evidencia_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-traza-700 hover:underline">
                          <Paperclip size={12} strokeWidth={1.75} />
                          Ver
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
