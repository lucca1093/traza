'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/ui/MetricCard'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza, calcularIndiceAutonomo, calcularIndiceDual } from '@/lib/traza'
import { CheckCircle2, AlertTriangle, Trophy, ShieldAlert } from 'lucide-react'
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

    // Ranking por persona (con índice autónomo y dual)
    const rankingData = (personas ?? []).map((p: any) => {
      const obsPersona    = objs.filter(o => o.persona_id === p.id)
      const avPersona     = allAvances.filter((a: any) => a.persona_id === p.id)
      const indice        = calcularIndiceTraza(obsPersona)
      const autonomo      = calcularIndiceAutonomo(obsPersona, avPersona)
      const dual          = calcularIndiceDual(indice.score, autonomo)
      return { persona: p, indice, autonomo, dual }
    }).sort((a, b) => b.dual.dual - a.dual.dual)

    // Índice organizacional (usa score dual)
    const indiceOrg = rankingData.length > 0
      ? Math.round(rankingData.reduce((sum, r) => sum + r.dual.dual, 0) / rankingData.length * 10) / 10
      : 0

    const enRiesgo    = rankingData.filter(r => r.dual.dual < 40).length
    const alertasSesgo = rankingData.filter(r => r.dual.alertaSesgo)

    // Avances registrados (con datos para calcular índice autónomo)
    let avQuery = supabase.from('objetivo_avances').select('*')
    if (empresaId !== 'todas') avQuery = avQuery.eq('empresa_id', empresaId)
    const { data: avancesData } = await avQuery
    const allAvances = avancesData ?? []
    const totalAvances = allAvances.length

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

    // ── Evolución trimestral ──────────────────────────────────
    // Agrupa objetivos completados por trimestre de su fecha_limite
    const trimMap: Record<string, { completados: number; positivos: number; total: number }> = {}
    objs.filter(o => o.fecha_limite).forEach(o => {
      const d = new Date(o.fecha_limite!)
      const q = Math.ceil((d.getMonth() + 1) / 3)
      const key = `${d.getFullYear()}-Q${q}`
      if (!trimMap[key]) trimMap[key] = { completados: 0, positivos: 0, total: 0 }
      trimMap[key].total++
      if (o.estado === 'Completado') trimMap[key].completados++
      if (o.validacion === 'De acuerdo') trimMap[key].positivos++
    })
    const evolucion = Object.entries(trimMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        trimestre: key,
        cumplimiento: v.total > 0 ? Math.round(v.completados / v.total * 100) : 0,
        calidad: v.completados > 0 ? Math.round(v.positivos / v.completados * 100) : 0,
        total: v.total,
      }))

    // ── Gap de discrepancia (equipo) ──────────────────────────
    const supScore:  Record<string, number> = { 'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0 }
    const autoScore: Record<string, number> = { 'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0 }
    const conAmbas = objs.filter(o => o.validacion && (o as any).autoevaluacion)
    const discAlta   = conAmbas.filter(o => Math.abs((supScore[o.validacion!] ?? 1) - (autoScore[(o as any).autoevaluacion] ?? 1)) === 2).length
    const discMedia  = conAmbas.filter(o => Math.abs((supScore[o.validacion!] ?? 1) - (autoScore[(o as any).autoevaluacion] ?? 1)) === 1).length
    const discNula   = conAmbas.filter(o => Math.abs((supScore[o.validacion!] ?? 1) - (autoScore[(o as any).autoevaluacion] ?? 1)) === 0).length

    // ── Distribución por categoría ────────────────────────────
    const cats = ['Resultado', 'Eficiencia', 'Aprendizaje', 'Hábito']
    const porCategoria = cats.map(cat => ({
      categoria: cat,
      total: objs.filter(o => (o as any).categoria === cat).length,
      completados: objs.filter(o => (o as any).categoria === cat && o.estado === 'Completado').length,
    }))

    setStats({
      total, completados, pendientes, enProgreso, positivos, negativos, cumplimiento,
      indiceOrg, enRiesgo, totalPersonas: (personas ?? []).length,
      totalAvances, areas, sinValidar,
      evolucion, discAlta, discMedia, discNula, totalConAmbas: conAmbas.length, porCategoria,
      alertasSesgo,
    })
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
          {ranking.map((item, i) => {
            const dualScore  = item.dual?.dual ?? item.indice.score
            const scoreColor = dualScore >= 85 ? '#16a34a' : dualScore >= 65 ? '#0F4C81' : dualScore >= 40 ? '#d97706' : '#9ca3af'
            const hasSesgo   = item.dual?.alertaSesgo
            return (
              <div key={item.persona.id} className={`px-6 py-4 flex items-center gap-4 ${hasSesgo ? 'bg-amber-50' : ''}`}>
                <span className="text-sm font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-traza-700 text-xs font-bold">
                    {item.persona.nombre[0]}{item.persona.apellido[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{item.persona.nombre} {item.persona.apellido}</p>
                    {hasSesgo && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        <ShieldAlert size={11} /> Posible sesgo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{item.persona.cargo ?? ''}{item.persona.area ? ` · ${item.persona.area}` : ''}</p>
                  {/* Doble índice mini */}
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">
                      Validado: <span className="font-semibold text-gray-600">{item.dual?.validado ?? item.indice.score}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Autónomo: <span className="font-semibold text-gray-600">{item.autonomo?.score ?? '-'}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Consistencia: <span className="font-semibold text-gray-600">{item.autonomo?.consistencia ?? '-'}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Evidencia: <span className="font-semibold text-gray-600">{item.autonomo?.densidadEvidencia ?? '-'}%</span>
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold" style={{ color: scoreColor }}>{dualScore}</p>
                  <p className="text-xs text-gray-400">/100 dual · {item.indice.badge}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alertas de sesgo */}
      {stats.alertasSesgo?.length > 0 && (
        <div className="traza-card p-6 border border-amber-200" style={{ backgroundColor: '#fffbeb' }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={18} className="text-amber-500" />
            <h2 className="font-semibold text-amber-800">Alertas de posible sesgo del supervisor</h2>
          </div>
          <p className="text-xs text-amber-600 mb-4">
            Las siguientes personas tienen un Índice Autónomo significativamente mayor que su Índice Validado.
            Esto puede indicar que el supervisor no está reconociendo adecuadamente su trabajo.
          </p>
          <div className="space-y-3">
            {stats.alertasSesgo.map((item: any) => (
              <div key={item.persona.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.persona.nombre} {item.persona.apellido}</p>
                  <p className="text-xs text-gray-500">{item.persona.cargo ?? ''}{item.persona.area ? ` · ${item.persona.area}` : ''}</p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Validado</p>
                    <p className="font-bold text-gray-700">{item.dual.validado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Autónomo</p>
                    <p className="font-bold text-amber-600">{item.dual.autonomo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Diferencia</p>
                    <p className="font-bold text-red-500">+{item.dual.autonomo - item.dual.validado}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolución trimestral */}
      {stats.evolucion?.length > 0 && (
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Evolución trimestral</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left pb-3">Trimestre</th>
                  <th className="text-right pb-3">Objetivos</th>
                  <th className="text-right pb-3">Cumplimiento</th>
                  <th className="text-right pb-3">Calidad validación</th>
                  <th className="pb-3 w-40"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.evolucion.map((t: any) => (
                  <tr key={t.trimestre}>
                    <td className="py-3 font-medium text-gray-900">{t.trimestre}</td>
                    <td className="py-3 text-right text-gray-500">{t.total}</td>
                    <td className="py-3 text-right font-semibold" style={{ color: t.cumplimiento >= 70 ? '#16a34a' : t.cumplimiento >= 40 ? '#d97706' : '#dc2626' }}>
                      {t.cumplimiento}%
                    </td>
                    <td className="py-3 text-right font-semibold" style={{ color: t.calidad >= 70 ? '#1d4ed8' : '#9ca3af' }}>
                      {t.calidad}%
                    </td>
                    <td className="py-3 pl-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-traza-500" style={{ width: `${t.cumplimiento}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribución por categoría + Gap de discrepancia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoría */}
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Objetivos por categoría</h2>
          <div className="space-y-3">
            {(stats.porCategoria ?? []).filter((c: any) => c.total > 0).map((c: any) => {
              const catColors: Record<string, { bg: string; color: string }> = {
                Resultado:   { bg: '#dbeafe', color: '#1d4ed8' },
                Eficiencia:  { bg: '#d1fae5', color: '#065f46' },
                Aprendizaje: { bg: '#ede9fe', color: '#5b21b6' },
                Hábito:      { bg: '#fef3c7', color: '#92400e' },
              }
              const cs = catColors[c.categoria] ?? { bg: '#f3f4f6', color: '#6b7280' }
              const pct = c.total > 0 ? Math.round(c.completados / c.total * 100) : 0
              return (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cs.bg, color: cs.color }}>{c.categoria}</span>
                    <span className="text-xs text-gray-500">{c.completados}/{c.total} · <span className="font-semibold text-gray-900">{pct}%</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cs.color }} />
                  </div>
                </div>
              )
            })}
            {(stats.porCategoria ?? []).every((c: any) => c.total === 0) && (
              <p className="text-xs text-gray-400 italic">Sin datos de categorías todavía.</p>
            )}
          </div>
        </div>

        {/* Gap de discrepancia */}
        <div className="traza-card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Gap de discrepancia</h2>
          <p className="text-xs text-gray-400 mb-4">Diferencia entre autoevaluación del colaborador y validación del supervisor.</p>
          {stats.totalConAmbas === 0 ? (
            <p className="text-xs text-gray-400 italic">Aún no hay objetivos con ambas evaluaciones.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Alineados', val: stats.discNula, color: '#16a34a', sub: 'Coinciden exactamente' },
                { label: 'Diferencia leve', val: stats.discMedia, color: '#d97706', sub: '1 punto de diferencia' },
                { label: 'Diferencia alta', val: stats.discAlta, color: '#dc2626', sub: '2 puntos de diferencia' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{item.sub}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.val} <span className="font-normal text-gray-400 text-xs">({Math.round(item.val / stats.totalConAmbas * 100)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.val / stats.totalConAmbas * 100)}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">Sobre {stats.totalConAmbas} objetivo{stats.totalConAmbas > 1 ? 's' : ''} con ambas evaluaciones.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
