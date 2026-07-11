import { createAdminClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, generarPerfilNarrativo } from '@/lib/traza'
import { ShieldCheck, TrendingUp, Star, Calendar, CheckCircle2, Clock, Building2, Briefcase, Users, ShieldAlert } from 'lucide-react'
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

  // Respetar la decisión de privacidad del empleado
  if (personaActual.credencial_publica === false) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#f1f5f9' }}>
            <ShieldCheck size={24} style={{ color: '#cbd5e1' }} />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-2">Credencial privada</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Esta persona eligió mantener su credencial TRAZA privada.
            Si la conocés, podés pedirle que la comparta directamente.
          </p>
          <p className="text-xs text-gray-300 mt-6 font-mono">traza.app · Performance Intelligence</p>
        </div>
      </div>
    )
  }
  const empresaNombreActual = (personaActual as any).empresa?.nombre ?? null

  // Traer objetivos de la empresa actual
  const { data: objetivosActuales } = await supabase
    .from('objetivos')
    .select('*')
    .eq('persona_id', personaActual.id)
    .order('fecha_limite', { ascending: true })

  const objsActuales = (objetivosActuales ?? []) as Objetivo[]

  // Avances (necesarios para proactividad en el índice v3)
  const { data: avancesRaw } = await supabase
    .from('objetivo_avances')
    .select('*')
    .in('objetivo_id', objsActuales.length > 0 ? objsActuales.map(o => o.id) : ['00000000-0000-0000-0000-000000000000'])

  // Validaciones externas (fetched before this point, but need them for score)
  const { data: validacionesExternasParaScore } = await supabase
    .from('validaciones_externas')
    .select('*')
    .in('objetivo_id', objsActuales.length > 0 ? objsActuales.map(o => o.id) : ['00000000-0000-0000-0000-000000000000'])

  // ── Score global: combinamos TODOS los objetivos y avances de toda la trayectoria ──
  // Esto garantiza que el score sea el mismo en credencial, dashboard y PDF.
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

  // Acumuladores globales (todos los objetivos y avances de toda la carrera)
  let todosObjsGlobal: Objetivo[] = []
  let todosAvancesGlobal: any[]   = []
  let todasValExtGlobal: any[]    = validacionesExternasParaScore ?? []

  let completadosGlobal = 0
  let positivosGlobal   = 0
  let parcialesGlobal   = 0
  let negativosGlobal   = 0

  for (const p of todasLasPersonas) {
    const [{ data: objs }, { data: avs }] = await Promise.all([
      supabase.from('objetivos').select('*').eq('persona_id', p.id),
      supabase.from('objetivo_avances').select('*').in(
        'objetivo_id',
        (await supabase.from('objetivos').select('id').eq('persona_id', p.id)).data?.map((o: any) => o.id) ?? ['00000000-0000-0000-0000-000000000000']
      ),
    ])

    const listaObjs  = (objs ?? []) as Objetivo[]
    const listaAvs   = avs ?? []
    // Score por empresa (con sus propios avances)
    const indice = calcularIndiceTraza(listaObjs, listaAvs)

    todosObjsGlobal   = [...todosObjsGlobal, ...listaObjs]
    todosAvancesGlobal = [...todosAvancesGlobal, ...listaAvs]

    completadosGlobal += indice.completados
    positivosGlobal   += indice.positivos
    parcialesGlobal   += indice.parciales
    negativosGlobal   += indice.negativos

    historialEmpresas.push({
      personaId:      p.id,
      empresa:        (p as any).empresa?.nombre ?? 'Empresa desconocida',
      rubro:          (p as any).empresa?.rubro ?? null,
      cargo:          p.cargo,
      area:           p.area,
      inicio:         p.fecha_inicio_empleo ?? null,
      fin:            p.fecha_fin_empleo ?? null,
      activo:         p.empleo_activo === true,
      totalObj:       listaObjs.length,
      completadosObj: indice.completados,
      positivosObj:   indice.positivos,
      parcialesObj:   indice.parciales,
      negativosObj:   indice.negativos,
      score:          indice.score,
    })
  }

  // Índice global: una sola pasada con todos los datos de la carrera
  const indiceGlobal = calcularIndiceTraza(todosObjsGlobal, todosAvancesGlobal, todasValExtGlobal)
  const { score: scoreGlobal, badge, nivel: nivelGlobal, cumplimiento, total: totalObjGlobal,
          completados, positivos, parciales, negativos, moduloA, moduloB, moduloC } = indiceGlobal

  // Compatibilidad con el resto del código
  const indiceActual = indiceGlobal
  const scoreDisplay = scoreGlobal

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
          max_tokens: 350,
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

  // Validaciones externas (de todos los objetivos de la persona actual)
  const { data: validacionesExternas } = await supabase
    .from('validaciones_externas')
    .select('*')
    .in('objetivo_id', objsActuales.length > 0 ? objsActuales.map(o => o.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  const valExt = validacionesExternas ?? []

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

  const scoreColor = scoreDisplay >= 85 ? '#16a34a' : scoreDisplay >= 65 ? '#3350D0' : scoreDisplay >= 40 ? '#d97706' : '#9ca3af'
  const scoreBg    = scoreDisplay >= 85 ? '#dcfce7' : scoreDisplay >= 65 ? '#EDEFFD' : scoreDisplay >= 40 ? '#fef3c7' : '#F1F5F9'

  const ahora = formatFechaLarga(new Date().toISOString())

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)' }} className="px-5 pt-6 pb-10">
        <div className="max-w-xl mx-auto">

          {/* Barra superior */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-base tracking-tight">traza</span>
              <span className="text-xs font-medium" style={{ color: '#8899EE' }}>· Credencial verificada</span>
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
              {todasLasPersonas.length} empresa{todasLasPersonas.length !== 1 ? 's' : ''} en traza
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

        {/* Resumen cuantitativo verificado */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} style={{ color: '#3350D0' }} />
            <span className="text-sm font-semibold text-gray-900">Desempeño verificado</span>
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: scoreBg, color: scoreColor }}>
              {scoreDisplay}/100 · {badge}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { val: totalObjGlobal,    label: 'Objetivos\ntotales' },
              { val: completadosGlobal, label: 'Completados\nverificados' },
              { val: positivosGlobal,   label: 'Validados\npositivamente' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center rounded-xl py-3 px-2" style={{ background: '#F8FAFC' }}>
                <p className="text-2xl font-black" style={{ color: '#1C2B90' }}>{val}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5 whitespace-pre-line">{label}</p>
              </div>
            ))}
          </div>
          {/* Barra resumen */}
          {totalValidadosActuales > 0 && (
            <div>
              <div className="flex h-2 rounded-full overflow-hidden mb-2" style={{ gap: 2 }}>
                {positivos > 0 && <div style={{ flex: positivos, backgroundColor: '#3350D0', borderRadius: 9999 }} />}
                {parciales > 0 && <div style={{ flex: parciales, backgroundColor: '#7c3aed' }} />}
                {negativos > 0 && <div style={{ flex: negativos, backgroundColor: '#dc2626', borderRadius: 9999 }} />}
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { n: positivos, label: 'Positivo',         color: '#3350D0' },
                  { n: parciales, label: 'Con observaciones', color: '#7c3aed' },
                  { n: negativos, label: 'A reforzar',        color: '#dc2626' },
                ].filter(x => x.n > 0).map(({ n, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-500">{label} <span className="font-semibold text-gray-700">{n}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Datos validados por supervisores · {todasLasPersonas.length} empresa{todasLasPersonas.length !== 1 ? 's' : ''} registradas en TRAZA
          </p>
        </div>

        {/* Narrativa IA */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: '#3350D0' }} strokeWidth={1.75} />
            <h2 className="font-semibold text-gray-900 text-sm">Trayectoria profesional</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: narrativaIA ? '#ede9fe' : '#F1F5F9', color: narrativaIA ? '#7c3aed' : '#9ca3af' }}>
              {narrativaIA ? 'Análisis IA' : 'Resumen automático'}
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm">{narrativaFinal}</p>
        </div>

        {/* Trayectoria por empresa */}
        {todasLasPersonas.length > 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={14} style={{ color: '#3350D0' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Historial de empresas</h2>
              <span className="ml-auto text-xs text-gray-400">{todasLasPersonas.length} empleos</span>
            </div>

            <div className="space-y-4">
              {historialEmpresas.map((h, i) => {
                const pct = h.totalObj > 0 ? Math.round((h.positivosObj / h.totalObj) * 100) : 0
                const dotColor = h.activo ? '#3350D0' : '#9ca3af'
                return (
                  <div key={h.personaId} className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: h.activo ? '#3350D0' : '#d1d5db', border: h.activo ? '2px solid #BBC5F7' : 'none' }} />
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
                            style={{ backgroundColor: '#EDEFFD', color: '#3350D0' }}>
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
                              style={{ width: `${h.score}%`, backgroundColor: h.activo ? '#3350D0' : '#9ca3af' }} />
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



        {/* Validaciones externas */}
        {valExt.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} style={{ color: '#3350D0' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Validaciones externas</h2>
              <span className="ml-auto text-xs text-gray-400">{valExt.length} evaluación{valExt.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="space-y-3">
              {valExt.map((v: any) => {
                const colores: Record<string, { color: string; bg: string; label: string }> = {
                  'De acuerdo':               { color: '#16a34a', bg: '#f0fdf4', label: 'De acuerdo'               },
                  'Parcialmente de acuerdo':  { color: '#d97706', bg: '#fffbeb', label: 'Parcialmente de acuerdo'  },
                  'En desacuerdo':            { color: '#dc2626', bg: '#fef2f2', label: 'En desacuerdo'            },
                }
                const c = colores[v.calificacion] ?? colores['De acuerdo']
                const obj = objsActuales.find(o => o.id === v.objetivo_id)
                const nivel = v.nivel_confianza ?? (v.dominio_publico ? (
                  ['gmail.com','hotmail.com','yahoo.com','outlook.com','live.com','icloud.com'].includes(v.dominio_publico) ? 'personal' : 'corporativo'
                ) : 'sin_email')
                return (
                  <div key={v.id} className="rounded-xl border p-3.5" style={{ borderColor: c.color + '30', backgroundColor: c.bg }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{v.nombre}</p>
                        {(v.cargo || v.empresa) && (
                          <p className="text-xs text-gray-500">
                            {[v.cargo, v.empresa].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {/* Badge de confianza */}
                        <div className="flex items-center gap-1 mt-1">
                          {nivel === 'corporativo' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                              <ShieldCheck size={10} />
                              {v.dominio_publico ? `@${v.dominio_publico}` : 'Email corporativo'}
                            </span>
                          ) : nivel === 'personal' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: '#fef9c3', color: '#a16207' }}>
                              <ShieldAlert size={10} />
                              Email personal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}>
                              Sin email verificado
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: c.color, backgroundColor: c.color + '15' }}>
                        {c.label}
                      </span>
                    </div>
                    {obj && (
                      <p className="text-xs text-gray-400 mb-1 mt-1.5">Sobre: {obj.titulo}</p>
                    )}
                    {v.comentario && (
                      <p className="text-xs text-gray-600 mt-1.5 italic">"{v.comentario}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(v.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: '#6b7280' }} />
            <p className="text-xs font-medium text-gray-500">
              Verificado por <span className="font-bold text-gray-700">traza</span> · Performance Intelligence
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
