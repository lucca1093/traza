'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, ChevronRight, ShieldCheck, Building2, Clock, Star, Users } from 'lucide-react'

export interface CandidatoPublico {
  trazaId:                  string
  nombre:                   string
  apellido:                 string
  cargo:                    string | null
  area:                     string | null
  rubro:                    string | null
  sectores:                 string[]
  empresasCount:            number
  activoDesde:              string | null
  score:                    number
  nivel:                    string
  badge:                    string
  moduloA:                  number
  moduloB:                  number
  moduloC:                  number
  alineacion:               number
  pctValidacionesPositivas: number
  totalValidaciones:        number
  supervisoresCount:        number
  narrativaSnippet:         string
}

// ── Helpers ───────────────────────────────────────────────────
const NIVEL_COLOR: Record<string, { accent: string; bg: string; border: string; text: string }> = {
  Elite:        { accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  Avanzado:     { accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
  Profesional:  { accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
  Inicial:      { accent: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', text: '#4b5563' },
}

const SCORE_TABS = [
  { key: 'todos',       label: 'Todos',          min: 0,  max: 100 },
  { key: 'elite',       label: 'Elite  85+',     min: 85, max: 100 },
  { key: 'avanzado',    label: 'Avanzado 65+',   min: 65, max: 84  },
  { key: 'profesional', label: 'Profesional',    min: 40, max: 64  },
  { key: 'inicial',     label: 'En desarrollo',  min: 0,  max: 39  },
]

function tiempoActivo(fechaISO: string | null): string {
  if (!fechaISO) return ''
  const meses = Math.max(0, Math.round((Date.now() - new Date(fechaISO).getTime()) / (1000 * 60 * 60 * 24 * 30)))
  if (meses < 3)  return 'Reciente'
  if (meses < 12) return `${meses} meses`
  const años = Math.floor(meses / 12)
  const rem  = meses % 12
  return rem > 0 ? `${años}a ${rem}m` : `${años} año${años > 1 ? 's' : ''}`
}

// ── Score Ring SVG ────────────────────────────────────────────
function ScoreRing({ score, nivel, size = 80 }: { score: number; nivel: string; size?: number }) {
  const nc = NIVEL_COLOR[nivel] ?? NIVEL_COLOR.Inicial
  const r  = size * 0.38
  const cx = size / 2
  const c  = 2 * Math.PI * r
  const dashOffset = c - (score / 100) * c

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size * 0.075} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={nc.accent} strokeWidth={size * 0.075}
          strokeDasharray={c} strokeDashoffset={dashOffset}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none" style={{ fontSize: size * 0.24, color: nc.accent }}>{score}</span>
        <span className="font-medium" style={{ fontSize: size * 0.115, color: nc.accent, opacity: 0.55 }}>/100</span>
      </div>
    </div>
  )
}

// ── Mini bar ─────────────────────────────────────────────────
function MiniBar({ val, color, label }: { val: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 flex-shrink-0" style={{ width: 80 }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 flex-shrink-0 w-6 text-right">{val}</span>
    </div>
  )
}

// ── Distribución del pool ─────────────────────────────────────
function PoolDistribution({ candidatos, onFilter }: { candidatos: CandidatoPublico[]; onFilter: (k: string) => void }) {
  const buckets = SCORE_TABS.filter(t => t.key !== 'todos').map(t => ({
    ...t,
    count: candidatos.filter(c => c.score >= t.min && c.score <= t.max).length,
    color: NIVEL_COLOR[t.key === 'elite' ? 'Elite' : t.key === 'avanzado' ? 'Avanzado' : t.key === 'profesional' ? 'Profesional' : 'Inicial']?.accent ?? '#9ca3af',
  }))
  const max = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Distribución del pool</p>
      <div className="flex items-end gap-3 h-20">
        {buckets.map(b => (
          <button key={b.key} onClick={() => onFilter(b.key)}
            className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="w-full rounded-t-lg transition-all group-hover:opacity-80"
              style={{ height: Math.max(8, Math.round((b.count / max) * 64)), backgroundColor: b.color + '30', border: `1px solid ${b.color}40` }} />
            <span className="text-xs font-bold" style={{ color: b.color }}>{b.count}</span>
            <span className="text-xs text-gray-400 leading-tight text-center" style={{ fontSize: 10 }}>{b.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Featured card (horizontal, top 3) ────────────────────────
function FeaturedCard({ c, rank }: { c: CandidatoPublico; rank: number }) {
  const nc  = NIVEL_COLOR[c.nivel] ?? NIVEL_COLOR.Inicial
  const ini = `${c.nombre[0]}${c.apellido[0]}`.toUpperCase()

  return (
    <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow"
      style={{ borderColor: nc.border }}>
      {/* Barra de color superior */}
      <div className="h-1" style={{ backgroundColor: nc.accent }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar + rank */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: '#16213E', color: '#93C5FD' }}>
              {ini}
            </div>
            {rank <= 3 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                style={{ backgroundColor: nc.accent, color: 'white' }}>
                {rank}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-gray-900">{c.nombre} {c.apellido[0]}.</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}>
                {c.badge}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {c.cargo ?? 'Sin cargo'}{c.area ? ` · ${c.area}` : ''}{c.rubro ? ` · ${c.rubro}` : ''}
            </p>
          </div>

          {/* Score ring */}
          <ScoreRing score={c.score} nivel={c.nivel} size={72} />
        </div>

        {/* Narrativa */}
        {c.narrativaSnippet && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4 italic border-l-2 pl-3"
            style={{ borderColor: nc.accent + '60' }}>
            "{c.narrativaSnippet}"
          </p>
        )}

        {/* Barras */}
        <div className="space-y-2 mb-4">
          <MiniBar val={c.moduloA} color="#2563eb"  label="Resultados"   />
          <MiniBar val={c.moduloC} color="#7c3aed"  label="Proactividad" />
          <MiniBar val={c.alineacion} color="#0891b2" label="Alineación" />
          {c.totalValidaciones > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0" style={{ width: 80 }}>Validaciones</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${c.pctValidacionesPositivas}%`, backgroundColor: '#16a34a' }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 flex-shrink-0 w-6 text-right">{c.pctValidacionesPositivas}%</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Building2 size={11} />
            {c.empresasCount} empresa{c.empresasCount !== 1 ? 's' : ''} en TRAZA
          </div>
          {c.activoDesde && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={11} />
              {tiempoActivo(c.activoDesde)} activo
            </div>
          )}
          {c.supervisoresCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck size={11} className="text-blue-400" />
              {c.supervisoresCount} evaluaciones verificadas
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/p/${c.trazaId}`} target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
          style={{ backgroundColor: nc.accent }}>
          Ver credencial verificada
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ── Regular card (grid) ───────────────────────────────────────
function CandidatoCard({ c }: { c: CandidatoPublico }) {
  const nc  = NIVEL_COLOR[c.nivel] ?? NIVEL_COLOR.Inicial
  const ini = `${c.nombre[0]}${c.apellido[0]}`.toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all flex flex-col">
      {/* Accent line */}
      <div className="h-0.5" style={{ backgroundColor: nc.accent }} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: '#16213E', color: '#93C5FD' }}>
            {ini}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 leading-tight text-sm">{c.nombre} {c.apellido[0]}.</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {c.cargo ?? 'Sin cargo'}{c.area ? ` · ${c.area}` : ''}
            </p>
          </div>
          <ScoreRing score={c.score} nivel={c.nivel} size={56} />
        </div>

        {/* Nivel */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: nc.bg, color: nc.text, border: `1px solid ${nc.border}` }}>
            {c.badge}
          </span>
          {c.rubro && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">{c.rubro}</span>
          )}
        </div>

        {/* Narrativa snippet */}
        {c.narrativaSnippet && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {c.narrativaSnippet}
          </p>
        )}

        {/* Barras */}
        <div className="space-y-1.5">
          <MiniBar val={c.moduloA} color="#2563eb"  label="Resultados"   />
          <MiniBar val={c.moduloC} color="#7c3aed"  label="Proactividad" />
          {c.totalValidaciones > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0" style={{ width: 80 }}>Positivas</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${c.pctValidacionesPositivas}%`, backgroundColor: '#16a34a' }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 w-6 text-right">{c.pctValidacionesPositivas}%</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-50 text-xs text-gray-400">
          <div className="flex items-center gap-1"><Building2 size={10} />{c.empresasCount} emp.</div>
          {c.activoDesde && <div className="flex items-center gap-1"><Clock size={10} />{tiempoActivo(c.activoDesde)}</div>}
          {c.supervisoresCount > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <ShieldCheck size={10} className="text-blue-400" />{c.supervisoresCount} eval.
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/p/${c.trazaId}`} target="_blank"
          className="mt-auto flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all border"
          style={{ borderColor: nc.accent + '60', color: nc.accent }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = nc.accent; el.style.color = 'white'; el.style.borderColor = nc.accent }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = nc.accent; el.style.borderColor = nc.accent + '60' }}>
          Ver credencial
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function TalentSearch({ candidatos, areas, rubros }: { candidatos: CandidatoPublico[]; areas: string[]; rubros: string[] }) {
  const [query,    setQuery]    = useState('')
  const [tabKey,   setTabKey]   = useState('todos')
  const [areaFlt,  setAreaFlt]  = useState('todas')
  const [rubroFlt, setRubroFlt] = useState('todos')
  const [sortBy,   setSortBy]   = useState<'score' | 'nombre' | 'activo' | 'validaciones'>('score')
  const [multiEmp, setMultiEmp] = useState(false)

  const tab = SCORE_TABS.find(t => t.key === tabKey)!

  const resultado = useMemo(() => {
    return candidatos
      .filter(c => {
        if (c.score < tab.min || c.score > tab.max) return false
        if (areaFlt  !== 'todas' && c.area  !== areaFlt)  return false
        if (rubroFlt !== 'todos' && c.rubro !== rubroFlt) return false
        if (multiEmp && c.empresasCount < 2) return false
        if (!query) return true
        const q = query.toLowerCase()
        return (
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
          (c.cargo ?? '').toLowerCase().includes(q) ||
          (c.area ?? '').toLowerCase().includes(q) ||
          (c.rubro ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'score')        return b.score - a.score
        if (sortBy === 'validaciones') return b.supervisoresCount - a.supervisoresCount
        if (sortBy === 'activo')       return (b.activoDesde ?? '').localeCompare(a.activoDesde ?? '')
        return a.apellido.localeCompare(b.apellido)
      })
  }, [candidatos, query, tabKey, areaFlt, sortBy, multiEmp])

  // Top 3 para featured (solo cuando se muestra "Todos" y sin búsqueda activa)
  const showFeatured = tabKey === 'todos' && !query && areaFlt === 'todas' && rubroFlt === 'todos' && !multiEmp
  const featured = useMemo(() =>
    [...candidatos].sort((a, b) => b.score - a.score).slice(0, 3)
  , [candidatos])
  const restantes = showFeatured
    ? resultado.filter(c => !featured.slice(0, 3).some(f => f.trazaId === c.trazaId))
    : resultado

  return (
    <div>
      {/* Distribución */}
      <PoolDistribution candidatos={candidatos} onFilter={k => { setTabKey(k); setQuery(''); setAreaFlt('todas'); setRubroFlt('todos') }} />

      {/* Featured */}
      {showFeatured && featured.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">Perfiles destacados</h2>
            <span className="text-xs text-gray-400">— mayor score verificado</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((c, i) => <FeaturedCard key={c.trazaId} c={c} rank={i + 1} />)}
          </div>
        </div>
      )}

      {/* Tabs de nivel */}
      <div className="flex gap-2 flex-wrap mb-5">
        {SCORE_TABS.map(t => {
          const count  = t.key === 'todos' ? candidatos.length : candidatos.filter(c => c.score >= t.min && c.score <= t.max).length
          const active = tabKey === t.key
          const color  = NIVEL_COLOR[t.key === 'elite' ? 'Elite' : t.key === 'avanzado' ? 'Avanzado' : t.key === 'profesional' ? 'Profesional' : 'Inicial']?.accent ?? '#6b7280'
          return (
            <button key={t.key} onClick={() => setTabKey(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={active
                ? { backgroundColor: color + '15', borderColor: color + '40', color }
                : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
              {t.label} <span className="opacity-50 ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, cargo, área o sector…"
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white" />
        </div>
        {rubros.length > 0 && (
          <select value={rubroFlt} onChange={e => setRubroFlt(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
            <option value="todos">Todos los sectores</option>
            {rubros.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {areas.length > 0 && (
          <select value={areaFlt} onChange={e => setAreaFlt(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
            <option value="todas">Todas las áreas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
          <option value="score">Mayor score</option>
          <option value="validaciones">Más evaluaciones</option>
          <option value="activo">Más trayectoria</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
        <button onClick={() => setMultiEmp(!multiEmp)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
          style={multiEmp
            ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }
            : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#9ca3af' }}>
          <Building2 size={13} />
          Multi-empresa
        </button>
      </div>

      {/* Subtítulo resultados */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {resultado.length === 0
            ? 'Sin resultados para estos filtros'
            : showFeatured && restantes.length > 0
              ? `${restantes.length} perfil${restantes.length !== 1 ? 'es' : ''} más`
              : `${resultado.length} perfil${resultado.length !== 1 ? 'es' : ''} encontrado${resultado.length !== 1 ? 's' : ''}`}
        </p>
        {(query || tabKey !== 'todos' || areaFlt !== 'todas' || rubroFlt !== 'todos' || multiEmp) && (
          <button onClick={() => { setQuery(''); setTabKey('todos'); setAreaFlt('todas'); setRubroFlt('todos'); setMultiEmp(false) }}
            className="text-xs text-blue-600 hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid de resultados */}
      {restantes.length === 0 && resultado.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-dashed border-gray-200">
          <Users size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No hay perfiles que coincidan con los filtros.</p>
        </div>
      ) : restantes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {restantes.map(c => <CandidatoCard key={c.trazaId} c={c} />)}
        </div>
      ) : null}

      <p className="text-center text-xs text-gray-400 mt-10">
        Solo aparecen profesionales que activaron su visibilidad en TRAZA Empleadores.
      </p>
    </div>
  )
}
