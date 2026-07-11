'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza } from '@/lib/traza'
import { Search, SlidersHorizontal, ChevronRight, TrendingUp } from 'lucide-react'
import type { Objetivo } from '@/types'

type NivelFiltro = 'todos' | 'elite' | 'avanzado' | 'profesional' | 'inicial'

const NIVEL_TABS: { key: NivelFiltro; label: string; color: string; min: number; max: number }[] = [
  { key: 'todos',       label: 'Todos',         color: '#6b7280', min: 0,  max: 100 },
  { key: 'elite',       label: 'Elite  85+',    color: '#d97706', min: 85, max: 100 },
  { key: 'avanzado',    label: 'Avanzado 65+',  color: '#3350D0', min: 65, max: 84  },
  { key: 'profesional', label: 'Profesional',   color: '#16a34a', min: 40, max: 64  },
  { key: 'inicial',     label: 'En desarrollo', color: '#9ca3af', min: 0,  max: 39  },
]

function ScoreBadge({ score }: { score: number }) {
  const nivel = NIVEL_TABS.find(n => n.key !== 'todos' && score >= n.min && score <= n.max)
  return (
    <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
      style={{ backgroundColor: (nivel?.color ?? '#6b7280') + '18', border: `2px solid ${(nivel?.color ?? '#6b7280')}30` }}>
      <span className="text-xl font-bold leading-none" style={{ color: nivel?.color ?? '#6b7280' }}>{score}</span>
      <span className="text-xs" style={{ color: nivel?.color ?? '#9ca3af' }}>/100</span>
    </div>
  )
}

function MiniBar({ val, color }: { val: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-gray-100 overflow-hidden flex-1">
      <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: color }} />
    </div>
  )
}

