'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/ui/MetricCard'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza } from '@/lib/traza'
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
    let persQuery = supabase.from('personas').select('*, objetivos(*)')
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

    setStats({ total, completados, pendientes, enProgreso, positivos, negativos, cumplimiento, indiceOrg, enRiesgo, totalPersonas: (personas ?? []).length })
    setRanking(rankingData)
    setLoading(false)
  }

  function handleFiltro(val: string) {
    setFiltro(val)
    calcularStats(val)
  }

  if (!stats) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const topPerformer = ranking[0]
  const MEDALLAS = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📈 Analytics</h1>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon="🎯" label="Objetivos" value={stats.total} />
        <MetricCard icon="✅" label="Completados" value={stats.completados} />
        <MetricCard icon="📈" label="Cumplimiento" value={`${stats.cumplimiento}%`} />
        <MetricCard icon="👥" label="Personas" value={stats.totalPersonas} />
        <MetricCard icon="🏢" label="Índice Org." value={`${stats.indiceOrg}/100`} highlight />
      </div>

      {/* Dashboard ejecutivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top performer */}
        {topPerformer && (
          <div className="traza-card p-6 bg-traza-700 border-traza-700">
            <p className="text-traza-300 text-xs font-semibold uppercase mb-3">Top Performer</p>
            <p className="text-white text-xl font-bold">
              🏆 {topPerformer.persona.nombre} {topPerformer.persona.apellido}
            </p>
            <p className="text-traza-200 text-sm mt-1">{topPerformer.persona.cargo ?? ''}</p>
            <p className="text-white text-3xl font-bold mt-4">
              {topPerformer.indice.score}<span className="text-traza-300 text-lg">/100</span>
            </p>
            <p className="text-traza-300 text-sm mt-1">Índice Traza</p>
          </div>
        )}

        {/* Estado de objetivos */}
        <div className="traza-card p-6">
          <p className="font-semibold text-gray-900 mb-4">Estado de objetivos</p>
          <div className="space-y-3">
            {[
              { label: 'Completados', val: stats.completados, color: 'bg-green-500' },
              { label: 'En progreso', val: stats.enProgreso,  color: 'bg-yellow-400' },
              { label: 'Pendientes',  val: stats.pendientes,  color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">{item.val}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: stats.total > 0 ? `${(item.val / stats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validaciones */}
        <div className="traza-card p-6">
          <p className="font-semibold text-gray-900 mb-4">Alertas</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">⭐ Validaciones positivas</span>
              <span className="font-bold text-green-600">{stats.positivos}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">❌ Validaciones negativas</span>
              <span className="font-bold text-red-500">{stats.negativos}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">⚠️ Personas en riesgo (&lt;40)</span>
              <span className="font-bold text-orange-500">{stats.enRiesgo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">🏆 Ranking Traza</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {ranking.length === 0 && (
            <p className="text-gray-400 text-center py-12">No hay datos todavía.</p>
          )}
          {ranking.map((item, i) => (
            <div key={item.persona.id} className="px-6 py-4 flex items-center gap-4">
              <span className="text-xl w-8 text-center">{MEDALLAS[i] ?? '🏅'}</span>
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

      {/* Personas en riesgo */}
      {ranking.filter(r => r.indice.score < 40).length > 0 && (
        <div className="traza-card overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50">
            <h2 className="font-semibold text-red-700">⚠️ Personas que requieren seguimiento</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {ranking.filter(r => r.indice.score < 40).map(item => (
              <div key={item.persona.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.persona.nombre} {item.persona.apellido}</p>
                  <p className="text-xs text-gray-500">{item.persona.cargo ?? ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-500">{item.indice.score}/100</p>
                  <p className="text-xs text-gray-400">Índice Traza</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
