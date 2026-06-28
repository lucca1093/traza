'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, ChevronRight, ShieldCheck, Building2, Clock } from 'lucide-react'

export interface CandidatoPublico {
  trazaId: string
  nombre: string
  apellido: string
  cargo: string | null
  area: string | null
  empresasCount: number
  activoDesde: string | null
  score: number
  nivel: string
  badge: string
  moduloA: number
  moduloC: number
  pctValidacionesPositivas: number
  totalValidaciones: number
}

const SCORE_TABS = [
  { key: 'todos',       label: 'Todos',         min: 0,  max: 100 },
  { key: 'elite',       label: 'Elite  85+',    min: 85, max: 100 },
  { key: 'avanzado',    label: 'Avanzado',      min: 65, max: 84  },
  { key: 'profesional', label: 'Profesional',   min: 40, max: 64  },
  { key: 'inicial',     label: 'En desarrollo', min: 0,  max: 39  },
]

const NIVEL_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Elite:        { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Avanzado:     { bg: '#dbeafe', text: '#1e3a8a', border: '#bfdbfe' },
  Profesional:  { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  Inicial:      { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' },
}

function ScoreCircle({ score, nivel }: { score: number; nivel: string }) {
  const c = NIVEL_COLOR[nivel] ?? NIVEL_COLOR.Inicial
  return (
    <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border-2"
      style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <span className="text-2xl font-black leading-none" style={{ color: c.text }}>{score}</span>
      <span className="text-xs font-medium" style={{ color: c.text, opacity: 0.7 }}>/100</span>
    </div>
  )
}

function MiniBar({ val, color }: { val: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: color }} />
    </div>
  )
}

function tiempoActivo(fechaISO: string | null): string {
  if (!fechaISO) return ''
  const inicio = new Date(fechaISO)
  const meses  = Math.max(0, Math.round((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  if (meses < 3)  return 'Reciente'
  if (meses < 12) return `${meses} meses`
  const años = Math.floor(meses / 12)
  const rem  = meses % 12
  return rem > 0 ? `${años} a. ${rem} m.` : `${años} año${años > 1 ? 's' : ''}`
}

export default function TalentSearch({ candidatos, areas }: { candidatos: CandidatoPublico[]; areas: string[] }) {
  const [query, setQuery]     = useState('')
  const [tabKey, setTabKey]   = useState('todos')
  const [areaFlt, setAreaFlt] = useState('todas')
  const [sortBy, setSortBy]   = useState<'score' | 'nombre' | 'activo'>('score')

  const tab = SCORE_TABS.find(t => t.key === tabKey)!

  const resultado = useMemo(() => {
    return candidatos
      .filter(c => {
        if (c.score < tab.min || c.score > tab.max) return false
        if (areaFlt !== 'todas' && c.area !== areaFlt) return false
        if (!query) return true
        const q = query.toLowerCase()
        return (
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
          (c.cargo ?? '').toLowerCase().includes(q) ||
          (c.area ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'score')  return b.score - a.score
        if (sortBy === 'nombre') return a.apellido.localeCompare(b.apellido)
        return (b.activoDesde ?? '').localeCompare(a.activoDesde ?? '')
      })
  }, [candidatos, query, tabKey, areaFlt, sortBy])

  return (
    <div>
      {/* Tabs de nivel */}
      <div className="flex gap-2 flex-wrap mb-5">
        {SCORE_TABS.map(t => {
          const count = t.key === 'todos' ? candidatos.length : candidatos.filter(c => c.score >= t.min && c.score <= t.max).length
          const active = tabKey === t.key
          const c = t.key === 'elite' ? '#92400e' : t.key === 'avanzado' ? '#1e3a8a' : t.key === 'profesional' ? '#065f46' : '#6b7280'
          return (
            <button key={t.key} onClick={() => setTabKey(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={active
                ? { backgroundColor: c + '18', borderColor: c + '40', color: c }
                : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
              {t.label} <span className="opacity-60 ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar por cargo, área o nombre…"
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>
        {areas.length > 0 && (
          <select value={areaFlt} onChange={e => setAreaFlt(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
            <option value="todas">Todas las áreas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
            <option value="score">Mayor score</option>
            <option value="nombre">Nombre A-Z</option>
            <option value="activo">Más trayectoria</option>
          </select>
        </div>
      </div>

      {/* Resultados */}
      {resultado.length === 0 ? (
        <div className="text-center py-20">
          <Search size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No hay perfiles que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resultado.map((c, idx) => {
            const nc  = NIVEL_COLOR[c.nivel] ?? NIVEL_COLOR.Inicial
            const ini = `${c.nombre[0]}${c.apellido[0]}`.toUpperCase()
            return (
              <div key={c.trazaId}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow hover:border-gray-200">

                {/* Cabecera */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ backgroundColor: '#16213E', color: '#93C5FD' }}>
                    {ini}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 leading-tight">
                      {c.nombre} {c.apellido[0]}.
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {c.cargo ?? 'Sin cargo'}{c.area ? ` · ${c.area}` : ''}
                    </p>
                  </div>
                  {/* Score */}
                  <ScoreCircle score={c.score} nivel={c.nivel} />
                </div>

                {/* Nivel badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                    style={{ backgroundColor: nc.bg, color: nc.text, borderColor: nc.border }}>
                    {c.badge}
                  </span>
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span className="text-xs text-gray-400">Score verificado</span>
                </div>

                {/* Barras dimensiones */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0">Resultados</span>
                    <MiniBar val={c.moduloA} color="#1d4ed8" />
                    <span className="text-xs font-semibold text-gray-600 w-7 text-right">{c.moduloA}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0">Proactividad</span>
                    <MiniBar val={c.moduloC} color="#7c3aed" />
                    <span className="text-xs font-semibold text-gray-600 w-7 text-right">{c.moduloC}</span>
                  </div>
                  {c.totalValidaciones > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-24 flex-shrink-0">Validaciones</span>
                      <MiniBar val={c.pctValidacionesPositivas} color="#16a34a" />
                      <span className="text-xs font-semibold text-gray-600 w-7 text-right">{c.pctValidacionesPositivas}%</span>
                    </div>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Building2 size={12} />
                    {c.empresasCount} empresa{c.empresasCount !== 1 ? 's' : ''}
                  </div>
                  {c.activoDesde && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {tiempoActivo(c.activoDesde)} en TRAZA
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link href={`/p/${c.trazaId}`} target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all border"
                  style={{ borderColor: '#1d4ed8', color: '#1d4ed8' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#1d4ed8' }}>
                  Ver credencial verificada
                  <ChevronRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-10">
        Solo aparecen profesionales que optaron por estar visibles en TRAZA Empleadores.
      </p>
    </div>
  )
}
