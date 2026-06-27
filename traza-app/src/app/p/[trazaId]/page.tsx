import { createAdminClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, calcularIndiceAutonomo, calcularIndiceDual, generarPerfilNarrativo } from '@/lib/traza'
import { ShieldCheck, TrendingUp, Star, Calendar, CheckCircle2, Clock, Building2, Briefcase } from 'lucide-react'
import type { Objetivo } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaLarga(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function formatPeriodo(inicio: string | null, fin: string | null) {
  const fmt = (f: string) => new Date(f).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
  if (!inicio) return ''
  return fin ? `${fmt(inicio)} – ${fmt(fin)}` : `${fmt(inicio)} – Actualidad`
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
  const supabase = createAdminClient()

  // Traer TODAS las instancias de esta persona (todas las empresas)
  const { data: todasLasPersonas } = await supabase
    .from('personas')
    .select('*, empresa:empresas(nombre, rubro)')
    .eq('traza_id', params.trazaId)
    .order('fecha_inicio_empleo', { ascending: false })

  if (!todasLasPersonas || todasLasPersonas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <p className="text-6xl font-bold mb-3" style={{ color: '#e5e7eb' }}>404</p>
          <p className="text-gray-400 text-sm">Credencial TRAZA no encontrada.</p>
        </div>
      </div>
    )
  }

  // Persona actual (empleo_activo = true, o la más reciente)
  const personaActual = todasLasPersonas.find(p => p.empleo_activo === true) ?? todasLasPersonas[0]
  const empresaNombreActual = (personaActual as any).empresa?.nombre ?? null

  // Traer objetivos de la empresa actual
  const { data: objetivosActuales } = await supabase
    .from('objetivos')
    .select('*')
    .eq('persona_id', personaActual.id)
    .order('fecha_limite', { ascending: true })

  const objsActuales = (objetivosActuales ?? []) as Objetivo[]
  const indiceActual = calcularIndiceTraza(objsActuales)
  const { score, badge, cumplimiento, total, completados, positivos, parciales, negativos, moduloA, moduloB, moduloC } = indiceActual

  // Avances para el índice autónomo
  const { data: avancesRaw } = await supabase
    .from('objetivo_avances')
    .select('*')
    .in('objetivo_id', objsActuales.length > 0 ? objsActuales.map(o => o.id) : ['00000000-0000-0000-0000-000000000000'])

  const indiceAutonomo = calcularIndiceAutonomo(objsActuales, avancesRaw ?? [])
  const indiceDual = calcularIndiceDual(score, indiceAutonomo)
  const scoreDisplay = score  // score principal: TRAZA validado (no Dual)

  // Traer objetivos de empresas anteriores (agregados)
  const historialEmpresas: Array<{
    personaId: string
    empresa: string
    rubro: string | null
    cargo: string | null
    area: string | null
    inicio: string | null
    fin: string | null
    activo: boolean
    totalObj: number
    completadosObj: number
    positivosObj: number
    parcialesObj: number
    negativosObj: number
    score: number
  }> = []

  let totalObjGlobal = 0
  let completadosGlobal = 0
  let positivosGlobal = 0
  let parcialesGlobal = 0
  let negativosGlobal = 0

  for (const p of todasLasPersonas) {
    const { data: objs } = await supabase
      .from('objetivos')
      .select('*')
      .eq('persona_id', p.id)

    const listaObjs = (objs ?? []) as Objetivo[]
    const indice = calcularIndiceTraza(listaObjs)

    totalObjGlobal += listaObjs.length
    completadosGlobal += indice.completados
    positivosGlobal += indice.positivos
    parcialesGlobal += indice.parciales
    negativosGlobal += indice.negativos

    historialEmpresas.push({
      personaId: p.id,
      empresa: (p as any).empresa?.nombre ?? 'Empresa desconocida',
      rubro: (p as any).empresa?.rubro ?? null,
      cargo: p.cargo,
      area: p.area,
      inicio: p.fecha_inicio_empleo ?? null,
      fin: p.fecha_fin_empleo ?? null,
      activo: p.empleo_activo === true,
      totalObj: listaObjs.length,
      completadosObj: indice.completados,
      positivosObj: indice.positivos,
      parcialesObj: indice.parciales,
      negativosObj: indice.negativos,
      score: indice.score,
    })
  }

  // Score global (promedio ponderado por cantidad de objetivos)
  const scoreGlobal = totalObjGlobal > 0
    ? Math.round(historialEmpresas.reduce((acc, h) => acc + h.score * h.totalObj, 0) / totalObjGlobal)
    : score

  const empresasAnteriores = historialEmpresas.filter(h => !h.activo)

  // miembroDesde necesario antes del prompt IA
  const miembroDesde = historialEmpresas.length > 0
    ? (() => {
        const fechas = historialEmpresas.map(h => h.inicio).filter(Boolean) as string[]
        const earliest = fechas.sort()[0]
        return earliest ? new Date(earliest).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : null
      })()
    : null

  // Narrativa IA con historial completo
  let narrativaIA: string | null = null
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      const historialTexto = empresasAnteriores.map(h =>
        `- ${h.empresa} (${formatPeriodo(h.inicio, h.fin)}): ${h.cargo ?? 'Sin cargo registrado'} · ${h.completadosObj} objetivos completados, ${h.positivosObj} validados positivamente`
      ).join('\n')

      const promptIA = `Sos redactor de credenciales profesionales verificadas. Escribí exactamente 3 oraciones en español sobre este profesional. Tono: conciso, formal, orientado a resultados. Sin bullet points, solo prosa.

Profesional: ${personaActual.nombre} ${personaActual.apellido} · ${personaActual.cargo ?? ''} en ${empresaNombreActual ?? ''}
Trayectoria: ${todasLasPersonas.length} empresas desde ${miembroDesde ?? 'inicio de carrera'}, ${completadosGlobal} objetivos completados, ${positivosGlobal} validados positivamente por supervisores. Score TRAZA: ${scoreGlobal}/100.
Empresas anteriores: ${historialTexto || 'No registradas'}

Las 3 oraciones deben cubrir: (1) quién es y dónde trabaja hoy, (2) su evolución de carrera y sectores, (3) su consistencia de desempeño validada. Sé directo, sin adornos.`

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 180,
          messages: [{ role: 'user', content: promptIA }],
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        narrativaIA = data.content?.[0]?.text ?? null
      }
    }
  } catch (_) { /* fallback al perfil narrativo local */ }

  const narrativaFinal = narrativaIA ?? generarPerfilNarrativo({
    nombre: personaActual.nombre,
    apellido: personaActual.apellido,
    cargo: personaActual.cargo,
    area: personaActual.area,
    empresa: empresaNombreActual,
    objetivos: objsActuales,
  })

  // Timeline por trimestre (solo empresa actual)
  type TriEntry = { completados: number; validadosPos: number; validadosParcial: number; validadosNeg: number }
  const timelineMap: Record<string, TriEntry> = {}
  objsActuales
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

  const totalValidadosActuales = objsActuales.filter(o => !!o.validacion).length
  const ultimaValidacion = objsActuales
    .filter(o => !!o.validacion && o.fecha_limite)
    .sort((a, b) => new Date(b.fecha_limite!).getTime() - new Date(a.fecha_limite!).getTime())[0]

  const scoreColor = scoreDisplay >= 85 ? '#16a34a' : scoreDisplay >= 65 ? '#0F4C81' : scoreDisplay >= 40 ? '#d97706' : '#9ca3af'
  const scoreBg    = scoreDisplay >= 85 ? '#dcfce7' : scoreDisplay >= 65 ? '#dbeafe' : scoreDisplay >= 40 ? '#fef3c7' : '#f3f4f6'

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
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
              <ShieldCheck size={10} />
              Verificado
            </div>
          </div>

          {/* Perfil */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              {personaActual.nombre[0]}{personaActual.apellido[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight">
                {personaActual.nombre} {personaActual.apellido}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {[personaActual.cargo, personaActual.area].filter(Boolean).join(' · ')}
              </p>
              {empresaNombreActual && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{empresaNombreActual}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2.5">
                <ShieldCheck size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {personaActual.traza_id}
                </span>
              </div>
            </div>

            {/* Score principal */}
            <div className="flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 76 }}>
              <span className="text-3xl font-black text-white leading-none">{scoreDisplay}</span>
              <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>/100 · {badge}</span>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {miembroDesde && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Clock size={10} />
                Trayectoria desde {miembroDesde}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <Building2 size={10} />
              {todasLasPersonas.length} empresa{todasLasPersonas.length !== 1 ? 's' : ''} en TRAZA
            </span>
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

        {/* Índice de desempeño verificado */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} style={{ color: '#1d4ed8' }} />
            <span className="text-sm font-semibold text-gray-900">Índice de desempeño verificado</span>
            <span className="ml-auto text-sm font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: scoreBg, color: scoreColor }}>
              {scoreDisplay}/100
            </span>
          </div>
          <div className="space-y-3.5">
            {[
              { label: 'Calidad de validación', sub: 'Evaluaciones de supervisores y administradores', valor: moduloA, peso: '50%', color: '#1d4ed8' },
              { label: 'Cumplimiento de objetivos', sub: 'Objetivos completados sobre los comprometidos', valor: moduloB, peso: '30%', color: '#16a34a' },
              { label: 'Consistencia', sub: 'Alineación entre autoevaluación y validación externa', valor: moduloC, peso: '20%', color: '#7c3aed' },
            ].map(({ label, sub, valor, peso, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-400">({peso})</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color }}>{valor}/100</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${valor}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Basado en {totalValidadosActuales} objetivo{totalValidadosActuales !== 1 ? 's' : ''} con validación supervisora · empresa actual
            </p>
          </div>
        </div>

        {/* Narrativa IA */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
            <h2 className="font-semibold text-gray-900 text-sm">Trayectoria profesional</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: narrativaIA ? '#ede9fe' : '#f3f4f6', color: narrativaIA ? '#7c3aed' : '#9ca3af' }}>
              {narrativaIA ? 'Análisis IA' : 'Resumen automático'}
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm">{narrativaFinal}</p>
        </div>

        {/* Trayectoria por empresa */}
        {todasLasPersonas.length > 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Historial de empresas</h2>
              <span className="ml-auto text-xs text-gray-400">{todasLasPersonas.length} empleos</span>
            </div>

            <div className="space-y-4">
              {historialEmpresas.map((h, i) => {
                const pct = h.totalObj > 0 ? Math.round((h.positivosObj / h.totalObj) * 100) : 0
                const dotColor = h.activo ? '#0F4C81' : '#9ca3af'
                return (
                  <div key={h.personaId} className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: h.activo ? '#0F4C81' : '#d1d5db', border: h.activo ? '2px solid #bfdbfe' : 'none' }} />
                      {i < historialEmpresas.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#e5e7eb', minHeight: 24 }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{h.empresa}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{h.cargo ?? 'Cargo no registrado'}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            {formatPeriodo(h.inicio, h.fin)}
                            {h.rubro && ` · ${h.rubro}`}
                          </p>
                        </div>
                        {h.activo && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                            Actual
                          </span>
                        )}
                      </div>

                      {/* Mini barra de rendimiento */}
                      {h.totalObj > 0 && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{h.completadosObj} completados · {h.positivosObj} validados ✓</span>
                            <span className="text-xs font-semibold" style={{ color: dotColor }}>{h.score}/100</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${h.score}%`, backgroundColor: h.activo ? '#0F4C81' : '#9ca3af' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* Distribución de validaciones (empresa actual) */}
        {totalValidadosActuales > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Validaciones de supervisores</h2>
              <span className="ml-auto text-xs text-gray-400">{totalValidadosActuales} evaluaciones</span>
            </div>
            {/* Porcentaje positivo destacado */}
            {totalValidadosActuales > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>
                  {Math.round((positivos / totalValidadosActuales) * 100)}%
                </span>
                <span className="text-xs text-gray-500 leading-tight">de objetivos evaluados<br/>con resultado positivo</span>
              </div>
            )}
            <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ gap: 2 }}>
              {positivos > 0 && <div style={{ flex: positivos, backgroundColor: '#1d4ed8', borderRadius: 9999 }} />}
              {parciales > 0 && <div style={{ flex: parciales, backgroundColor: '#7c3aed' }} />}
              {negativos > 0 && <div style={{ flex: negativos, backgroundColor: '#dc2626', borderRadius: 9999 }} />}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { n: positivos, label: 'Positivo', color: '#1d4ed8' },
                { n: parciales, label: 'Con observaciones', color: '#7c3aed' },
                { n: negativos, label: 'A reforzar', color: '#dc2626' },
              ].filter(x => x.n > 0).map(({ n, label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{label} <span className="font-semibold text-gray-700">{n}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline trimestral (empresa actual) */}
        {timelineEntries.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Actividad trimestral</h2>
            </div>
            <div className="space-y-3">
              {(() => {
                const maxCompletados = Math.max(...timelineEntries.map(([, e]) => e.completados), 1)
                return timelineEntries.map(([key, entry]) => {
                  const pctPos = entry.completados > 0 ? Math.round((entry.validadosPos / entry.completados) * 100) : 0
                  // Ancho proporcional al máximo del período (mín 20% para que siempre sea visible)
                  const barWidth = Math.max(20, Math.round((entry.completados / maxCompletados) * 100))
                  const barColor = pctPos >= 80 ? '#16a34a' : pctPos >= 50 ? '#0F4C81' : entry.validadosPos === 0 ? '#9ca3af' : '#d97706'
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-20 flex-shrink-0">
                        {formatTrimestreLabel(key)}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 w-24 text-right">
                        {entry.completados} completado{entry.completados !== 1 ? 's' : ''}
                        {entry.validadosPos > 0 && ` · ${entry.validadosPos} ✓`}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: '#6b7280' }} />
            <p className="text-xs font-medium text-gray-500">
              Verificado por <span className="font-bold text-gray-700">TRAZA</span> · Performance Intelligence Platform
            </p>
          </div>
          <p className="text-xs text-gray-400">Actualizada el {ahora}</p>
          <p className="text-xs text-gray-400 font-mono tracking-wide mt-0.5">
            traza.app/p/{personaActual.traza_id}
          </p>
          <p className="text-xs mt-2 text-center max-w-xs text-gray-400 leading-relaxed">
            Esta credencial refleja datos reales validados por supervisores a lo largo de toda la trayectoria profesional.
          </p>
        </div>

      </div>
    </div>
  )
}
