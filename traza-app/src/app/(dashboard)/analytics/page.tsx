'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/ui/MetricCard'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza } from '@/lib/traza'
import { CheckCircle2, AlertTriangle, Trophy } from 'lucide-react'
import type { Objetivo, Persona } from '@/types'

export default function AnalyticsPage() {
  const [loading, setLoading]     = useState(true)
  const [empresas, setEmpresas]   = useState<any[]>([])
  const [filtroEmpresa, setFiltro] = useState('todas')
  const [stats, setStats]         = useState<any>(null)
  const [ranking, setRanking]     = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: es } = await supabase.from('empresas').select('*').order('nombre')
      setEmpresas(es ?? [])
      await calcularStats('todas')
      setLoading(false)
    }
    load()
  }, [])

  async function calcularStats(empresaId: string) {
    setLoading(true)

    // Objetivos
    let obsQuery = supabase.from('objetivos').select('*')
    if (empresaId !== 'todas') obsQuery = obsQuery.eq('empresa_id', empresaId)
    const { data: objetivos } = await obsQuery

    // Personas
    let persQuery = supabase.from('personas').select('*')
    if (empresaId !== 'todas') persQuery = persQuery.eq('empresa_id', empresaId)
    const { data: personas } = await persQuery

    const objs = (objetivos ?? []) as Objetivo[]
    const total        = objs.length
    const completados  = objs.filter(o => o.estado === 'Completado').length
    const pendientes   = objs.filter(o => o.estado === 'Pendiente').length
    const enProgreso   = objs.filter(o => o.estado === 'En progreso').length
    const positivos    = objs.filter(o => o.validacion === 'De acuerdo').length
    const negativos    = objs.filter(o => o.validacion === 'En desacuerdo').length
    const cumplimiento = total > 0 ? Math.round(completados / total * 100) : 0

    // Ranking por persona
    const rankingData = (personas ?? []).map((p: any) => {
      const obsPersona = objs.filter(o => o.persona_id === p.id)
      const indice = calcularIndiceTraza(obsPersona)
      return { persona: p, indice }
    }).sort((a, b) => b.indice.score - a.indice.score)

    // Índice organizacional
    const indiceOrg = rankingData.length > 0
      ? Math.round(rankingData.reduce((sum, r) => sum + r.indice.score, 0) / rankingData.length * 10) / 10
      : 0

    const enRiesgo = rankingData.filter(r => r.indice.score < 40).length

    // Avances registrados
    let avQuery = supabase.from('objetivo_avances').select('*', { count: 'exact', head: true })
    if (empresaId !== 'todas') avQuery = avQuery.eq('empresa_id', empresaId)
    const { count: totalAvances } = await avQuery

    // Por área
    const areas: Record<string, { total: number; completados: number }> = {}
    ;(personas ?? []).forEach((p: any) => {
      const area = p.area || 'Sin área'
      if (!areas[area]) areas[area] = { total: 0, completados: 0 }
      const obsP = objs.filter(o => o.persona_id === p.id)
      areas[area].total      += obsP.length
      areas[area].completados += obsP.filter(o => o.estado === 'Completado').length
    })

    // Sin validar (completados sin validación)
    const sinValidar = objs.filter(o => o.estado === 'Completado' && !o.validacion).length

    setStats({ total, completados, pendientes, enProgreso, positivos, negativos, cumplimiento, indiceOrg, enRiesgo, totalPersonas: (personas ?? []).length, totalAvances: totalAvances ?? 0, areas, sinValidar })
    setRanking(rankingData)
    setLoading(false)
  }

  function handleFiltro(val: string) {
    setFiltro(val)
    calcularStats(val)
  }

  if (!stats) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const topPerformer = ranking[0]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Indicadores consolidados de desempeño organizacional.</p>
        </div>
        <div>
          <select
            className="traza-input w-auto"
            value={filtroEmpresa}
            onChange={e => handleFiltro(e.target.value)}
          >
            <option value="todas">Todas las empresas</option>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard icon="Target"      label="Objetivos"    value={stats.total} />
        <MetricCard icon="CheckSquare" label="Completados"  value={stats.completados} />
        <MetricCard icon="TrendingUp"  label="Cumplimiento" value={`${stats.cumplimiento}%`} />
        <MetricCard icon="Users"       label="Personas"     value={stats.totalPersonas} />
        <MetricCard icon="FileText"    label="Avances reg." value={stats.totalAvances} />
        <MetricCard icon="Building2"   label="Índice Org."  value={`${stats.indiceOrg}/100`} highlight />
      </div>

      {/* Top performer + Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performer */}
        <div className="traza-card p-6 rounded-2xl" style={{ backgroundColor: '#0F4C81' }}>
          <p className="text-xs font-semibold uppercase mb-3" style={{ color: '#85AADF' }}>Top Performer</p>
          {topPerformer ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={18} strokeWidth={1.75} style={{ color: '#fde68a' }} />
                <p className="text-xl font-bold" style={{ color: '#ffffff' }}>
                  {topPerformer.persona.nombre} {topPerformer.persona.apellido}
                </p>
              </div>
              <p className="text-sm mb-4" style={{ color: '#AEC8EA' }}>
                {topPerformer.persona.cargo ?? ''}{topPerformer.persona.area ? ` · ${topPerformer.persona.area}` : ''}
              </p>
              <p className="text-5xl font-bold" style={{ color: '#ffffff' }}>
                {topPerformer.indice.score}
                <span className="text-2xl font-normal" style={{ color: '#85AADF' }}>/100</span>
              </p>
              <p className="text-sm mt-1" style={{ color: '#85AADF' }}>
                {topPerformer.indice.badge} · {topPerformer.indice.cumplimiento}% cumplimiento
              </p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: '#85AADF' }}>Sin datos suficientes todavía.</p>
          )}
        </div>

        {/* Estado de objetivos */}
        <div className="traza-card p-6">
          <p className="font-semibold text-gray-900 mb-4">Estado de objetivos</p>
          <div className="space-y-3">
            {[
              { label: 'Completados', val: stats.completados, color: '#22c55e' },
              { label: 'En progreso', val: stats.enProgreso,  color: '#facc15' },
              { label: 'Pendientes',  val: stats.pendientes,  color: '#f87171' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">
                    {item.val} <span className="text-gray-400 font-normal">
                      ({stats.total > 0 ? Math.round(item.val / stats.total * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: stats.total > 0 ? `${(item.val / stats.total) * 100}%` : '0%',
                    backgroundColor: item.color
                  }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <CheckCircle2 size={13} className="text-green-500" strokeWidth={1.75} />
                Validaciones positivas
              </span>
              <span className="font-semibold text-gray-700">{stats.positivos}</span>
            </div>
            {stats.sinValidar > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <AlertTriangle size={13} className="text-amber-400" strokeWidth={1.75} />
                  Completados sin validar
                </span>
                <span className="font-semibold text-amber-600">{stats.sinValidar}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Por área */}
      {Object.keys(stats.areas).length > 0 && (
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Cumplimiento por área</h2>
          <div className="space-y-3">
            {Object.entries(stats.areas as Record<string, { total: number; completados: number }>)
              .sort((a, b) => b[1].completados / (b[1].total || 1) - a[1].completados / (a[1].total || 1))
              .map(([area, data]) => {
                const pct = data.total > 0 ? Math.round(data.completados / data.total * 100) : 0
                return (
                  <div key={area}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{area}</span>
                      <span className="text-gray-500">{data.completados}/{data.total} · <span className="font-semibold text-gray-900">{pct}%</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-traza-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ranking Traza</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {ranking.length === 0 && (
            <p className="text-gray-400 text-center py-12">No hay datos todavía.</p>
          )}
          {ranking.map((item, i) => (
            <div key={item.persona.id} className="px-6 py-4 flex items-center gap-4">
              <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {item.persona.nombre} {item.persona.apellido}
                </p>
                <p className="text-xs text-gray-500">{item.persona.cargo ?? ''} {item.persona.area ? `· ${item.persona.area}` : ''}</p>
                <div className="mt-2 max-w-xs">
                  <TraceIndexBar indice={item.indice} showDetails={false} size="sm" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-traza-700">{item.indice.score}</p>
                <p className="text-xs text-gray-400">/100</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
