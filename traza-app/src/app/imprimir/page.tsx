'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, formatFecha } from '@/lib/traza'
import type { Objetivo } from '@/types'

/* ══════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════ */
const B    = '#1C2B90'   // brand navy
const P    = '#3350D0'   // primary blue
const L    = '#EDEFFD'   // light blue
const GN   = '#16a34a'   // green
const AM   = '#d97706'   // amber
const RD   = '#dc2626'   // red
const INK  = '#0F172A'
const SLT  = '#334155'   // slate
const MID  = '#475569'
const MUT  = '#64748B'
const SUB  = '#94A3B8'
const BRD  = '#E2E8F0'
const SUR  = '#F8FAFC'
const FD   = "'Plus Jakarta Sans', system-ui, sans-serif"
const FB   = "Inter, system-ui, sans-serif"

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function sCol(s: number) {
  if (s >= 85) return GN
  if (s >= 65) return P
  if (s >= 40) return AM
  return MUT
}

function mkBadge(nivel: string) {
  const m: Record<string, { label: string; bg: string; color: string; desc: string }> = {
    'Élite':         { label: 'Élite',         bg: '#dcfce7', color: GN, desc: 'Top 5% · Desempeño excepcional' },
    'Avanzado':      { label: 'Avanzado',       bg: L,         color: P,  desc: 'Alto desempeño consistente' },
    'En desarrollo': { label: 'En desarrollo',  bg: '#fef3c7', color: AM, desc: 'Desempeño en crecimiento' },
  }
  return m[nivel] ?? { label: 'Inicial', bg: SUR, color: MUT, desc: 'Perfil en construcción' }
}

function fPer(ini: string | null, fin: string | null) {
  if (!ini) return '—'
  const f = (d: string) => new Date(d).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
  return fin ? `${f(ini)} – ${f(fin)}` : `${f(ini)} – Actualidad`
}

function qKey(fecha: string) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
}
function qLbl(k: string) {
  const [y, q] = k.split('-')
  return `${{ Q1: 'E–M', Q2: 'A–J', Q3: 'J–S', Q4: 'O–D' }[q] ?? q} '${y.slice(2)}`
}

/* ══════════════════════════════════════════════════
   SVG · SCORE RING
══════════════════════════════════════════════════ */
function Ring({ score, color, size = 120, sw = 10 }: {
  score: number; color: string; size?: number; sw?: number
}) {
  const r = (size - sw * 2) / 2 - 2
  const c = 2 * Math.PI * r
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={`${color}18`} strokeWidth={sw} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 4} textAnchor="middle" fontSize={size * 0.24} fontWeight="900"
        fill={color} fontFamily={FD}>{score}</text>
      <text x={cx} y={cx + size * 0.15} textAnchor="middle" fontSize={size * 0.09}
        fill={`${color}80`} fontFamily={FB}>/100</text>
    </svg>
  )
}

