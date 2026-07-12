'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/ui/MetricCard'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza } from '@/lib/traza'
import { CheckCircle2, AlertTriangle, Trophy, Sparkles, X } from 'lucide-react'
import type { Objetivo, Persona } from '@/types'

export default function AnalyticsPage() {
  const [loading, setLoading]     = useState(true)
  const [empresas, setEmpresas]   = useState<any[]>([])
  const [filtroEmpresa, setFiltro] = useState('todas')
  const [stats, setStats]         = useState<any>(null)
  const [ranking, setRanking]     = useState<any[]>([])
  const [openInfo, setOpenInfo]   = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin]   = useState(false)
  const [miEmpresaId, setMiEmpresaId]     = useState<string | null>(null)
  const [evalSupervisor, setEvalSupervisor] = useState<any[]>([])
  const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null)
  const [analisisIA, setAnalisisIA]   = useState<string | null>(null)
  const [loadingIA, setLoadingIA]     = useState(false)

  function InfoBtn({ id, children }: { id: string; children: React.ReactNode }) {
    const open = openInfo === id
    return (
      <div className="relative">
        <button
          onClick={() => setOpenInfo(open ? null : id)}
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
          style={{ backgroundColor: open ? '#3350D0' : '#e5e7eb', color: open ? 'white' : '#9ca3af' }}
        >
          i
        </button>
        {open && (
          <div
            className="absolute right-0 top-7 z-20 w-72 rounded-xl bg-white border border-gray-100 p-4"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
          >
            <div className="text-xs text-gray-600 leading-relaxed space-y-2.5">{children}</div>
            <button
              onClick={() => setOpenInfo(null)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    async function load() {
      // Detectar rol del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('rol, empresa_id')
        .eq('id', user.id)
        .single()

      const superAdmin = profile?.rol === 'super_admin'
      setIsSuperAdmin(superAdmin)

      if (superAdmin) {
        const { data: es } = await supabase.from('empresas').select('*').order('nombre')
        setEmpresas(es ?? [])
        await calcularStats('todas')
      } else {
        // Admin normal: forzar su propia empresa
        const empId = profile?.empresa_id ?? null
        setMiEmpresaId(empId)
        setEmpresaActivaId(empId)
        if (empId) {
          setFiltro(empId)
          await calcularStats(empId)
          // Cargar evaluaciones de supervisor de esta empresa
          const res = await fetch(`/api/evaluar-supervisor?empresaId=${empId}`)
          const evData = await res.json()
          setEvalSupervisor(evData.evaluaciones ?? [])
        }
      }
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

    // Personas — solo empleo activo para evitar duplicados por historial multi-empresa
    let persQuery = supabase.from('personas').select('*').eq('empleo_activo', true)
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

    // Avances PRIMERO — necesarios para el índice autónomo y dual
    const objIds = objs.map(o => o.id)
    let avancesData: any[] = []
    if (objIds.length > 0) {
      const { data: av } = await supabase
        .from('objetivo_avances')
        .select('*')
        .in('objetivo_id', objIds)
      avancesData = av ?? []
    }
    const allAvances = avancesData
    const totalAvances = allAvances.length

    // Ranking por persona
    const rankingData = (personas ?? []).map((p: any) => {
      const obsPersona    = objs.filter(o => o.persona_id === p.id)
      const objIdsPersona = obsPersona.map(o => o.id)
      const avPersona     = allAvances.filter((a: any) => objIdsPersona.includes(a.objetivo_id))
      const indice        = calcularIndiceTraza(obsPersona, avPersona)
      return { persona: p, indice }
    }).sort((a, b) => b.indice.score - a.indice.score)

    // Índice organizacional
    const indiceOrg = rankingData.length > 0
      ? Math.round(rankingData.reduce((sum, r) => sum + r.indice.score, 0) / rankingData.length * 10) / 10
      : 0

    const enRiesgo     = rankingData.filter(r => r.indice.score < 40).length
    const alertasSesgo: any[] = []

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

  async function handleFiltro(val: string) {
    setFiltro(val)
    calcularStats(val)
    setEmpresaActivaId(val === 'todas' ? null : val)
    if (val !== 'todas') {
      const res = await fetch(`/api/evaluar-supervisor?empresaId=${val}`)
      const evData = await res.json()
      setEvalSupervisor(evData.evaluaciones ?? [])
    } else {
      setEvalSupervisor([])
    }
  }

  async function handleAnalisisIA() {
    if (!stats) return
    setLoadingIA(true)
    setAnalisisIA(null)
    try {
      const res = await fetch('/api/analisis-equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, ranking }),
      })
      const data = await res.json()
      setAnalisisIA(data.analisis ?? data.error ?? 'Sin respuesta')
    } catch {
      setAnalisisIA('Error al conectar con el servicio de IA.')
    }
    setLoadingIA(false)
  }

  if (!stats) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const topPerformer = ranking[0]

  return (
    <div className="space-y-8">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Analytics</h1>
          <p className="traza-page-sub">Indicadores consolidados de desempeño organizacional.</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <select
              className="traza-input w-auto"
              value={filtroEmpresa}
              onChange={e => handleFiltro(e.target.value)}
            >
              <option value="todas">Todas las empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          )}
          <button
            onClick={handleAnalisisIA}
            disabled={loadingIA}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: '#3350D0', color: 'white' }}
          >
            <Sparkles size={14} />
            {loadingIA ? 'Analizando...' : 'Analizar con IA'}
          </button>
        </div>
      </div>

      {/* Panel análisis IA */}
      {analisisIA && (
        <div className="rounded-2xl border p-5 relative" style={{ backgroundColor: '#EDEFFD', borderColor: '#BBC5F7' }}>
          <button
            onClick={() => setAnalisisIA(null)}
            className="absolute top-3 right-3 transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} style={{ color: '#3350D0' }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#1C2B90' }}>Análisis IA del equipo</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{analisisIA}</p>
        </div>
      )}

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
        <div className="traza-card p-6 rounded-2xl" style={{ backgroundColor: '#3350D0' }}>
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
              <div className="flex gap-4 mt-3">
                <span className="text-xs" style={{ color: '#85AADF' }}>
                  Resultados <span className="font-semibold text-white">{topPerformer.indice.moduloA}</span>
                </span>
                <span className="text-xs" style={{ color: '#85AADF' }}>
                  Proactividad <span className="font-semibold text-white">{topPerformer.indice.moduloC}</span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: '#85AADF' }}>Sin datos suficientes todavía.</p>
          )}
        </div>

        {/* Estado de objetivos */}
        <div className="traza-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Estado de objetivos</p>
            <InfoBtn id="estado">
              <p className="font-semibold text-gray-800 mb-1">Estados posibles</p>
              <div>
                <p className="font-medium text-gray-800">Completados</p>
                <p>Objetivos marcados como terminados, con o sin validación del supervisor.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">En progreso</p>
                <p>El colaborador registró avances pero el objetivo aún no se cerró.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Pendientes</p>
                <p>Sin actividad registrada. Pueden ser objetivos nuevos o no iniciados.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Validaciones positivas</p>
                <p>Completados donde el supervisor eligió "De acuerdo". Incide directamente en el Índice TRAZA.</p>
              </div>
            </InfoBtn>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Cumplimiento por área</h2>
            <InfoBtn id="area">
              <p className="font-semibold text-gray-800 mb-1">Cómo se calcula</p>
              <p>Porcentaje de objetivos completados sobre el total asignado en cada área, ordenado de mayor a menor. Las áreas se toman del campo correspondiente en el perfil de cada colaborador.</p>
              <p>Un área con bajo cumplimiento puede reflejar objetivos mal dimensionados, recursos insuficientes o falta de seguimiento — no necesariamente bajo desempeño individual.</p>
            </InfoBtn>
          </div>
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
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ranking Traza</h2>
            <InfoBtn id="ranking">
              <p className="font-semibold text-gray-800 mb-1">Composición del ranking</p>
              <p>Cada persona se ordena por su <span className="font-medium text-gray-800">Score Dual</span>, que combina dos fuentes independientes de medición.</p>
              <div>
                <p className="font-medium text-gray-800">Validado — 60%</p>
                <p>Índice TRAZA clásico. Surge de los objetivos evaluados por managers: cumplimiento, calidad de validación y consistencia con el resto del equipo.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Autónomo — 40%</p>
                <p>Mide el comportamiento del empleado con independencia de la evaluación del supervisor. Compuesto por consistencia (frecuencia de avances), densidad de evidencia (archivos y links adjuntos) y proactividad (avances sin respuesta pendiente).</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Posible sesgo</p>
                <p>Se marca cuando el índice autónomo supera al validado por más de 20 puntos, lo que puede indicar que el manager está evaluando por debajo del desempeño real.</p>
              </div>
            </InfoBtn>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {ranking.length === 0 && (
            <p className="text-gray-400 text-center py-12">No hay datos todavía.</p>
          )}
          {ranking.map((item, i) => {
            const s          = item.indice.score
            const scoreColor = s >= 85 ? '#16a34a' : s >= 65 ? '#3350D0' : s >= 40 ? '#d97706' : '#9ca3af'
            return (
              <div key={item.persona.id} className="px-6 py-4 flex items-center gap-4">
                <span className="text-sm font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-traza-700 text-xs font-bold">
                    {item.persona.nombre[0]}{item.persona.apellido[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.persona.nombre} {item.persona.apellido}</p>
                  <p className="text-xs text-gray-500">{item.persona.cargo ?? ''}{item.persona.area ? ` · ${item.persona.area}` : ''}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">
                      Resultados: <span className="font-semibold text-gray-600">{item.indice.moduloA}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Cumplimiento: <span className="font-semibold text-gray-600">{item.indice.moduloB}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      Proactividad: <span className="font-semibold text-gray-600">{item.indice.moduloC}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold" style={{ color: scoreColor }}>{s}</p>
                  <p className="text-xs text-gray-400">/100 · {item.indice.badge}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>


      {/* ── Señales del equipo ───────────────────────────────── */}
      {ranking.length >= 2 && (() => {
        const esfuerzoSinDireccion = ranking.filter(r => r.indice.moduloC >= 65 && r.indice.moduloA < 45)
        const altaAutoconciencia   = ranking.filter(r => r.indice.alineacion >= 80)
        const tendenciaBaja        = ranking.filter(r => r.indice.evolucion <= 35)
        const enRiesgoPersonas     = ranking.filter(r => r.indice.score < 40)

        // Resumen evaluaciones de supervisor
        const totalEvals = evalSupervisor.length
        const pctExcBueno = totalEvals > 0
          ? Math.round(evalSupervisor.filter(e => e.calificacion === 'Excelente' || e.calificacion === 'Bueno').length / totalEvals * 100)
          : null

        const senales = [
          esfuerzoSinDireccion.length > 0 && {
            id: 'esfuerzo', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
            titulo: 'Esfuerzo sin dirección',
            desc: `${esfuerzoSinDireccion.length} persona${esfuerzoSinDireccion.length > 1 ? 's tienen' : ' tiene'} alta proactividad pero resultados bajos. Puede indicar falta de foco o contexto estratégico.`,
            personas: esfuerzoSinDireccion.slice(0, 3).map(r => `${r.persona.nombre} ${r.persona.apellido}`),
          },
          altaAutoconciencia.length > 0 && {
            id: 'autoconciencia', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
            titulo: 'Alta autoconciencia',
            desc: `${altaAutoconciencia.length} persona${altaAutoconciencia.length > 1 ? 's' : ''} muestra${altaAutoconciencia.length > 1 ? 'n' : ''} alta alineación entre su autoevaluación y la del supervisor. Señal de madurez profesional.`,
            personas: altaAutoconciencia.slice(0, 3).map(r => `${r.persona.nombre} ${r.persona.apellido}`),
          },
          tendenciaBaja.length > 0 && {
            id: 'tendencia', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
            titulo: 'Tendencia a la baja',
            desc: `${tendenciaBaja.length} persona${tendenciaBaja.length > 1 ? 's tienen' : ' tiene'} una evolución negativa en los últimos 90 días. Vale la pena hacer un seguimiento.`,
            personas: tendenciaBaja.slice(0, 3).map(r => `${r.persona.nombre} ${r.persona.apellido}`),
          },
          enRiesgoPersonas.length > 0 && {
            id: 'riesgo', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
            titulo: 'Necesitan atención',
            desc: `${enRiesgoPersonas.length} persona${enRiesgoPersonas.length > 1 ? 's tienen' : ' tiene'} un score por debajo de 40. Requieren acompañamiento activo.`,
            personas: enRiesgoPersonas.slice(0, 3).map(r => `${r.persona.nombre} ${r.persona.apellido}`),
          },
        ].filter(Boolean) as any[]

        if (senales.length === 0 && pctExcBueno === null) return null

        return (
          <div className="traza-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-900">Señales del equipo</h2>
                <p className="text-xs text-gray-400 mt-0.5">Patrones detectados automáticamente a partir de las 5 dimensiones del Score v3</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {senales.map(s => (
                <div key={s.id} className="rounded-xl p-4 border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: s.color }}>{s.titulo}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.personas.map((n: string) => (
                      <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-white font-medium text-gray-700 border border-gray-200">{n}</span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Card evaluaciones de supervisor */}
              {pctExcBueno !== null && (
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: '#0369a1' }}>Evaluación del manager</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    El equipo evaluó a la conducción este mes. <strong>{pctExcBueno}%</strong> de las respuestas fueron positivas ({totalEvals} evaluación{totalEvals !== 1 ? 'es' : ''} recibida{totalEvals !== 1 ? 's' : ''}).
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(['Excelente','Bueno','Regular','Mejorable'] as const).map(cal => {
                      const count = evalSupervisor.filter(e => e.calificacion === cal).length
                      if (count === 0) return null
                      const colMap: Record<string, string> = { Excelente: '#16a34a', Bueno: '#3350D0', Regular: '#d97706', Mejorable: '#dc2626' }
                      return (
                        <span key={cal} className="text-xs px-2.5 py-1 rounded-full bg-white border font-medium" style={{ color: colMap[cal], borderColor: '#e2e8f0' }}>
                          {cal}: {count}
                        </span>
                      )
                    })}
                  </div>
                  {evalSupervisor.length > 0 && (() => {
                    const aspectosCounts: Record<string, number> = {}
                    evalSupervisor.forEach(e => (e.aspectos ?? []).forEach((a: string) => { aspectosCounts[a] = (aspectosCounts[a] ?? 0) + 1 }))
                    const top3 = Object.entries(aspectosCounts).sort((a,b) => b[1]-a[1]).slice(0,3)
                    if (top3.length === 0) return null
                    return (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1.5">Aspectos más destacados</p>
                        <div className="flex flex-wrap gap-1.5">
                          {top3.map(([a, c]) => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{a} ({c})</span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Evolución trimestral — anulada temporalmente */}

      {/* Distribución por categoría + Gap de discrepancia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoría */}
        <div className="traza-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Objetivos por categoría</h2>
            <InfoBtn id="categoria">
              <p className="font-semibold text-gray-800 mb-1">Tipos de objetivo</p>
              <div>
                <p className="font-medium text-gray-800">Resultado</p>
                <p>Entregables concretos con impacto medible. Ej: lanzar un producto, cerrar ventas.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Eficiencia</p>
                <p>Mejora de procesos existentes. Ej: reducir tiempos, bajar costos operativos.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Aprendizaje</p>
                <p>Desarrollo de habilidades o conocimientos. Ej: certificaciones, capacitaciones.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Hábito</p>
                <p>Comportamientos continuos. Ej: reportes semanales, reuniones de equipo regulares.</p>
              </div>
            </InfoBtn>
          </div>
          <div className="space-y-3">
            {(stats.porCategoria ?? []).filter((c: any) => c.total > 0).map((c: any) => {
              const catColors: Record<string, { bg: string; color: string }> = {
                Resultado:   { bg: '#EDEFFD', color: '#3350D0' },
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
