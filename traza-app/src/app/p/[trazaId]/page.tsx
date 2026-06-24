import { createClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, generarPerfilNarrativo } from '@/lib/traza'
import { ShieldCheck, TrendingUp, Star, Calendar, CheckCircle2, Clock } from 'lucide-react'
import type { Objetivo } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaLarga(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function getTrimestreKey(fecha: string) {
  const d = new Date(fecha)
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${d.getFullYear()}-Q${q}`
}

function formatTrimestreLabel(key: string) {
  const [year, q] = key.split('-')
  const labels: Record<string, string> = { Q1: 'Ene–Mar', Q2: 'Abr–Jun', Q3: 'Jul–Sep', Q4: 'Oct–Dic' }
  return `${labels[q] ?? q} ${year}`
}

// ── Página ───────────────────────────────────────────────────────────────────

export default async function CredencialTrazaPage({ params }: { params: { trazaId: string } }) {
  const supabase = createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*, empresa:empresas(nombre)')
    .eq('traza_id', params.trazaId)
    .single()

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <p className="text-6xl font-bold mb-3" style={{ color: '#e5e7eb' }}>404</p>
          <p className="text-gray-400 text-sm">Credencial TRAZA no encontrada.</p>
        </div>
      </div>
    )
  }

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('*')
    .eq('persona_id', persona.id)
    .order('fecha_limite', { ascending: true })

  const objs = (objetivos ?? []) as Objetivo[]
  const indice = calcularIndiceTraza(objs)
  const { score, badge, cumplimiento, total, completados, positivos, parciales, negativos, moduloA, moduloB, moduloC } = indice

  const empresaNombre = (persona as any).empresa?.nombre ?? null

  // Narrativa
  const narrativa = generarPerfilNarrativo({
    nombre: persona.nombre,
    apellido: persona.apellido,
    cargo: persona.cargo,
    area: persona.area,
    empresa: empresaNombre,
    objetivos: objs,
  })

  // Última validación
  const objsValidados = objs.filter(o => !!o.validacion)
  const totalValidados = objsValidados.length
  const ultimaValidacion = objsValidados
    .filter(o => o.fecha_limite)
    .sort((a, b) => new Date(b.fecha_limite!).getTime() - new Date(a.fecha_limite!).getTime())[0]

  // Miembro desde
  const miembroDesde = (persona as any).created_at
    ? new Date((persona as any).created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : null

  // Timeline por trimestre
  type TriEntry = { completados: number; validadosPos: number; validadosParcial: number; validadosNeg: number }
  const timelineMap: Record<string, TriEntry> = {}
  objs
    .filter(o => o.estado === 'Completado' && o.fecha_limite)
    .forEach(o => {
      const key = getTrimestreKey(o.fecha_limite!)
      if (!timelineMap[key]) timelineMap[key] = { completados: 0, validadosPos: 0, validadosParcial: 0, validadosNeg: 0 }
      timelineMap[key].completados++
      if (o.validacion === 'De acuerdo') timelineMap[key].validadosPos++
      else if (o.validacion === 'Parcialmente de acuerdo') timelineMap[key].validadosParcial++
      else if (o.validacion === 'En desacuerdo') timelineMap[key].validadosNeg++
    })
  const timelineEntries = Object.entries(timelineMap).sort(([a], [b]) => a.localeCompare(b))

  // Score color
  const scoreColor = score >= 85 ? '#16a34a' : score >= 65 ? '#0F4C81' : score >= 40 ? '#d97706' : '#9ca3af'
  const scoreBg    = score >= 85 ? '#dcfce7' : score >= 65 ? '#dbeafe' : score >= 40 ? '#fef3c7' : '#f3f4f6'

  const ahora = formatFechaLarga(new Date().toISOString())

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1a6bb5 100%)' }} className="px-5 pt-6 pb-10">
        <div className="max-w-xl mx-auto">

          {/* Barra superior */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-base tracking-tight">TRAZA</span>
              <span className="text-blue-300 text-xs font-medium">· Credencial verificada</span>
            </div>
            <a href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver
            </a>
          </div>

          {/* Perfil */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              {persona.nombre[0]}{persona.apellido[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight">
                {persona.nombre} {persona.apellido}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {[persona.cargo, persona.area].filter(Boolean).join(' · ')}
              </p>
              {empresaNombre && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{empresaNombre}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2.5">
                <ShieldCheck size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {persona.traza_id}
                </span>
              </div>
            </div>

            {/* Score badge */}
            <div className="flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 72 }}>
              <span className="text-3xl font-black text-white leading-none">{score}</span>
              <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>/100</span>
              <span className="text-xs font-semibold mt-1.5 text-center leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>{badge}</span>
            </div>
          </div>

          {/* Chips de estado rápido */}
          <div className="flex flex-wrap gap-2 mt-5">
            {miembroDesde && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Clock size={10} />
                Desde {miembroDesde}
              </span>
            )}
            {ultimaValidacion?.fecha_limite && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <CheckCircle2 size={10} />
                Últ. validación: {formatFechaLarga(ultimaValidacion.fecha_limite)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="max-w-xl mx-auto px-4 space-y-4" style={{ marginTop: -20 }}>

        {/* Sello de verificación */}
        <div className="bg-white rounded-2xl px-5 py-3.5 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#dbeafe' }}>
            <ShieldCheck size={18} style={{ color: '#1d4ed8' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900">Desempeño verificado por supervisores</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalValidados} objetivo{totalValidados !== 1 ? 's' : ''} validado{totalValidados !== 1 ? 's' : ''} por líderes de {empresaNombre ?? 'la organización'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: scoreBg, color: scoreColor }}>
            {score}/100
          </span>
        </div>

        {/* Narrativa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
            <h2 className="font-semibold text-gray-900 text-sm">Perfil profesional</h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm">{narrativa}</p>
        </div>

        {/* Módulos del Índice TRAZA */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Composición del Índice TRAZA</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Calidad de validación',
                sub: 'Promedio ponderado: supervisor + admin + autoevaluación',
                valor: moduloA,
                peso: '50%',
                color: '#1d4ed8',
              },
              {
                label: 'Cumplimiento',
                sub: 'Objetivos completados sobre los que ya vencieron',
                valor: moduloB,
                peso: '30%',
                color: '#16a34a',
              },
              {
                label: 'Consistencia',
                sub: 'Alineación entre autoevaluación y validación del supervisor',
                valor: moduloC,
                peso: '20%',
                color: '#7c3aed',
              },
            ].map(({ label, sub, valor, peso, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                    <span className="ml-2 text-xs text-gray-400">({peso})</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>{valor}/100</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${valor}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{total} objetivos · {completados} completados</span>
            <span className="text-xs text-gray-500">Índice final: <span className="font-bold" style={{ color: scoreColor }}>{score}/100</span></span>
          </div>
        </div>

        {/* Distribución de validaciones */}
        {totalValidados > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Calificaciones de supervisores</h2>
              <span className="ml-auto text-xs text-gray-400">{totalValidados} total</span>
            </div>

            {/* Barra */}
            <div className="flex h-2.5 rounded-full overflow-hidden mb-3" style={{ gap: 2 }}>
              {positivos > 0 && (
                <div style={{ flex: positivos, backgroundColor: '#1d4ed8', borderRadius: 9999 }} />
              )}
              {parciales > 0 && (
                <div style={{ flex: parciales, backgroundColor: '#7c3aed' }} />
              )}
              {negativos > 0 && (
                <div style={{ flex: negativos, backgroundColor: '#dc2626', borderRadius: 9999 }} />
              )}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { n: positivos, label: 'De acuerdo', color: '#1d4ed8' },
                { n: parciales, label: 'Parcialmente', color: '#7c3aed' },
                { n: negativos, label: 'En desacuerdo', color: '#dc2626' },
              ].filter(x => x.n > 0).map(({ n, label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{label} <span className="font-semibold text-gray-700">{n}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline por trimestre */}
        {timelineEntries.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Historial de desempeño</h2>
            </div>
            <div className="space-y-3">
              {timelineEntries.map(([key, entry]) => {
                const totalTri = entry.completados
                const pctPos = totalTri > 0 ? Math.round((entry.validadosPos / totalTri) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-20 flex-shrink-0">
                      {formatTrimestreLabel(key)}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pctPos}%`,
                          backgroundColor: pctPos >= 80 ? '#16a34a' : pctPos >= 50 ? '#0F4C81' : '#d97706'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 w-24 text-right">
                      {entry.completados} completado{entry.completados !== 1 ? 's' : ''}
                      {entry.validadosPos > 0 && ` · ${entry.validadosPos} ✓`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: '#9ca3af' }} />
            <p className="text-xs text-gray-400">
              Credencial generada y verificada por <span className="font-bold text-gray-500">TRAZA</span>
            </p>
          </div>
          <p className="text-xs" style={{ color: '#d1d5db' }}>Actualizada el {ahora}</p>
          <p className="text-xs mt-1" style={{ color: '#e5e7eb' }}>
            Esta credencial refleja datos reales validados por supervisores dentro de la plataforma.
          </p>
        </div>

      </div>
    </div>
  )
}