/* ══════════════════════════════════════════════════
   SVG · RADAR CHART
══════════════════════════════════════════════════ */
function Radar({ data, size = 220 }: {
  data: Array<{ label: string; value: number }>; size?: number
}) {
  const n = data.length, cx = size / 2, cy = size / 2
  const r = size * 0.31, lr = r + 26
  const ang = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2
  const ring = (p: number) =>
    data.map((_, i) => `${cx + r * p * Math.cos(ang(i))},${cy + r * p * Math.sin(ang(i))}`).join(' ')
  const pts = data.map((d, i) =>
    `${cx + r * (d.value / 100) * Math.cos(ang(i))},${cy + r * (d.value / 100) * Math.sin(ang(i))}`
  ).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((p, i) =>
        <polygon key={i} points={ring(p)} fill="none" stroke={BRD} strokeWidth="1" />
      )}
      {data.map((_, i) =>
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(ang(i))} y2={cy + r * Math.sin(ang(i))}
          stroke={BRD} strokeWidth="1" />
      )}
      <polygon points={pts} fill={`${P}15`} stroke={P} strokeWidth="2" />
      {data.map((d, i) => {
        const a = ang(i), v = d.value / 100
        return <circle key={i} cx={cx + r * v * Math.cos(a)} cy={cy + r * v * Math.sin(a)}
          r="4" fill={P} stroke="white" strokeWidth="2" />
      })}
      {data.map((d, i) => {
        const a = ang(i), lx = cx + lr * Math.cos(a), ly = cy + lr * Math.sin(a)
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="8.5" fontWeight="600" fill={SLT} fontFamily={FB}>
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

/* ══════════════════════════════════════════════════
   SVG · ACTIVITY HEATMAP
══════════════════════════════════════════════════ */
function Heatmap({ avances }: { avances: any[] }) {
  const now = new Date()
  const byWeek: Record<string, number> = {}
  avances.forEach(a => {
    const d = new Date(a.creado_en)
    const ys = new Date(d.getFullYear(), 0, 1)
    const wk = Math.floor((d.getTime() - ys.getTime()) / (7 * 86400000))
    const k = `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`
    byWeek[k] = (byWeek[k] || 0) + 1
  })
  const weeks = Array.from({ length: 52 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (51 - i) * 7)
    const ys = new Date(d.getFullYear(), 0, 1)
    const wk = Math.floor((d.getTime() - ys.getTime()) / (7 * 86400000))
    return byWeek[`${d.getFullYear()}-W${String(wk).padStart(2, '0')}`] ?? 0
  })
  const max = Math.max(...weeks, 1)
  return (
    <div>
      <div style={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
        {weeks.map((cnt, i) => {
          const p = cnt / max
          const bg = cnt === 0 ? BRD : p < 0.33 ? `${P}35` : p < 0.67 ? `${P}70` : P
          return <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: bg }} />
        })}
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
        <span style={{ fontSize: 7.5, color: SUB }}>Menos</span>
        {[BRD, `${P}35`, `${P}70`, P].map((bg, i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: 1.5, background: bg }} />
        ))}
        <span style={{ fontSize: 7.5, color: SUB }}>Más actividad</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   SVG · QUARTERLY BARS
══════════════════════════════════════════════════ */
function QBars({ objetivos }: { objetivos: Objetivo[] }) {
  const byQ: Record<string, { total: number; comp: number }> = {}
  objetivos.forEach(o => {
    if (!o.fecha_limite) return
    const k = qKey(o.fecha_limite)
    if (!byQ[k]) byQ[k] = { total: 0, comp: 0 }
    byQ[k].total++
    if (o.estado === 'Completado') byQ[k].comp++
  })
  const qs = Object.keys(byQ).sort().slice(-8)
  if (!qs.length) return <p style={{ fontSize: 10, color: SUB }}>Sin datos de objetivos con fecha.</p>
  const mx = Math.max(...qs.map(k => byQ[k].total), 1)
  const H = 50, bw = Math.max(10, Math.floor(240 / qs.length) - 4)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
      {qs.map(q => {
        const d = byQ[q]
        const th = Math.round((d.total / mx) * H)
        const ch = d.total ? Math.round((d.comp / d.total) * th) : 0
        return (
          <div key={q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: bw, height: th, borderRadius: '3px 3px 0 0',
              background: BRD, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: ch, background: P, borderRadius: '2px 2px 0 0' }} />
            </div>
            <span style={{ fontSize: 7, color: SUB }}>{qLbl(q)}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   UI · SHARED COMPONENTS
══════════════════════════════════════════════════ */
function SecLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 8, fontWeight: 700, color: SUB, letterSpacing: '0.12em',
      textTransform: 'uppercase', fontFamily: FB, marginBottom: 8 }}>
      {children}
    </p>
  )
}

function PF({ nombre, trazaId, page }: { nombre: string; trazaId?: string; page: number }) {
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${BRD}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 7.5, color: SUB, fontFamily: FB }}>traza · Career Intelligence Report</span>
      <span style={{ fontSize: 7.5, color: SUB, fontFamily: FB }}>{nombre}</span>
      <span style={{ fontSize: 7.5, color: SUB, fontFamily: FB }}>
        {trazaId ? `${trazaId} · ` : ''}pág. {page}
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function ImprimirPage() {
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [narrativa,   setNarrativa]   = useState('')
  const [downloading, setDownloading] = useState(false)
  const [data, setData] = useState<{
    persona:              any
    objetivos:            Objetivo[]
    avances:              any[]
    validacionesExternas: any[]
    reconocimientos:      any[]
    empresas:             Array<{ persona: any; objetivos: Objetivo[]; avances: any[] }>
  } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); setLoading(false); return }

      const { data: porUserId } = await supabase
        .from('personas').select('*, empresa:empresas(nombre, rubro)').eq('user_id', user.id)
      if (!porUserId || porUserId.length === 0) {
        setError('No se encontró el perfil.'); setLoading(false); return
      }
      const persona = porUserId.find((p: any) => p.empleo_activo !== false) ?? porUserId[0]

      let todasPersonas: any[] = porUserId
      if (persona.traza_id) {
        const { data: porTrazaId } = await supabase
          .from('personas').select('*, empresa:empresas(nombre, rubro)')
          .eq('traza_id', persona.traza_id)
          .order('fecha_inicio_empleo', { ascending: false })
        if (porTrazaId && porTrazaId.length > 0) {
          const merged = [...porTrazaId]
          porUserId.forEach((p: any) => { if (!merged.find((x: any) => x.id === p.id)) merged.push(p) })
          todasPersonas = merged.sort((a: any, b: any) =>
            (b.fecha_inicio_empleo ?? '').localeCompare(a.fecha_inicio_empleo ?? ''))
        }
      }

      let todosObjs: Objetivo[] = []
      let todosAvances: any[] = []
      const empresas: Array<{ persona: any; objetivos: Objetivo[]; avances: any[] }> = []

      for (const p of todasPersonas) {
        const [{ data: objRaw }, { data: avRaw }] = await Promise.all([
          supabase.from('objetivos').select('*').eq('persona_id', p.id).order('created_at', { ascending: false }),
          supabase.from('objetivo_avances').select('*').eq('persona_id', p.id),
        ])
        const objs = (objRaw ?? []) as Objetivo[]
        const avs  = avRaw ?? []
        todosObjs    = [...todosObjs, ...objs]
        todosAvances = [...todosAvances, ...avs]
        empresas.push({ persona: p, objetivos: objs, avances: avs })
      }

      const allIds = todosObjs.length > 0
        ? todosObjs.map(o => o.id)
        : ['00000000-0000-0000-0000-000000000000']

      const [{ data: valExtRaw }, { data: reconRaw }] = await Promise.all([
        supabase.from('validaciones_externas').select('*').in('objetivo_id', allIds).order('created_at', { ascending: false }),
        supabase.from('reconocimientos').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }),
      ])

      setData({ persona, objetivos: todosObjs, avances: todosAvances,
        validacionesExternas: valExtRaw ?? [], reconocimientos: reconRaw ?? [], empresas })
      setLoading(false)

      if (todosObjs.length > 0) {
        const idx = calcularIndiceTraza(todosObjs, todosAvances, valExtRaw ?? [], persona.supervisor_verificado ?? true)
        try {
          const res = await fetch('/api/narrativa', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: persona.nombre, apellido: persona.apellido,
              cargo: persona.cargo, area: persona.area,
              score: idx.score, moduloA: idx.moduloA, moduloB: idx.moduloB, moduloC: idx.moduloC,
              cumplimiento: idx.cumplimiento, total: idx.total,
              completados: idx.completados, positivos: idx.positivos,
            }),
          })
          const json = await res.json()
          if (json.narrativa) setNarrativa(json.narrativa)
        } catch { /* sin narrativa */ }
      }
    }
    load()
  }, [])

  /* ── Download PDF ── */
  async function handleDownload() {
    setDownloading(true)
    try {
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          s.onload = () => resolve(); s.onerror = () => reject()
          document.head.appendChild(s)
        })
      }
      const element = document.getElementById('a4-document')
      const nm = data?.persona
      const filename = `career-intelligence-${nm?.nombre ?? ''}-${nm?.apellido ?? ''}.pdf`
        .toLowerCase().replace(/\s+/g, '-')
      await (window as any).html2pdf()
        .set({
          margin: 0, filename,
          image:       { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794, scrollY: 0 },
          jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:   { mode: 'css', before: '.pb' },
        })
        .from(element)
        .toPdf()
        .get('pdf')
        .then(function(pdf: any) {
          const total = pdf.internal.getNumberOfPages()
          if (total > 1) {
            const lp = pdf.internal.pages[total]
            if (!lp || lp.length < 15) pdf.deletePage(total)
          }
        })
        .save()
    } catch { window.print() }
    finally { setDownloading(false) }
  }

  /* ── States ── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16, fontFamily: FB, background: SUR }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: B,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: FD }}>t</span>
      </div>
      <p style={{ color: MUT, fontSize: 13 }}>Preparando Career Intelligence Report…</p>
    </div>
  )
  if (error || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: FB, color: MUT }}>
      {error || 'Error al cargar datos.'}
    </div>
  )

  /* ══════════════════════════════════════════════════
     DATA & CALCULATIONS
  ══════════════════════════════════════════════════ */
  const { persona, objetivos, avances, validacionesExternas, reconocimientos, empresas } = data
  const supVerif = persona.supervisor_verificado ?? true
  const indice   = calcularIndiceTraza(objetivos, avances, validacionesExternas, supVerif)
  const col      = sCol(indice.score)
  const bdg      = mkBadge(indice.nivel)
  const hoy      = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const nombre   = `${persona.nombre} ${persona.apellido}`

  const completados = objetivos.filter(o => o.estado === 'Completado')
  const validados   = objetivos.filter(o => o.validacion === 'De acuerdo')
  const parciales   = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo')
  const negativos   = objetivos.filter(o => o.validacion === 'En desacuerdo')
  const valConf     = validacionesExternas.filter((v: any) => v.confirmado !== false)
  const conFeedback = objetivos.filter(o => o.comentario_supervisor?.trim())

  const iCumpl  = Math.round((completados.length / Math.max(objetivos.length, 1)) * 100)
  const iConf   = completados.length > 0 ? Math.round((validados.length / completados.length) * 100) : 0
  const iMejora = Math.round(Math.max(0, 1 - negativos.length / Math.max(completados.length, 1)) * 100)
  const iCompr  = Math.min(100, Math.round((avances.length / Math.max(objetivos.length, 1)) / 5 * 100))

  const fechas   = empresas.map(e => e.persona.fecha_inicio_empleo).filter(Boolean).sort()
  const fechaMin = fechas[0] ?? null
  const antiguedad = fechaMin
    ? (() => {
        const meses = Math.floor((Date.now() - new Date(fechaMin).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
        return meses >= 12 ? `${Math.floor(meses / 12)} año${Math.floor(meses / 12) !== 1 ? 's' : ''}` : `${meses} mes${meses !== 1 ? 'es' : ''}`
      })() : null

  const byWeekSet = new Set(avances.map((a: any) => {
    const d = new Date(a.creado_en)
    return `${d.getFullYear()}-W${Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000))}`
  }))
  const semanasActivas = byWeekSet.size

  const empActual = empresas.find(e => e.persona.empleo_activo === true) ?? empresas[0]
  const empNombre = empActual?.persona?.empresa?.nombre ?? empActual?.persona?.empresa_actual_nombre ?? '—'

  // Fortalezas sustentadas en datos
  const fortalezas: Array<{ text: string; evidence: string }> = []
  if (indice.moduloB >= 80) fortalezas.push({ text: 'Alta capacidad de cumplimiento y gestión de plazos', evidence: `${iCumpl}% tasa de cumplimiento · ${completados.length} objetivos completados` })
  if (indice.moduloA >= 75) fortalezas.push({ text: 'Resultados consistentemente validados por el management', evidence: `${validados.length} de ${completados.length} completados con validación positiva` })
  if (indice.moduloC >= 70) fortalezas.push({ text: 'Proactividad y consistencia en documentación de avances', evidence: `${semanasActivas} semanas activas · ${avances.length} avances registrados` })
  if (iConf >= 80) fortalezas.push({ text: 'Calidad de ejecución — alta tasa de aprobación', evidence: `${iConf}% de validación positiva sobre lo completado` })
  if (reconocimientos.length >= 2) fortalezas.push({ text: 'Reconocimiento formal reiterado por pares y liderazgo', evidence: `${reconocimientos.length} reconocimientos recibidos en TRAZA` })
  if (valConf.length >= 1) fortalezas.push({ text: 'Validación externa verificada por terceros independientes', evidence: `${valConf.length} validación${valConf.length !== 1 ? 'es' : ''} de terceros confirmada${valConf.length !== 1 ? 's' : ''}` })
  if (fortalezas.length === 0) fortalezas.push({ text: 'Perfil profesional en construcción activa', evidence: 'Datos iniciales registrados en TRAZA' })

  // Áreas de desarrollo
  const desarrollo: Array<{ text: string; action: string }> = []
  if (indice.moduloC < 50) desarrollo.push({ text: 'Regularidad en documentación semanal de avances', action: 'Establecer ritual semanal de registro en TRAZA' })
  if (indice.moduloA < 65) desarrollo.push({ text: 'Alineación con expectativas del management', action: 'Aumentar frecuencia de check-ins con el supervisor' })
  if (indice.alineacion < 60) desarrollo.push({ text: 'Coherencia entre autoevaluación y validación externa', action: 'Solicitar feedback estructurado más frecuente' })
  if (iCumpl < 70) desarrollo.push({ text: 'Tasa de cierre de objetivos dentro del plazo acordado', action: 'Reforzar planificación y gestión de fechas límite' })
  if (desarrollo.length === 0) desarrollo.push({ text: 'Sin áreas críticas identificadas con los datos actuales', action: 'Mantener consistencia y buscar desafíos de mayor complejidad' })

  // Módulos del índice
  const modulos = [
    { id: 'A', label: 'Validación de Superiores', pct: 35, val: indice.moduloA,      desc: 'Calificaciones de supervisor ponderadas por nivel de confianza verificado' },
    { id: 'B', label: 'Cumplimiento',             pct: 25, val: indice.moduloB,      desc: 'Objetivos con fecha vencida completados exitosamente sobre el total' },
    { id: 'C', label: 'Regularidad',              pct: 20, val: indice.moduloC,      desc: 'Constancia semanal de avances registrados en la plataforma' },
    { id: 'D', label: 'Alineación',               pct: 10, val: indice.alineacion,   desc: 'Coherencia entre autoevaluación del colaborador y validación del supervisor' },
    { id: 'E', label: 'Proactividad',             pct: 10, val: indice.proactividad, desc: 'Proporción de objetivos propuestos por iniciativa propia del profesional' },
  ]

  // Competencias para radar
  const competencias = [
    { label: 'Validaciones',  value: indice.moduloA },
    { label: 'Cumplimiento',  value: indice.moduloB },
    { label: 'Regularidad',   value: indice.moduloC },
    { label: 'Alineación',    value: indice.alineacion },
    { label: 'Proactividad',  value: indice.proactividad },
    { label: 'Confiabilidad', value: iConf },
  ]

  // AI heurísticas: estilo profesional
  const estiloPerfil = (() => {
    if (indice.moduloA >= 75 && indice.moduloB >= 75) return 'Ejecutor de alto rendimiento — orientado a resultados con fuerte capacidad de cierre y validación de impacto.'
    if (indice.moduloC >= 70 && indice.alineacion >= 70) return 'Colaborador autónomo y alineado — documenta activamente su trabajo y opera en sintonía con las expectativas del equipo.'
    if (indice.moduloB >= 80) return 'Profesional estructurado y confiable — alta capacidad de cumplimiento y gestión sistemática de compromisos.'
    if (indice.moduloA >= 70) return 'Generador de resultados — enfocado en el impacto y la validación objetiva de su trabajo por parte del management.'
    return 'Profesional en desarrollo activo — construyendo su historial verificado dentro de la plataforma TRAZA.'
  })()

  const proximosRoles = (() => {
    const cargo = persona.cargo ?? ''
    const roles: string[] = []
    if (indice.score >= 80 && cargo) {
      roles.push(`Senior ${cargo}`)
      const last = cargo.split(' ').pop() ?? cargo
      if (last.length > 3) roles.push(`Lead de ${last}`)
    } else if (indice.score >= 65 && cargo) {
      roles.push(`${cargo} Sr.`)
      if (persona.area) roles.push(`Especialista en ${persona.area}`)
    }
    if (reconocimientos.length >= 2 || valConf.length >= 2) {
      roles.push('Referente técnico / Subject Matter Expert')
    }
    if (roles.length === 0) roles.push(`${cargo || 'Rol actual'} con mayor nivel de complejidad`)
    return roles.slice(0, 4)
  })()

  // Recomendaciones de desarrollo
  const recomendaciones: Array<{ titulo: string; desc: string; area: string }> = []
  if (indice.moduloC < 50) recomendaciones.push({ titulo: 'Documentación sistemática', desc: 'Establecer un ritual semanal de registro de avances para aumentar la consistencia medida en TRAZA.', area: 'Hábito profesional' })
  if (indice.moduloA < 65) recomendaciones.push({ titulo: 'Alineación con management', desc: 'Aumentar la frecuencia de check-ins con el supervisor para asegurar validación temprana de resultados.', area: 'Gestión de relaciones' })
  if (iCumpl < 75) recomendaciones.push({ titulo: 'Planificación de cierre', desc: 'Incorporar revisiones de fecha límite en la gestión semanal para mejorar la tasa de cumplimiento.', area: 'Gestión de tiempo' })
  if (indice.proactividad < 30) recomendaciones.push({ titulo: 'Iniciativa y liderazgo propio', desc: 'Proponer más objetivos por cuenta propia demuestra ownership y acelera el crecimiento profesional.', area: 'Proactividad' })
  // Siempre agregar una recomendación de crecimiento
  recomendaciones.push({ titulo: 'Desafíos de mayor complejidad', desc: 'El perfil actual sugiere capacidad para asumir objetivos de mayor impacto, alcance y visibilidad organizacional.', area: 'Crecimiento profesional' })

  const hasEvidence = reconocimientos.length > 0 || valConf.length > 0
  const verificationPage = hasEvidence ? 8 : 7

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #D1D5E8; font-family: ${FB}; }
        @media print {
          #toolbar { display: none !important; }
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
          .pb { page-break-before: always; }
          .nb { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div id="toolbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: B, padding: '10px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(28,43,144,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: FD }}>t</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: FD }}>traza</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Career Intelligence Report · {nombre}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '6px 16px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
          }}>← Volver</button>
          <button onClick={handleDownload} disabled={downloading} style={{
            background: '#fff', border: 'none', color: B,
            borderRadius: 8, padding: '7px 20px', fontSize: 12, fontWeight: 700,
            cursor: downloading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: downloading ? 0.7 : 1,
          }}>{downloading ? '⏳ Generando…' : '⬇ Descargar PDF'}</button>
        </div>
      </div>

      {/* ══ A4 Document ══ */}
      <div id="a4-document" style={{ width: 794, margin: '56px auto 48px', fontFamily: FB, boxShadow: '0 12px 60px rgba(0,0,0,0.18)' }}>

        {/* ════════════════════════════════════
            PÁG 1 · PORTADA
        ════════════════════════════════════ */}
        <div style={{ background: '#fff', minHeight: 1123, display: 'flex', position: 'relative' }}>
          {/* Left accent bar */}
          <div style={{ width: 10, background: B, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 60px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 80 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: B,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: FD }}>t</span>
                </div>
                <div>
                  <p style={{ color: INK, fontWeight: 800, fontSize: 16, fontFamily: FD, lineHeight: 1 }}>traza</p>
                  <p style={{ color: SUB, fontSize: 8.5, letterSpacing: '0.08em', marginTop: 1 }}>Performance Intelligence</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: SUB, fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tipo de documento</p>
                <p style={{ color: MID, fontSize: 11, fontWeight: 600, marginTop: 2 }}>Career Intelligence Report</p>
              </div>
            </div>

            {/* Level chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              background: bdg.bg, borderRadius: 20, padding: '5px 14px', marginBottom: 20, alignSelf: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: bdg.color }} />
              <span style={{ color: bdg.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
                {bdg.label.toUpperCase()} · {bdg.desc}
              </span>
            </div>

            {/* Name */}
            <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 54, lineHeight: 1.0,
              letterSpacing: '-0.02em', color: INK, marginBottom: 16 }}>
              {persona.nombre}<br />{persona.apellido}
            </h1>
            <p style={{ fontSize: 18, fontWeight: 600, color: SLT, marginBottom: 5 }}>{persona.cargo ?? '—'}</p>
            <p style={{ fontSize: 13, color: MUT }}>
              {[empNombre, persona.area].filter(Boolean).join(' · ')}
            </p>

            {/* Score hero */}
            <div style={{ marginTop: 40, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <p style={{ fontSize: 8, color: SUB, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 4, fontFamily: FB }}>Índice TRAZA Global</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 72, fontWeight: 900, color: col,
                    fontFamily: FD, lineHeight: 1, letterSpacing: '-0.03em' }}>{indice.score}</span>
                  <span style={{ fontSize: 20, color: SUB, fontWeight: 400 }}>/100</span>
                </div>
              </div>
              <div style={{ width: 1, height: 64, background: BRD }} />
              <Ring score={indice.score} color={col} size={96} sw={8} />
            </div>

            {/* Identity grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: `1px solid ${BRD}`, borderLeft: `1px solid ${BRD}` }}>
              {[
                { label: 'Empresas registradas', value: String(empresas.length) },
                { label: 'Objetivos totales',    value: String(objetivos.length) },
                { label: 'Completados',           value: String(completados.length) },
                { label: 'Antigüedad en TRAZA',  value: antiguedad ?? `${avances.length} avances` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px', borderRight: `1px solid ${BRD}`, borderBottom: `1px solid ${BRD}` }}>
                  <p style={{ fontSize: 8, color: SUB, fontWeight: 600, letterSpacing: '0.05em',
                    textTransform: 'uppercase', marginBottom: 6, fontFamily: FB }}>{m.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: FD }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Verification footer */}
            <div style={{ paddingTop: 24, borderTop: `1px solid ${BRD}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                {persona.traza_id && (
                  <>
                    <p style={{ fontSize: 7.5, color: SUB, letterSpacing: '0.1em',
                      textTransform: 'uppercase', marginBottom: 4, fontFamily: FB }}>ID de verificación</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: B,
                      letterSpacing: '0.06em', fontFamily: FD }}>{persona.traza_id}</p>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: MUT }}>Generado el {hoy}</p>
                {persona.traza_id && (
                  <p style={{ fontSize: 8.5, color: SUB, marginTop: 2 }}>traza.app/p/{persona.traza_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════
            PÁG 2 · EXECUTIVE BRIEFING
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <SecLabel>Executive Briefing · Página 2</SecLabel>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 36, lineHeight: 1.15 }}>
            Resumen para decision makers
          </h2>

          {/* 3 key signals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            borderTop: `1px solid ${BRD}`, borderLeft: `1px solid ${BRD}`, marginBottom: 36 }} className="nb">
            {[
              { label: 'Nivel de desempeño', value: bdg.label, sub: bdg.desc, color: bdg.color, bg: bdg.bg },
              { label: 'Índice TRAZA',        value: `${indice.score}/100`, sub: `Basado en ${objetivos.length} objetivos registrados`, color: col, bg: '#fff' },
              { label: 'Confiabilidad',        value: `${iConf}%`, sub: `${validados.length} validados positivamente de ${completados.length} completados`, color: iConf >= 70 ? GN : iConf >= 50 ? AM : MUT, bg: '#fff' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: `1px solid ${BRD}`,
                borderBottom: `1px solid ${BRD}`, background: s.bg }}>
                <p style={{ fontSize: 7.5, color: SUB, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 8, fontFamily: FB }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: s.color,
                  fontFamily: FD, lineHeight: 1, marginBottom: 5 }}>{s.value}</p>
                <p style={{ fontSize: 9, color: MUT, lineHeight: 1.4 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* AI Narrative */}
          {narrativa && (
            <div style={{ marginBottom: 32, padding: '22px 26px', background: L,
              borderRadius: 12, borderLeft: `3px solid ${P}` }} className="nb">
              <p style={{ fontSize: 8.5, fontWeight: 700, color: P, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 10 }}>✦ Análisis generado por inteligencia artificial</p>
              <p style={{ fontSize: 12.5, color: SLT, lineHeight: 1.85, fontStyle: 'italic' }}>{narrativa}</p>
            </div>
          )}

          {/* Strengths + Development */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, flex: 1 }} className="nb">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: GN }} />
                <p style={{ fontSize: 9, fontWeight: 700, color: GN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Fortalezas sustentadas por datos
                </p>
              </div>
              {fortalezas.slice(0, 4).map((f, i) => (
                <div key={i} style={{ marginBottom: 18, paddingBottom: 18,
                  borderBottom: i < Math.min(fortalezas.length, 4) - 1 ? `1px solid ${SUR}` : 'none' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: INK, lineHeight: 1.4, marginBottom: 4 }}>{f.text}</p>
                  <p style={{ fontSize: 9, color: MUT, lineHeight: 1.4 }}>↳ {f.evidence}</p>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: AM }} />
                <p style={{ fontSize: 9, fontWeight: 700, color: AM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Áreas de desarrollo prioritarias
                </p>
              </div>
              {desarrollo.slice(0, 4).map((d, i) => (
                <div key={i} style={{ marginBottom: 18, paddingBottom: 18,
                  borderBottom: i < Math.min(desarrollo.length, 4) - 1 ? `1px solid ${SUR}` : 'none' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: INK, lineHeight: 1.4, marginBottom: 4 }}>{d.text}</p>
                  <p style={{ fontSize: 9, color: MUT, lineHeight: 1.4 }}>→ {d.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor */}
          {persona.supervisor_email && (
            <div style={{ marginTop: 24, padding: '14px 18px', background: SUR, borderRadius: 10,
              border: `1px solid ${BRD}`, display: 'flex', alignItems: 'center', gap: 14 }} className="nb">
              <div style={{ width: 36, height: 36, borderRadius: 9,
                background: supVerif ? '#dcfce7' : '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{supVerif ? '✓' : '⏳'}</span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: INK }}>
                  {persona.supervisor_nombre ?? 'Supervisor / Manager'}
                  <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 600, color: supVerif ? GN : AM }}>
                    {supVerif ? '· Verificado — peso completo (1.0×) en Índice TRAZA' : '· Pendiente de verificación — peso reducido (0.5×)'}
                  </span>
                </p>
                <p style={{ fontSize: 9, color: MUT, marginTop: 2 }}>{persona.supervisor_email}</p>
              </div>
            </div>
          )}

          <PF nombre={nombre} trazaId={persona.traza_id} page={2} />
        </div>

        {/* ════════════════════════════════════
            PÁG 3 · PERFORMANCE INTELLIGENCE
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <SecLabel>Performance Intelligence · Página 3</SecLabel>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 36, lineHeight: 1.15 }}>
            Descomposición del Índice TRAZA
          </h2>

          {/* Score hero + Module table */}
          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 40, marginBottom: 32 }} className="nb">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'flex-start', gap: 12, paddingTop: 8 }}>
              <Ring score={indice.score} color={col} size={160} sw={14} />
              <div style={{ background: bdg.bg, borderRadius: 20, padding: '4px 14px', textAlign: 'center' }}>
                <span style={{ color: bdg.color, fontSize: 10, fontWeight: 700 }}>{bdg.label}</span>
              </div>
              <p style={{ fontSize: 8.5, color: SUB, textAlign: 'center', lineHeight: 1.5 }}>
                Índice TRAZA Global<br />{hoy}
              </p>
            </div>
            <div>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 36px 44px 100px',
                gap: '6px 12px', paddingBottom: 8, borderBottom: `1px solid ${BRD}`, marginBottom: 2 }}>
                {['ID', 'Módulo', 'Peso', 'Score', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 7.5, color: SUB, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    textAlign: i >= 2 && i < 4 ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>
              {modulos.map((m, i) => (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 36px 44px 100px',
                  gap: '6px 12px', alignItems: 'center', padding: '10px 0',
                  borderBottom: i < modulos.length - 1 ? `1px solid ${SUR}` : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: B, fontFamily: FD }}>{m.id}</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: INK }}>{m.label}</p>
                    <p style={{ fontSize: 8.5, color: MUT, lineHeight: 1.4, marginTop: 1 }}>{m.desc}</p>
                  </div>
                  <span style={{ fontSize: 9.5, color: SUB, textAlign: 'right' }}>{m.pct}%</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: sCol(m.val), fontFamily: FD, textAlign: 'right' }}>{m.val}</span>
                  <div style={{ height: 6, background: BRD, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${m.val}%`, background: sCol(m.val) }} />
                  </div>
                </div>
              ))}
              {/* Total row */}
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 36px 44px 100px',
                gap: '6px 12px', alignItems: 'center', paddingTop: 10, borderTop: `2px solid ${BRD}` }}>
                <span />
                <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>Índice TRAZA Global</span>
                <span style={{ fontSize: 9.5, color: SUB, textAlign: 'right' }}>100%</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: col, fontFamily: FD, textAlign: 'right' }}>{indice.score}</span>
                <div style={{ height: 8, background: BRD, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${indice.score}%`, background: col }} />
                </div>
              </div>
            </div>
          </div>

          {/* Activity + Quarterly */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="nb">
            <div style={{ padding: '18px 20px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <SecLabel>Actividad registrada · últimas 52 semanas</SecLabel>
              <Heatmap avances={avances} />
              <p style={{ fontSize: 8.5, color: MUT, marginTop: 10 }}>
                {semanasActivas} semanas con avances · {avances.length} registros totales
              </p>
            </div>
            <div style={{ padding: '18px 20px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <SecLabel>Evolución trimestral de objetivos</SecLabel>
              <QBars objetivos={objetivos} />
              <p style={{ fontSize: 8.5, color: MUT, marginTop: 10 }}>
                Azul: completados · Gris: total por trimestre
              </p>
            </div>
          </div>

          {/* Key ratios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: `1px solid ${BRD}`, borderLeft: `1px solid ${BRD}` }} className="nb">
            {[
              { label: 'Tasa de cumplimiento', value: `${iCumpl}%`, color: iCumpl >= 70 ? GN : AM },
              { label: 'Calidad de resultados', value: `${iConf}%`, color: iConf >= 70 ? GN : AM },
              { label: 'Compromiso semanal',   value: `${iCompr}%`, color: iCompr >= 50 ? P : MUT },
              { label: 'Mejora continua',       value: `${iMejora}%`, color: iMejora >= 80 ? GN : AM },
            ].map((m, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRight: `1px solid ${BRD}`, borderBottom: `1px solid ${BRD}` }}>
                <p style={{ fontSize: 8, color: SUB, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', marginBottom: 8, fontFamily: FB }}>{m.label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: m.color, fontFamily: FD }}>{m.value}</p>
              </div>
            ))}
          </div>

          <PF nombre={nombre} trazaId={persona.traza_id} page={3} />
        </div>

        {/* ════════════════════════════════════
            PÁG 4+ · CAREER RECORD
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <SecLabel>Career Record · Página 4</SecLabel>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.15 }}>
            Historial profesional verificado
          </h2>
          <p style={{ fontSize: 11, color: MUT, marginBottom: 32 }}>
            {objetivos.length} objetivo{objetivos.length !== 1 ? 's' : ''} en {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}.
            Todos los datos son auditables en traza.app{persona.traza_id ? `/p/${persona.traza_id}` : ''}.
          </p>

          {/* Timeline (multi-empresa) */}
          {empresas.length > 1 && (
            <div style={{ marginBottom: 28, padding: '16px 20px', background: SUR,
              borderRadius: 10, border: `1px solid ${BRD}` }} className="nb">
              <SecLabel>Línea de tiempo</SecLabel>
              <div style={{ display: 'flex', gap: 0 }}>
                {empresas.map((emp, i) => {
                  const p = emp.persona
                  const activo = p.empleo_activo === true
                  const nom = p.empresa?.nombre ?? p.empresa_actual_nombre ?? 'Empresa'
                  return (
                    <div key={p.id} style={{ flex: 1, borderLeft: `2px solid ${activo ? P : BRD}`,
                      paddingLeft: 12, paddingRight: 12, position: 'relative' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', position: 'absolute',
                        left: -5, top: 0, background: activo ? P : BRD, border: '2px solid #fff',
                        boxShadow: `0 0 0 2px ${activo ? P : BRD}` }} />
                      <p style={{ fontSize: 10, fontWeight: 700, color: activo ? B : SLT }}>{nom}</p>
                      {activo && (
                        <span style={{ fontSize: 7.5, fontWeight: 700, color: P, background: L,
                          borderRadius: 8, padding: '1px 6px', display: 'inline-block', marginTop: 2 }}>ACTUAL</span>
                      )}
                      <p style={{ fontSize: 8.5, color: MUT, marginTop: 4, lineHeight: 1.5 }}>
                        {p.cargo}<br />{fPer(p.fecha_inicio_empleo, p.fecha_fin_empleo)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Objectives per company */}
          {empresas.map((emp, empIdx) => {
            const p = emp.persona
            const empNom = p.empresa?.nombre ?? p.empresa_actual_nombre ?? 'Empresa'
            const empObjIds = new Set(emp.objetivos.map(o => o.id))
            const empValExt = validacionesExternas.filter((v: any) => empObjIds.has(v.objetivo_id))
            const eIndice = calcularIndiceTraza(emp.objetivos, emp.avances, empValExt, p.supervisor_verificado ?? true)
            const activo  = p.empleo_activo === true

            return (
              <div key={p.id} style={{ marginBottom: empIdx < empresas.length - 1 ? 28 : 0 }}>
                {/* Company header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: activo ? L : SUR,
                  borderRadius: 10, border: `1px solid ${activo ? P + '30' : BRD}`, marginBottom: 8 }} className="nb">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: FD }}>{empNom}</p>
                      {activo && <span style={{ fontSize: 8, fontWeight: 700, color: P,
                        background: P + '15', borderRadius: 8, padding: '2px 8px' }}>EMPRESA ACTUAL</span>}
                    </div>
                    <p style={{ fontSize: 9.5, color: MUT }}>
                      {[p.cargo, p.area].filter(Boolean).join(' · ')} · {fPer(p.fecha_inicio_empleo, p.fecha_fin_empleo)}
                    </p>
                    <p style={{ fontSize: 8.5, color: SUB, marginTop: 2 }}>
                      {emp.objetivos.length} objetivos · {emp.avances.length} avances registrados
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 8.5, color: SUB, marginBottom: 2 }}>Score en esta empresa</p>
                    <p style={{ fontSize: 30, fontWeight: 900, color: sCol(eIndice.score), fontFamily: FD, lineHeight: 1 }}>
                      {eIndice.score}
                    </p>
                  </div>
                </div>

                {/* Objectives list */}
                {emp.objetivos.length === 0 ? (
                  <p style={{ fontSize: 10, color: SUB, padding: '8px 18px' }}>Sin objetivos registrados en este período.</p>
                ) : emp.objetivos.map((o, idx) => {
                  const objAvs = emp.avances.filter((a: any) => a.objetivo_id === o.id)
                  const res = (() => {
                    if (o.validacion === 'De acuerdo')              return { text: 'Validado ✓',        color: GN,  bg: '#f0fdf4' }
                    if (o.validacion === 'Parcialmente de acuerdo') return { text: 'Con observaciones', color: AM,  bg: '#fef3c7' }
                    if (o.validacion === 'En desacuerdo')           return { text: 'No acordado',       color: RD,  bg: '#fef2f2' }
                    if (o.estado === 'Completado')                  return { text: 'Completado',        color: MUT, bg: SUR }
                    if (o.estado === 'En progreso')                 return { text: 'En progreso',       color: P,   bg: L }
                    return                                                  { text: 'Pendiente',        color: SUB, bg: SUR }
                  })()

                  return (
                    <div key={o.id} className="nb" style={{
                      padding: '11px 0', display: 'flex', gap: 12,
                      borderBottom: idx < emp.objetivos.length - 1 ? `1px solid ${SUR}` : 'none',
                    }}>
                      <div style={{ width: 3, background: res.color, borderRadius: 2, flexShrink: 0, opacity: 0.7 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: INK, lineHeight: 1.35, flex: 1 }}>{o.titulo}</p>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {o.prioridad === 'Alta' && (
                              <span style={{ fontSize: 7.5, fontWeight: 700, color: RD, background: '#fef2f2', borderRadius: 6, padding: '2px 7px' }}>ALTA</span>
                            )}
                            <span style={{ fontSize: 7.5, fontWeight: 700, color: res.color, background: res.bg, borderRadius: 6, padding: '2px 7px' }}>{res.text}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 4 }}>
                          {o.fecha_limite && <span style={{ fontSize: 8.5, color: SUB }}>📅 {formatFecha(o.fecha_limite)}</span>}
                          {objAvs.length > 0 && <span style={{ fontSize: 8.5, color: SUB }}>{objAvs.length} avance{objAvs.length !== 1 ? 's' : ''}</span>}
                          {o.categoria && <span style={{ fontSize: 8.5, color: SUB }}>{o.categoria}</span>}
                          {(o as any).evidencia_url && <span style={{ fontSize: 8.5, color: P }}>↗ Evidencia adjunta</span>}
                        </div>
                        {o.comentario_supervisor?.trim() && (
                          <div style={{ marginTop: 6, padding: '8px 12px', background: SUR, borderRadius: 7, borderLeft: `2px solid ${BRD}` }}>
                            <p style={{ fontSize: 9.5, color: SLT, fontStyle: 'italic', lineHeight: 1.6 }}>"{o.comentario_supervisor}"</p>
                            <p style={{ fontSize: 8, color: SUB, marginTop: 2 }}>Manager / Supervisor</p>
                          </div>
                        )}
                        {(o as any).comentario_empleado?.trim() && (
                          <p style={{ fontSize: 9, color: MUT, marginTop: 5, fontStyle: 'italic', lineHeight: 1.5 }}>
                            Autoevaluación: "{(o as any).comentario_empleado}"
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          <PF nombre={nombre} trazaId={persona.traza_id} page={4} />
        </div>

        {/* ════════════════════════════════════
            PÁG 5 · COMPETENCY PROFILE
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <SecLabel>Competency Profile · Página 5</SecLabel>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.15 }}>
            Perfil de competencias observadas
          </h2>
          <p style={{ fontSize: 11, color: MUT, marginBottom: 36 }}>
            Competencias derivadas exclusivamente de datos registrados y verificados. No encuestas de percepción.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, marginBottom: 32 }} className="nb">
            {/* Radar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Radar data={competencias} size={240} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, width: '100%' }}>
                {competencias.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sCol(c.value), flexShrink: 0 }} />
                    <span style={{ fontSize: 8, color: MUT }}>{c.label}: <strong style={{ color: SLT }}>{c.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competency details */}
            <div>
              {[
                { label: 'Validación de Superiores', val: indice.moduloA,
                  desc: 'Resultados reconocidos y validados positivamente por el management directo.',
                  evidence: `${validados.length} obj. validados positivamente · ${parciales.length} con observaciones` },
                { label: 'Cumplimiento',  val: indice.moduloB,
                  desc: 'Habilidad de cerrar compromisos dentro de los plazos acordados con el equipo.',
                  evidence: `${completados.length} de ${objetivos.length} objetivos completados (${iCumpl}%)` },
                { label: 'Regularidad',   val: indice.moduloC,
                  desc: 'Uso constante de la plataforma para documentar avances semana a semana.',
                  evidence: `${semanasActivas} semanas activas · ${avances.length} avances documentados` },
                { label: 'Alineación',    val: indice.alineacion,
                  desc: 'Coherencia entre la autoevaluación del profesional y el juicio de su supervisor.',
                  evidence: `${conFeedback.length} objetivo${conFeedback.length !== 1 ? 's' : ''} con feedback documentado del manager` },
                { label: 'Proactividad',  val: indice.proactividad,
                  desc: 'Capacidad de proponerse objetivos propios por iniciativa, sin esperar asignación.',
                  evidence: (() => { const p = objetivos.filter(o => o.tipo === 'Personal').length; return `${p} objetivo${p !== 1 ? 's' : ''} propuesto${p !== 1 ? 's' : ''} por iniciativa propia de ${objetivos.length} totales` })() },
                { label: 'Confiabilidad', val: iConf,
                  desc: 'Proporción de resultados que, una vez completados, fueron validados positivamente.',
                  evidence: `${iConf}% de aprobación sobre ${completados.length} objetivo${completados.length !== 1 ? 's' : ''} completado${completados.length !== 1 ? 's' : ''}` },
              ].map((c, i) => (
                <div key={c.label} style={{ display: 'flex', gap: 14, padding: '11px 0',
                  borderBottom: i < 5 ? `1px solid ${SUR}` : 'none' }} className="nb">
                  <div style={{ width: 44, textAlign: 'right', flexShrink: 0, paddingTop: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: sCol(c.val), fontFamily: FD }}>{c.val}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: INK, marginBottom: 3 }}>{c.label}</p>
                    <p style={{ fontSize: 9.5, color: MUT, lineHeight: 1.55, marginBottom: 4 }}>{c.desc}</p>
                    <p style={{ fontSize: 8.5, color: P, fontWeight: 500 }}>↳ {c.evidence}</p>
                  </div>
                  <div style={{ width: 80, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ height: 5, width: '100%', background: BRD, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${c.val}%`, background: sCol(c.val) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: SUR, borderRadius: 10, border: `1px solid ${BRD}` }}>
            <p style={{ fontSize: 8.5, color: MUT, lineHeight: 1.7 }}>
              <strong style={{ color: SLT }}>Nota metodológica:</strong>{' '}
              Todas las competencias se derivan de datos registrados y verificados en TRAZA.
              Los valores reflejan comportamiento real observado, no encuestas de percepción ni autoevaluaciones no corroboradas.
              Supervisores verificados tienen peso 1.0×; supervisores pendientes 0.5×.
            </p>
          </div>

          <PF nombre={nombre} trazaId={persona.traza_id} page={5} />
        </div>

        {/* ════════════════════════════════════
            PÁG 6 · EVIDENCE VAULT (condicional)
        ════════════════════════════════════ */}
        {hasEvidence && (
          <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
            <SecLabel>Evidence Vault · Página 6</SecLabel>
            <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
              letterSpacing: '-0.01em', marginBottom: 36, lineHeight: 1.15 }}>
              Evidencia y validaciones externas
            </h2>

            {reconocimientos.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: SLT, marginBottom: 14,
                  paddingBottom: 8, borderBottom: `1px solid ${BRD}` }}>
                  Reconocimientos formales ({reconocimientos.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {reconocimientos.map((r: any) => (
                    <div key={r.id} className="nb" style={{ padding: '14px 16px',
                      background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{r.emoji ?? '⭐'}</span>
                        <p style={{ fontSize: 12, fontWeight: 700, color: INK }}>{r.tipo ?? 'Reconocimiento'}</p>
                      </div>
                      {r.mensaje && (
                        <p style={{ fontSize: 10.5, color: SLT, lineHeight: 1.65, fontStyle: 'italic', marginBottom: 8 }}>
                          "{r.mensaje}"
                        </p>
                      )}
                      {r.otorgado_por_nombre && (
                        <p style={{ fontSize: 8.5, color: MUT }}>
                          De: {r.otorgado_por_nombre} · {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {valConf.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: SLT, marginBottom: 14,
                  paddingBottom: 8, borderBottom: `1px solid ${BRD}` }}>
                  Validaciones de terceros verificadas ({valConf.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {valConf.map((v: any) => {
                    const vc = v.calificacion === 'De acuerdo'
                      ? { bg: '#f0fdf4', border: '#86efac', color: GN, label: 'Validación positiva' }
                      : v.calificacion === 'Parcialmente de acuerdo'
                      ? { bg: '#fef3c7', border: '#fde68a', color: AM, label: 'Validación parcial' }
                      : { bg: '#fef2f2', border: '#fca5a5', color: RD, label: 'No validado' }
                    return (
                      <div key={v.id} className="nb" style={{ padding: '14px 16px',
                        background: vc.bg, borderRadius: 10, border: `1px solid ${vc.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: INK }}>{v.nombre}</p>
                            {(v.cargo || v.empresa) && (
                              <p style={{ fontSize: 9, color: MUT }}>{[v.cargo, v.empresa].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 700, color: vc.color,
                            background: `${vc.border}55`, padding: '3px 8px', borderRadius: 12, flexShrink: 0 }}>
                            {vc.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 8.5, fontWeight: 600,
                          color: v.nivel_confianza === 'corporativo' ? GN : MID, marginBottom: v.comentario ? 6 : 0 }}>
                          {v.nivel_confianza === 'corporativo' ? '🏢 Email corporativo verificado' : '📧 Email personal verificado'}
                        </p>
                        {v.comentario && (
                          <p style={{ fontSize: 10, color: SLT, fontStyle: 'italic', lineHeight: 1.6 }}>"{v.comentario}"</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <PF nombre={nombre} trazaId={persona.traza_id} page={6} />
          </div>
        )}

        {/* ════════════════════════════════════
            PÁG · AI CAREER INSIGHTS
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            background: L, borderRadius: 8, padding: '4px 12px', marginBottom: 10, alignSelf: 'flex-start' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: P, letterSpacing: '0.08em' }}>
              ✦ INFERENCIAS GENERADAS POR INTELIGENCIA ARTIFICIAL
            </span>
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.15 }}>
            AI Career Insights
          </h2>
          <p style={{ fontSize: 11, color: MUT, marginBottom: 36 }}>
            Análisis derivado de patrones detectados en los datos verificados. Toda inferencia está sustentada en evidencia objetiva.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="nb">
            {/* Estilo profesional */}
            <div style={{ padding: '20px 22px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <SecLabel>Estilo profesional observado</SecLabel>
              <p style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.7, marginBottom: 16 }}>
                {estiloPerfil}
              </p>
              <div style={{ borderTop: `1px solid ${BRD}`, paddingTop: 12 }}>
                {[
                  { dim: 'Orientación principal', val: indice.moduloA >= indice.moduloB ? 'Resultados' : 'Proceso y estructura' },
                  { dim: 'Ritmo de trabajo',      val: indice.moduloC >= 60 ? 'Constante y sostenido' : 'Por proyectos / sprint' },
                  { dim: 'Estilo de ejecución',   val: indice.alineacion >= 70 ? 'Colaborativo y alineado' : 'Autónomo e independiente' },
                  { dim: 'Nivel de visibilidad',  val: avances.length >= 15 ? 'Alto — documenta activamente' : 'Moderado — documentación en desarrollo' },
                ].map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '6px 0',
                    borderBottom: i < 3 ? `1px solid ${SUR}` : 'none' }}>
                    <span style={{ fontSize: 9, color: MUT }}>{d.dim}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: INK }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos roles */}
            <div style={{ padding: '20px 22px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <SecLabel>Posibles próximos roles</SecLabel>
              <p style={{ fontSize: 9, color: MUT, marginBottom: 14, lineHeight: 1.5 }}>
                Basado en trayectoria, score actual y evidencia de reconocimiento acumulado
              </p>
              {proximosRoles.map((rol, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderBottom: i < proximosRoles.length - 1 ? `1px solid ${BRD}` : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: P, flexShrink: 0 }} />
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: SLT }}>{rol}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          <div style={{ marginBottom: 24 }} className="nb">
            <p style={{ fontSize: 10, fontWeight: 700, color: SLT, marginBottom: 14,
              paddingBottom: 8, borderBottom: `1px solid ${BRD}` }}>
              Recomendaciones de desarrollo prioritarias
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {recomendaciones.slice(0, 3).map((rec, i) => (
                <div key={i} style={{ padding: '14px 16px', background: SUR,
                  borderRadius: 10, border: `1px solid ${BRD}` }}>
                  <p style={{ fontSize: 7.5, fontWeight: 700, color: P, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 6 }}>{rec.area}</p>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: INK, marginBottom: 6 }}>{rec.titulo}</p>
                  <p style={{ fontSize: 9.5, color: MUT, lineHeight: 1.6 }}>{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Disclaimer */}
          <div style={{ marginTop: 'auto', padding: '14px 18px', background: L,
            borderRadius: 10, border: `1px solid ${P}20` }}>
            <p style={{ fontSize: 9, color: MID, lineHeight: 1.75 }}>
              <strong style={{ color: P }}>✦ Sobre las inferencias de inteligencia artificial:</strong>{' '}
              Las secciones de esta página son análisis generados por IA a partir de patrones detectados en los datos verificados de TRAZA.
              No reemplazan el juicio humano ni constituyen evaluaciones de rendimiento formales.
              Todos los datos numéricos, validaciones y competencias en el resto del informe son registros objetivos, auditables e independientes de la IA.
            </p>
          </div>

          <PF nombre={nombre} trazaId={persona.traza_id} page={hasEvidence ? 7 : 6} />
        </div>

        {/* ════════════════════════════════════
            PÁG FINAL · VERIFICATION SEAL
        ════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff', minHeight: 1123, padding: '52px 64px', display: 'flex', flexDirection: 'column' }}>
          <SecLabel>{`Document Verification · Página ${verificationPage}`}</SecLabel>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: INK,
            letterSpacing: '-0.01em', marginBottom: 36, lineHeight: 1.15 }}>
            Autenticidad y metodología
          </h2>

          {/* Verification block */}
          <div style={{ background: `linear-gradient(135deg, ${B} 0%, ${P} 100%)`,
            borderRadius: 16, padding: '28px 32px', marginBottom: 28 }} className="nb">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontFamily: FB }}>
                  Documento verificado por TRAZA
                </p>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: 24, fontFamily: FD, marginBottom: 5 }}>
                  {nombre}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  {persona.cargo ?? '—'} · {empNombre}
                </p>
                <div style={{ display: 'flex', gap: 28, marginTop: 20, flexWrap: 'wrap' }}>
                  {persona.traza_id && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FB }}>ID TRAZA</p>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '0.06em', fontFamily: FD }}>{persona.traza_id}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FB }}>Índice global</p>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, fontFamily: FD }}>{indice.score}/100 · {indice.nivel}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FB }}>Emitido</p>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{hoy}</p>
                  </div>
                </div>
              </div>
              {persona.traza_id && (
                <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 24 }}>
                  <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.1)',
                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`https://traza.app/p/${persona.traza_id}`)}&color=1C2B90&bgcolor=ffffff`}
                      width="58" height="58" alt="QR de verificación" style={{ borderRadius: 6 }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 7, fontFamily: FB }}>Verificar en línea</p>
                </div>
              )}
            </div>
          </div>

          {/* Methodology */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="nb">
            <div style={{ padding: '18px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: GN, marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Qué mide TRAZA</p>
              {['Objetivos acordados y verificados por supervisores',
                'Validaciones ponderadas por nivel de confianza del emisor',
                'Regularidad y consistencia del registro de avances',
                'Evolución temporal objetiva del desempeño',
                'Alineación entre autopercepción y validación externa',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ color: GN, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <p style={{ fontSize: 10, color: SLT, lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '18px', background: SUR, borderRadius: 12, border: `1px solid ${BRD}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: RD, marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>✕ Qué no hace TRAZA</p>
              {['No inventa ni estima datos sin evidencia registrada',
                'No pondera por percepciones subjetivas sin respaldo',
                'No permite manipulación de validaciones externas',
                'No comparte datos sin autorización explícita del titular',
                'No emite juicios de valor sobre la persona como individuo',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ color: RD, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✕</span>
                  <p style={{ fontSize: 10, color: SLT, lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Document footer */}
          <div style={{ paddingTop: 20, borderTop: `1px solid ${BRD}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: B,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: FD }}>t</span>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: B, fontFamily: FD }}>traza · Performance Intelligence</p>
                <p style={{ fontSize: 8.5, color: SUB }}>El estándar verificado de desempeño profesional · traza.app</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, color: MUT }}>{hoy}</p>
              <p style={{ fontSize: 8.5, color: SUB, marginTop: 1 }}>
                {objetivos.length} objetivos · {avances.length} avances · Índice {indice.score}/100
              </p>
            </div>
          </div>
        </div>

      </div>
      <div style={{ height: 32 }} />
    </>
  )
}