export default function BuscarTalentoPage() {
  const router = useRouter()
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [nivel, setNivel]           = useState<NivelFiltro>('todos')
  const [areaFiltro, setAreaFiltro] = useState('todas')
  const [sortBy, setSortBy]         = useState<'score' | 'nombre' | 'area'>('score')

  interface EmpleadoData {
    persona: any
    indice: ReturnType<typeof calcularIndiceTraza>
  }
  const [empleados, setEmpleados] = useState<EmpleadoData[]>([])
  const [areas, setAreas]         = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('empresa_id, rol').eq('id', user.id).single()
      if (!profile?.empresa_id) return

      // Cargar todas las personas de la empresa
      const { data: personas } = await supabase
        .from('personas').select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('empleo_activo', true)
        .order('apellido')

      if (!personas || personas.length === 0) { setLoading(false); return }

      // Cargar todos los objetivos de una vez
      const { data: allObs } = await supabase
        .from('objetivos').select('*')
        .eq('empresa_id', profile.empresa_id)

      // Cargar todos los avances de una vez
      const obsIds = (allObs ?? []).map((o: any) => o.id)
      let allAvances: any[] = []
      if (obsIds.length > 0) {
        const { data: av } = await supabase
          .from('objetivo_avances').select('objetivo_id, created_at, creado_en')
          .in('objetivo_id', obsIds)
        allAvances = av ?? []
      }

      // Calcular score por persona
      const datos: EmpleadoData[] = personas.map((p: any) => {
        const obsPersona = (allObs ?? []).filter((o: any) => o.persona_id === p.id) as Objetivo[]
        const obsIds = obsPersona.map(o => o.id)
        const avPersona = allAvances.filter(a => obsIds.includes(a.objetivo_id))
        return {
          persona: p,
          indice: calcularIndiceTraza(obsPersona, avPersona),
        }
      })

      const areasUnicas = [...new Set(personas.map((p: any) => p.area).filter(Boolean))] as string[]
      setAreas(areasUnicas)
      setEmpleados(datos)
      setLoading(false)
    }
    load()
  }, [])

  const filtrado = useMemo(() => {
    const tab = NIVEL_TABS.find(t => t.key === nivel)!
    return empleados
      .filter(e => {
        const s = e.indice.score
        if (nivel !== 'todos' && (s < tab.min || s > tab.max)) return false
        if (areaFiltro !== 'todas' && e.persona.area !== areaFiltro) return false
        const q = search.toLowerCase()
        if (!q) return true
        return (
          `${e.persona.nombre} ${e.persona.apellido}`.toLowerCase().includes(q) ||
          (e.persona.cargo ?? '').toLowerCase().includes(q) ||
          (e.persona.area ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'score')  return b.indice.score - a.indice.score
        if (sortBy === 'nombre') return `${a.persona.apellido}${a.persona.nombre}`.localeCompare(`${b.persona.apellido}${b.persona.nombre}`)
        return (a.persona.area ?? '').localeCompare(b.persona.area ?? '')
      })
  }, [empleados, search, nivel, areaFiltro, sortBy])

  if (loading) return <div className="text-gray-400 py-12 text-center">Calculando scores...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Buscar Talento</h1>
          <p className="traza-page-sub">Explorá el equipo filtrado por score, área y nivel de desempeño.</p>
        </div>
      </div>

      {/* Tabs de nivel */}
      <div className="flex gap-2 flex-wrap">
        {NIVEL_TABS.map(tab => {
          const count = tab.key === 'todos'
            ? empleados.length
            : empleados.filter(e => e.indice.score >= tab.min && e.indice.score <= tab.max).length
          return (
            <button key={tab.key} onClick={() => setNivel(tab.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={nivel === tab.key
                ? { backgroundColor: tab.color + '18', borderColor: tab.color + '40', color: tab.color }
                : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
              {tab.label} <span className="ml-1 opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nombre, cargo o área..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="traza-input pl-9 w-full"
          />
        </div>
        <select className="traza-input w-auto" value={areaFiltro} onChange={e => setAreaFiltro(e.target.value)}>
          <option value="todas">Todas las áreas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <select className="traza-input w-auto" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="score">Ordenar por score</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="area">Ordenar por área</option>
          </select>
        </div>
      </div>

      {/* Resultados */}
      {filtrado.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p>No hay resultados para los filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrado.map((e, idx) => {
            const { persona, indice } = e
            const iniciales = `${persona.nombre?.[0] ?? ''}${persona.apellido?.[0] ?? ''}`.toUpperCase()
            const nivelTab = NIVEL_TABS.find(t => t.key !== 'todos' && indice.score >= t.min && indice.score <= t.max)

            return (
              <div key={persona.id}
                className="traza-card p-5 flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/perfil`)}>

                {/* Rank */}
                <span className="text-sm font-bold text-gray-300 w-6 text-center flex-shrink-0">
                  {sortBy === 'score' ? idx + 1 : '—'}
                </span>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: '#1C2B90', color: '#8899EE' }}>
                  {iniciales}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{persona.nombre} {persona.apellido}</p>
                  <p className="text-sm text-gray-500">
                    {persona.cargo ?? '—'}{persona.area ? ` · ${persona.area}` : ''}
                  </p>
                  {/* Mini barras */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">Resultados</span>
                      <MiniBar val={indice.moduloA} color="#3350D0" />
                      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{indice.moduloA}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">Proactividad</span>
                      <MiniBar val={indice.moduloC} color="#7c3aed" />
                      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{indice.moduloC}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">Evolución</span>
                      <MiniBar val={indice.evolucion} color="#d97706" />
                      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{indice.evolucion}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <ScoreBadge score={indice.score} />

                {/* Nivel badge + arrow */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {nivelTab && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: nivelTab.color + '18', color: nivelTab.color }}>
                      {indice.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats resumen debajo */}
      {empleados.length > 0 && (
        <div className="traza-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-traza-600" />
            <p className="font-semibold text-gray-900 text-sm">Distribución del equipo</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {NIVEL_TABS.filter(t => t.key !== 'todos').map(tab => {
              const count = empleados.filter(e => e.indice.score >= tab.min && e.indice.score <= tab.max).length
              const pct = empleados.length > 0 ? Math.round((count / empleados.length) * 100) : 0
              return (
                <div key={tab.key} className="text-center">
                  <div className="h-16 relative flex items-end justify-center mb-1">
                    <div className="w-10 rounded-t-lg transition-all" style={{ height: `${Math.max(4, pct)}%`, backgroundColor: tab.color + '40', border: `1px solid ${tab.color}40` }} />
                  </div>
                  <p className="text-lg font-bold" style={{ color: tab.color }}>{count}</p>
                  <p className="text-xs text-gray-400">{tab.label.split(' ')[0]}</p>
                  <p className="text-xs text-gray-300">{pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
