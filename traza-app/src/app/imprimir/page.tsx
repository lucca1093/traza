'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, formatFecha } from '@/lib/traza'
import type { Objetivo } from '@/types'

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'
const GREEN   = '#16a34a'
const AMBER   = '#d97706'
const RED     = '#dc2626'
const PURPLE  = '#7c3aed'
const CYAN    = '#0891b2'
const GRAY50  = '#F8FAFC'
const GRAY100 = '#F1F5F9'
const GRAY200 = '#E2E8F0'
const GRAY300 = '#CBD5E1'
const GRAY400 = '#94A3B8'
const GRAY500 = '#64748B'
const GRAY600 = '#475569'
const GRAY700 = '#334155'
const GRAY900 = '#0F172A'

/* ─── Helpers ────────────────────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 85) return GREEN
  if (s >= 65) return PRIMARY
  if (s >= 40) return AMBER
  return GRAY400
}
function scoreBadge(nivel: string) {
  if (nivel === 'Élite' || nivel === 'Elite') return { label: 'Élite',          bg: '#dcfce7', color: GREEN   }
  if (nivel === 'Avanzado')                   return { label: 'Avanzado',       bg: LIGHT,     color: PRIMARY  }
  if (nivel === 'En desarrollo')              return { label: 'En desarrollo',  bg: '#fef3c7', color: AMBER   }
  return                                             { label: 'Inicial',        bg: GRAY100,   color: GRAY500  }
}
function formatPeriodo(inicio: string | null, fin: string | null) {
  if (!inicio) return 'Período no registrado'
  const fmt = (f: string) => new Date(f).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
  return fin ? `${fmt(inicio)} – ${fmt(fin)}` : `${fmt(inicio)} – Actualidad`
}
function getQuarterKey(fecha: string) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
}
function getQuarterLabel(key: string) {
  const [year, q] = key.split('-')
  return `${{ Q1: 'E–M', Q2: 'A–J', Q3: 'J–S', Q4: 'O–D' }[q] ?? q} ${year.slice(2)}`
}

/* ─── SVG: Score Ring ────────────────────────────────────────────────── */
function ScoreRing({ score, color, size = 120, sw = 10 }: {
  score: number; color: string; size?: number; sw?: number
}) {
  const r = (size - sw * 2) / 2 - 2
  const c = 2 * Math.PI * r
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={`${color}20`} strokeWidth={sw} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 5} textAnchor="middle" fontSize={size * 0.24} fontWeight="900"
        fill={color} fontFamily="'Plus Jakarta Sans', Inter, sans-serif">{score}</text>
      <text x={cx} y={cx + size * 0.13} textAnchor="middle" fontSize={size * 0.09}
        fill={`${color}90`} fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

/* ─── SVG: Score Ring blanco (para portada) ──────────────────────────── */
function ScoreRingWhite({ score, size = 130 }: { score: number; size?: number }) {
  const sw = 10, r = (size - sw * 2) / 2 - 2
  const c = 2 * Math.PI * r, cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={sw} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="white" strokeWidth={sw}
        strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 6} textAnchor="middle" fontSize={size * 0.26} fontWeight="900"
        fill="white" fontFamily="'Plus Jakarta Sans', Inter, sans-serif">{score}</text>
      <text x={cx} y={cx + size * 0.14} textAnchor="middle" fontSize={size * 0.09}
        fill="rgba(255,255,255,0.6)" fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

/* ─── SVG: Radar Chart ───────────────────────────────────────────────── */
function RadarChart({ data, size = 190 }: {
  data: Array<{ label: string; value: number; color?: string }>; size?: number
}) {
  const n = data.length, cx = size / 2, cy = size / 2, r = size * 0.33, lr = r + 22
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2
  const ring = (pct: number) =>
    data.map((_, i) => `${cx + r * pct * Math.cos(angle(i))},${cy + r * pct * Math.sin(angle(i))}`).join(' ')
  const pts = data.map((d, i) => `${cx + r * (d.value / 100) * Math.cos(angle(i))},${cy + r * (d.value / 100) * Math.sin(angle(i))}`).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((p, i) => <polygon key={i} points={ring(p)} fill="none" stroke={GRAY100} strokeWidth="1" />)}
      {data.map((_, i) => <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))} stroke={GRAY100} strokeWidth="1" />)}
      <polygon points={pts} fill={`${PRIMARY}20`} stroke={PRIMARY} strokeWidth="2" />
      {data.map((d, i) => {
        const a = angle(i), v = d.value / 100
        return <circle key={i} cx={cx + r * v * Math.cos(a)} cy={cy + r * v * Math.sin(a)} r="3.5" fill={d.color ?? PRIMARY} stroke="white" strokeWidth="1.5" />
      })}
      {data.map((d, i) => {
        const a = angle(i), lx = cx + lr * Math.cos(a), ly = cy + lr * Math.sin(a)
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill={GRAY600} fontFamily="Inter, sans-serif" fontWeight="600">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

/* ─── Barra de módulo ────────────────────────────────────────────────── */
function ModuleBar({ label, pct, val, desc }: {
  label: string; pct: string; val: number; desc: string
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GRAY700 }}>
          {label} <span style={{ fontSize: 10, fontWeight: 400, color: GRAY400 }}>{pct} del índice</span>
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color: BRAND, letterSpacing: '-0.02em' }}>{val}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: GRAY100, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${val}%`, background: `linear-gradient(90deg, ${PRIMARY}80, ${BRAND})` }} />
      </div>
      <p style={{ fontSize: 9, color: GRAY400, marginTop: 3 }}>{desc}</p>
    </div>
  )
}

/* ─── Index Card (People Analytics) ─────────────────────────────────── */
function IndexCard({ label, value, formula, desc, color }: {
  label: string; value: number; formula: string; desc: string; color: string
}) {
  const r = 16, c = 2 * Math.PI * r
  const clamp = Math.max(0, Math.min(100, value))
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: `1px solid ${GRAY200}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
          <circle cx="20" cy="20" r={r} fill="none" stroke={`${color}20`} strokeWidth="4" />
          <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(clamp / 100) * c} ${c}`} strokeLinecap="round" transform="rotate(-90 20 20)" />
          <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="800"
            fill={color} fontFamily="'Plus Jakarta Sans', sans-serif">{clamp}</text>
        </svg>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: GRAY900, lineHeight: 1.2, marginBottom: 1 }}>{label}</p>
          <p style={{ fontSize: 8.5, color: GRAY500, lineHeight: 1.3 }}>{desc}</p>
        </div>
      </div>
      <div style={{ background: GRAY50, borderRadius: 5, padding: '3px 7px' }}>
        <p style={{ fontSize: 7.5, color: GRAY400, fontFamily: 'monospace', letterSpacing: '0.01em' }}>{formula}</p>
      </div>
    </div>
  )
}

/* ─── Section Header ─────────────────────────────────────────────────── */
function SH({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18, paddingBottom: 10, borderBottom: `2px solid ${BRAND}` }}>
      <p style={{ fontSize: 15, fontWeight: 800, color: BRAND, letterSpacing: '-0.01em',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{title}</p>
      {sub && <p style={{ fontSize: 9.5, color: GRAY500, marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

/* ─── Page strip ─────────────────────────────────────────────────────── */
function Strip({ section }: { section: string }) {
  return (
    <div style={{ background: BRAND, padding: '6px 48px', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        TRAZA · Informe Profesional Verificado
      </span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {section}
      </span>
    </div>
  )
}

/* ─── Page Footer ────────────────────────────────────────────────────── */
function PF({ nombre, trazaId, page }: { nombre: string; trazaId?: string; page: number }) {
  const hoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <div style={{ marginTop: 20, paddingTop: 10, borderTop: `1px solid ${GRAY100}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 8 }}>T</span>
        </div>
        <span style={{ color: GRAY400, fontWeight: 700, fontSize: 8.5 }}>TRAZA · Performance Intelligence</span>
      </div>
      <p style={{ fontSize: 8.5, color: GRAY300 }}>{nombre} · {hoy}</p>
      <p style={{ fontSize: 8.5, color: GRAY300 }}>
        {trazaId ? `${trazaId} · ` : ''}Pág. {page}
      </p>
    </div>
  )
}

/* ─── Activity Heatmap (52 semanas) ─────────────────────────────────── */
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
    const k = `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`
    return byWeek[k] ?? 0
  })
  const max = Math.max(...weeks, 1)
  return (
    <div>
      <div style={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
        {weeks.map((cnt, i) => {
          const p = cnt / max
          const bg = cnt === 0 ? GRAY100 : p < 0.33 ? `${PRIMARY}35` : p < 0.67 ? `${PRIMARY}70` : PRIMARY
          return <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: bg }} />
        })}
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
        <span style={{ fontSize: 8, color: GRAY400 }}>Menos</span>
        {[GRAY100, `${PRIMARY}35`, `${PRIMARY}70`, PRIMARY].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 1.5, background: c }} />
        ))}
        <span style={{ fontSize: 8, color: GRAY400 }}>Más actividad</span>
      </div>
    </div>
  )
}

/* ─── Quarterly Bar Chart ────────────────────────────────────────────── */
function QuarterlyBars({ objetivos }: { objetivos: Objetivo[] }) {
  const byQ: Record<string, { total: number; comp: number }> = {}
  objetivos.forEach(o => {
    if (!o.fecha_limite) return
    const k = getQuarterKey(o.fecha_limite)
    if (!byQ[k]) byQ[k] = { total: 0, comp: 0 }
    byQ[k].total++
    if (o.estado === 'Completado') byQ[k].comp++
  })
  const qs = Object.keys(byQ).sort().slice(-8)
  if (!qs.length) return <p style={{ fontSize: 10, color: GRAY400 }}>Sin datos de objetivos con fecha.</p>
  const mx = Math.max(...qs.map(k => byQ[k].total), 1)
  const H = 55, bw = Math.floor(250 / qs.length) - 3
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: H + 18 }}>
        {qs.map(q => {
          const d = byQ[q]
          const th = Math.round((d.total / mx) * H)
          const ch = d.total ? Math.round((d.comp / d.total) * th) : 0
          return (
            <div key={q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: bw, height: th, borderRadius: '3px 3px 0 0', background: GRAY100, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: ch, background: PRIMARY, borderRadius: '2px 2px 0 0' }} />
              </div>
              <span style={{ fontSize: 7, color: GRAY400 }}>{getQuarterLabel(q)}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: PRIMARY }} />
          <span style={{ fontSize: 8, color: GRAY400 }}>Completados</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: GRAY100 }} />
          <span style={{ fontSize: 8, color: GRAY400 }}>Total</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function ImprimirPage() {
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [narrativa, setNarrativa] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
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
      let todosAvances: any[]   = []
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

      const allIds = todosObjs.length > 0 ? todosObjs.map(o => o.id) : ['00000000-0000-0000-0000-000000000000']
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
        } catch { /* sin narrativa IA */ }
      }
    }
    load()
  }, [])

  /* ─── QR real: fetch desde API pública, convertir a data URL para impresión ─── */
  useEffect(() => {
    if (!data?.persona?.traza_id) return
    const verifyUrl = `https://traza.app/p/${data.persona.traza_id}`
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verifyUrl)}&color=1C2B90&bgcolor=FFFFFF&qzone=1&format=png`
    fetch(apiUrl)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => setQrDataUrl(reader.result as string)
        reader.readAsDataURL(blob)
      })
      .catch(() => { /* mantiene el placeholder si falla */ })
  }, [data?.persona?.traza_id])

  /* ─── Loading / Error ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 14, fontFamily: 'Inter, sans-serif', background: GRAY50 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>T</span>
      </div>
      <p style={{ color: GRAY500, fontSize: 13 }}>Preparando informe profesional…</p>
    </div>
  )
  if (error || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: GRAY500 }}>
      {error || 'Error al cargar datos.'}
    </div>
  )

  /* ─── Datos y cálculos ─── */
  const { persona, objetivos, avances, validacionesExternas, reconocimientos, empresas } = data
  const supVerif = persona.supervisor_verificado ?? true
  const indice   = calcularIndiceTraza(objetivos, avances, validacionesExternas, supVerif)
  const col      = scoreColor(indice.score)
  const badge    = scoreBadge(indice.nivel)
  const hoy      = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  const completados = objetivos.filter(o => o.estado === 'Completado')
  const validados   = objetivos.filter(o => o.validacion === 'De acuerdo')
  const parciales   = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo')
  const negativos   = objetivos.filter(o => o.validacion === 'En desacuerdo')
  const conFeedback = objetivos.filter(o => o.comentario_supervisor?.trim())
  const valConf     = validacionesExternas.filter((v: any) => v.confirmado !== false)

  // Antigüedad
  const fechas   = empresas.map(e => e.persona.fecha_inicio_empleo).filter(Boolean).sort()
  const fechaMin = fechas[0] ?? null
  const antiguedad = fechaMin
    ? (() => {
        const meses = Math.floor((Date.now() - new Date(fechaMin).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
        return meses >= 12 ? `${Math.floor(meses / 12)} año${Math.floor(meses / 12) !== 1 ? 's' : ''}` : `${meses} meses`
      })()
    : null

  // Semanas con actividad
  const byWeekSet = new Set(avances.map((a: any) => {
    const d = new Date(a.creado_en)
    return `${d.getFullYear()}-W${Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000))}`
  }))
  const semanasActivas = byWeekSet.size

  // Empresa actual
  const empActual = empresas.find(e => e.persona.empleo_activo === true) ?? empresas[0]
  const empNombreActual = empActual?.persona?.empresa?.nombre ?? empActual?.persona?.empresa_actual_nombre ?? 'Empresa actual'

  // People Analytics
  const iCumplimiento  = Math.round((completados.length / Math.max(objetivos.length, 1)) * 100)
  const iConfiabilidad = completados.length > 0 ? Math.round((validados.length / completados.length) * 100) : 0
  const iConsistencia  = indice.moduloC
  const iAlineacion    = indice.alineacion
  const iEvolucion     = indice.evolucion
  const iMejora        = Math.round(Math.max(0, 1 - negativos.length / Math.max(completados.length, 1)) * 100)
  const iCompromiso    = Math.min(100, Math.round((avances.length / Math.max(objetivos.length, 1)) / 5 * 100))
  const iImpacto       = Math.round((validados.length * 2 + parciales.length * 0.5) / Math.max(completados.length * 2, 1) * 100)

  // Competencias para radar
  const competencias = [
    { label: 'Resultados',    value: indice.moduloA,    color: BRAND   },
    { label: 'Cumplimiento',  value: indice.moduloB,    color: BRAND   },
    { label: 'Proactividad',  value: indice.moduloC,    color: BRAND   },
    { label: 'Alineación',    value: indice.alineacion, color: BRAND   },
    { label: 'Evolución',     value: indice.evolucion,  color: BRAND   },
    { label: 'Confiabilidad', value: iConfiabilidad,    color: BRAND   },
  ]

  // Fortalezas detectadas por datos
  const fortalezas: string[] = []
  if (indice.moduloB >= 80) fortalezas.push('Alta capacidad de cumplimiento de compromisos y plazos')
  if (indice.moduloA >= 75) fortalezas.push('Resultados reconocidos y validados positivamente por supervisores')
  if (indice.moduloC >= 70) fortalezas.push('Consistencia y proactividad sostenida en el registro de actividad')
  if (iConfiabilidad >= 80)  fortalezas.push('Calidad de ejecución: alta tasa de aprobación sobre lo completado')
  if (reconocimientos.length >= 2) fortalezas.push('Reconocimiento explícito de pares y superiores')
  if (valConf.length >= 1)   fortalezas.push('Validaciones externas verificadas de terceros')
  if (fortalezas.length === 0) fortalezas.push('Perfil en construcción dentro de la plataforma TRAZA')

  // Áreas de oportunidad
  const oportunidades: string[] = []
  if (indice.moduloC < 50)  oportunidades.push('Aumentar la frecuencia de registro semanal de avances')
  if (indice.moduloA < 60)  oportunidades.push('Mejorar la alineación con las expectativas del manager')
  if (indice.alineacion < 60) oportunidades.push('Trabajar la coherencia entre autoevaluación y validación externa')
  if (iCumplimiento < 70)   oportunidades.push('Incrementar la tasa de objetivos completados dentro de plazo')
  if (oportunidades.length === 0) oportunidades.push('No se detectan áreas críticas de mejora con los datos actuales')

  // Módulos del índice
  const modulos = [
    { label: 'Resultados validados', pct: '35%', val: indice.moduloA,
      desc: 'Calificaciones de supervisores y manager ponderadas por nivel de confianza' },
    { label: 'Cumplimiento',         pct: '25%', val: indice.moduloB,
      desc: 'Porcentaje de objetivos con fecha vencida que fueron completados exitosamente' },
    { label: 'Proactividad',         pct: '20%', val: indice.moduloC,
      desc: 'Regularidad de avances registrados semana a semana en la plataforma' },
    { label: 'Alineación',           pct: '10%', val: indice.alineacion,
      desc: 'Coherencia entre autoevaluación del colaborador y validación del supervisor' },
    { label: 'Evolución',            pct: '10%', val: indice.evolucion,
      desc: 'Tendencia del índice comparado con los últimos 90 días de actividad' },
  ]

  const nombreCompleto = `${persona.nombre} ${persona.apellido}`

  /* ─── RENDER ─── */
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #dde1ed; font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif; }
        @media print {
          #print-bar { display: none !important; }
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
          .pb { page-break-before: always; }
          .nb { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Barra de herramientas ────────────────────────────────────── */}
      <div id="print-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: BRAND, padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(28,43,144,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>T</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.02em' }}>TRAZA</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            Informe Profesional · {nombreCompleto}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '6px 14px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
          }}>← Volver</button>
          <button onClick={() => window.print()} style={{
            background: '#fff', border: 'none', color: BRAND,
            borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>⬇ Descargar PDF</button>
        </div>
      </div>

      {/* ── Documento A4 ─────────────────────────────────────────────── */}
      <div style={{
        width: 794, margin: '52px auto 48px',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
        boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
      }}>

        {/* ════════════════════════════════════════════════════════
            PÁGINA 1 · PORTADA PREMIUM
        ════════════════════════════════════════════════════════ */}
        <div style={{
          background: `linear-gradient(150deg, ${BRAND} 0%, #2442c8 55%, ${PRIMARY} 100%)`,
          padding: '52px 52px 40px',
          minHeight: 1123,
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: 60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Logo + tipo de documento */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>T</span>
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '0.06em', lineHeight: 1 }}>TRAZA</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Performance Intelligence</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Tipo de documento</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700 }}>Informe Profesional Verificado</p>
            </div>
          </div>

          {/* Nombre y score central */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 36 }}>
              {/* Info personal */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
                    {badge.label.toUpperCase()} PERFORMER
                  </span>
                </div>
                <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 40, lineHeight: 1.05,
                  letterSpacing: '-0.02em', marginBottom: 12 }}>
                  {persona.nombre}<br />{persona.apellido}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {persona.cargo ?? '—'}
                </p>
                {persona.area && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>{persona.area}</p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{empNombreActual}</p>
                {antiguedad && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 }}>
                    Trayectoria en TRAZA: {antiguedad} · {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} registrada{empresas.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Score ring */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <ScoreRingWhite score={indice.score} size={150} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>
                  Índice TRAZA Global
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
              background: 'rgba(0,0,0,0.2)', borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {[
                { val: objetivos.length,      label: 'Objetivos' },
                { val: completados.length,     label: 'Completados' },
                { val: validados.length,       label: 'Validados ✓' },
                { val: semanasActivas,         label: 'Semanas activo' },
                { val: valConf.length,         label: 'Validaciones ext.' },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: '16px 10px', textAlign: 'center',
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{m.val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginTop: 4, letterSpacing: '0.04em' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer de portada */}
          <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {persona.traza_id && (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' }}>ID TRAZA</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', marginTop: 2 }}>{persona.traza_id}</p>
                </>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Generado el {hoy}</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, marginTop: 2 }}>
                Datos verificados · traza.app/p/{persona.traza_id ?? '—'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2.5 }}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: 0.5,
                      background: [0, 2, 4, 6, 8].includes(i) ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7, marginTop: 3 }}>Verificar</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PÁGINA 2 · RESUMEN EJECUTIVO
        ════════════════════════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff' }}>
          <Strip section="Resumen Ejecutivo" />
          <div style={{ padding: '32px 48px' }}>
            <SH title="Resumen Ejecutivo" sub="Comprensión completa del perfil en menos de dos minutos" />

            {/* Score + métricas principales */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              {/* Score */}
              <div style={{ flexShrink: 0, textAlign: 'center', background: GRAY50,
                borderRadius: 14, padding: '20px 16px', border: `1px solid ${GRAY100}`, width: 140 }}>
                <ScoreRing score={indice.score} color={col} size={90} sw={8} />
                <div style={{ background: badge.bg, borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginTop: 8 }}>
                  <span style={{ color: badge.color, fontWeight: 700, fontSize: 9 }}>{badge.label}</span>
                </div>
                <p style={{ fontSize: 9, color: GRAY400, marginTop: 8, lineHeight: 1.4 }}>
                  {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} · {objetivos.length} objetivos
                </p>
              </div>

              {/* Métricas en grid 2×3 */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { val: `${iCumplimiento}%`,     label: 'Tasa de cumplimiento',         color: col   },
                  { val: completados.length,       label: 'Objetivos completados',         color: BRAND },
                  { val: validados.length,         label: 'Validados positivamente',       color: BRAND },
                  { val: `${iConfiabilidad}%`,    label: 'Confiabilidad del resultado',   color: BRAND },
                  { val: semanasActivas,           label: 'Semanas con actividad',         color: BRAND },
                  { val: valConf.length + reconocimientos.length, label: 'Evidencia externa acumulada', color: BRAND },
                ].map((m, i) => (
                  <div key={i} style={{ background: GRAY50, borderRadius: 10, padding: '12px',
                    border: `1px solid ${GRAY100}`, textAlign: 'center' }} className="nb">
                    <p style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.val}</p>
                    <p style={{ fontSize: 8.5, color: GRAY500, marginTop: 4, lineHeight: 1.35 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrativa IA */}
            {narrativa && (
              <div style={{ marginBottom: 24, background: LIGHT, borderRadius: 12,
                padding: '16px 20px', borderLeft: `3px solid ${PRIMARY}` }} className="nb">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: PRIMARY, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    ✦ Análisis generado por IA
                  </span>
                </div>
                <p style={{ fontSize: 12, color: GRAY700, lineHeight: 1.75 }}>{narrativa}</p>
              </div>
            )}

            {/* Fortalezas detectadas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: BRAND, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>▲</span> Fortalezas detectadas
                </p>
                {fortalezas.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 10.5, color: GRAY700, lineHeight: 1.55 }}>{f}</p>
                  </div>
                ))}
              </div>
              <div className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: GRAY600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>◆</span> Áreas de desarrollo
                </p>
                {oportunidades.slice(0, 4).map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER, marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 10.5, color: GRAY700, lineHeight: 1.55 }}>{o}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor */}
            {persona.supervisor_email && (
              <div style={{ background: GRAY50, borderRadius: 10, padding: '12px 16px',
                border: `1px solid ${GRAY100}`, display: 'flex', alignItems: 'center', gap: 12 }} className="nb">
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: supVerif ? '#dcfce7' : '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>{supVerif ? '✓' : '⏳'}</span>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: GRAY900 }}>
                    {persona.supervisor_nombre ?? 'Supervisor / Manager'}
                  </p>
                  <p style={{ fontSize: 10, color: GRAY500 }}>{persona.supervisor_email}</p>
                  <p style={{ fontSize: 9, color: supVerif ? GREEN : AMBER, fontWeight: 600, marginTop: 1 }}>
                    {supVerif
                      ? 'Verificado — sus validaciones tienen peso completo en el Índice TRAZA'
                      : 'Pendiente de verificación — validaciones con peso reducido hasta confirmar vínculo'}
                  </p>
                </div>
              </div>
            )}

            <PF nombre={nombreCompleto} trazaId={persona.traza_id} page={2} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PÁGINA 3 · DASHBOARD DE PERFORMANCE
        ════════════════════════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff' }}>
          <Strip section="Dashboard de Performance" />
          <div style={{ padding: '32px 48px' }}>
            <SH title="Dashboard de Performance" sub="Descomposición completa del Índice TRAZA con fórmula transparente" />

            {/* Módulos detallados */}
            <div style={{ marginBottom: 28 }}>
              {modulos.map(m => <ModuleBar key={m.label} {...m} />)}
            </div>

            {/* Gráficos: heatmap + evolución trimestral */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: GRAY700, marginBottom: 10,
                  paddingBottom: 6, borderBottom: `1px solid ${GRAY100}` }}>
                  Actividad registrada · últimas 52 semanas
                </p>
                <Heatmap avances={avances} />
                <p style={{ fontSize: 8.5, color: GRAY400, marginTop: 8 }}>
                  {semanasActivas} semanas con avance registrado · {avances.length} avances en total
                </p>
              </div>
              <div className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: GRAY700, marginBottom: 10,
                  paddingBottom: 6, borderBottom: `1px solid ${GRAY100}` }}>
                  Evolución trimestral de objetivos
                </p>
                <QuarterlyBars objetivos={objetivos} />
                <p style={{ fontSize: 8.5, color: GRAY400, marginTop: 8 }}>
                  Barras: completados (azul) sobre total (gris) por trimestre
                </p>
              </div>
            </div>

            {/* Distribución por prioridad */}
            <div className="nb">
              <p style={{ fontSize: 10, fontWeight: 700, color: GRAY700, marginBottom: 10,
                paddingBottom: 6, borderBottom: `1px solid ${GRAY100}` }}>
                Distribución de objetivos por resultado
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Completados', count: completados.length, color: GREEN,   bg: '#f0fdf4' },
                  { label: 'Validados ✓', count: validados.length,   color: PRIMARY, bg: LIGHT     },
                  { label: 'Con observ.', count: parciales.length,   color: AMBER,   bg: '#fef3c7' },
                  { label: 'No acordado', count: negativos.length,   color: RED,     bg: '#fef2f2' },
                ].map(d => (
                  <div key={d.label} style={{ background: d.bg, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: d.color, lineHeight: 1 }}>{d.count}</p>
                    <p style={{ fontSize: 8.5, color: GRAY600, marginTop: 4 }}>{d.label}</p>
                    <p style={{ fontSize: 8, color: GRAY400 }}>
                      {Math.round((d.count / Math.max(objetivos.length, 1)) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <PF nombre={nombreCompleto} trazaId={persona.traza_id} page={3} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PÁGINA 4 · PEOPLE ANALYTICS
        ════════════════════════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff' }}>
          <Strip section="People Analytics" />
          <div style={{ padding: '32px 48px' }}>
            <SH title="People Analytics" sub="Indicadores avanzados derivados de datos verificados. Cada fórmula es transparente y auditable." />

            {/* Radar + índices */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              {/* Radar chart */}
              <div style={{ flexShrink: 0, textAlign: 'center' }} className="nb">
                <p style={{ fontSize: 9, fontWeight: 700, color: GRAY500, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Perfil de Competencias</p>
                <RadarChart data={competencias} size={200} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
                  {competencias.map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 8, color: GRAY500 }}>{c.label}: <strong style={{ color: GRAY700 }}>{c.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8 índices en 2 columnas */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
                <IndexCard
                  label="Índice de Cumplimiento"
                  value={iCumplimiento}
                  formula="completados / total × 100"
                  desc="Porcentaje de objetivos completados sobre el total asignado"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Confiabilidad"
                  value={iConfiabilidad}
                  formula="validados+ / completados × 100"
                  desc="Calidad validada: aprobación positiva sobre lo finalizado"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Consistencia"
                  value={iConsistencia}
                  formula="semanas activas / 52 × 100"
                  desc="Regularidad semanal de actividad registrada en plataforma"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Alineación"
                  value={iAlineacion}
                  formula="coherencia autoevaluación ↔ validación"
                  desc="Qué tan alineado está el colaborador con la perspectiva del manager"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Mejora Continua"
                  value={iMejora}
                  formula="(1 − negativos / completados) × 100"
                  desc="Ausencia de resultados negativos sobre lo que fue completado"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Compromiso"
                  value={iCompromiso}
                  formula="avances / (objetivos × 5) × 100"
                  desc="Nivel de documentación proactiva de actividad (normalizado)"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Impacto"
                  value={Math.min(100, iImpacto)}
                  formula="(val+ × 2 + parciales × 0.5) / (comp × 2)"
                  desc="Calidad ponderada de resultados según su nivel de validación"
                  color={BRAND}
                />
                <IndexCard
                  label="Índice de Evolución"
                  value={iEvolucion}
                  formula="tendencia últimos 90 días"
                  desc="Dirección del desempeño respecto al período anterior"
                  color={BRAND}
                />
              </div>
            </div>

            {/* Nota metodológica */}
            <div style={{ background: GRAY50, borderRadius: 10, padding: '10px 14px',
              border: `1px solid ${GRAY100}` }} className="nb">
              <p style={{ fontSize: 8.5, color: GRAY500, lineHeight: 1.6 }}>
                <strong style={{ color: GRAY700 }}>Nota metodológica:</strong>{' '}
                Todos los índices se calculan exclusivamente a partir de datos registrados en TRAZA.
                Ningún valor es estimado, inferido subjetivamente ni basado en percepciones sin evidencia.
                Las validaciones de supervisores tienen peso 1.0x si el supervisor está verificado, o 0.5x si está pendiente.
                {persona.traza_id && ` · ID de integridad: ${persona.traza_id}`}
              </p>
            </div>

            <PF nombre={nombreCompleto} trazaId={persona.traza_id} page={4} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PÁGINAS 5+ · TRAYECTORIA Y OBJETIVOS
        ════════════════════════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff' }}>
          <Strip section="Trayectoria Profesional" />
          <div style={{ padding: '32px 48px' }}>
            <SH
              title="Trayectoria Profesional Verificada"
              sub={`${objetivos.length} objetivo${objetivos.length !== 1 ? 's' : ''} registrado${objetivos.length !== 1 ? 's' : ''} · ${empresas.length} empresa${empresas.length !== 1 ? 's' : ''} en TRAZA`}
            />

            {/* Timeline visual */}
            {empresas.length > 1 && (
              <div style={{ marginBottom: 24, position: 'relative', paddingLeft: 16 }} className="nb">
                <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, background: GRAY100, borderRadius: 2 }} />
                {empresas.map((emp, i) => {
                  const p = emp.persona
                  const activo = p.empleo_activo === true
                  const nombre = p.empresa?.nombre ?? p.empresa_actual_nombre ?? 'Empresa'
                  const periodo = formatPeriodo(p.fecha_inicio_empleo, p.fecha_fin_empleo)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        background: activo ? PRIMARY : GRAY300, border: '2px solid #fff',
                        boxShadow: `0 0 0 2px ${activo ? PRIMARY : GRAY300}` }} />
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: activo ? BRAND : GRAY600 }}>
                          {nombre}
                        </span>
                        {activo && (
                          <span style={{ marginLeft: 6, fontSize: 8, fontWeight: 700, color: PRIMARY,
                            background: LIGHT, borderRadius: 10, padding: '1px 6px' }}>ACTUAL</span>
                        )}
                        <p style={{ fontSize: 9, color: GRAY400 }}>{p.cargo} {periodo ? `· ${periodo}` : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empresa + objetivos */}
            {empresas.length === 0 ? (
              <p style={{ fontSize: 12, color: GRAY500 }}>Sin registros de objetivos.</p>
            ) : empresas.map((emp, empIdx) => {
              const p = emp.persona
              const nombre = p.empresa?.nombre ?? p.empresa_actual_nombre ?? 'Empresa'
              const periodo = formatPeriodo(p.fecha_inicio_empleo, p.fecha_fin_empleo)
              const eIndice = calcularIndiceTraza(emp.objetivos, emp.avances)
              const eColor  = scoreColor(eIndice.score)
              const activo  = p.empleo_activo === true

              return (
                <div key={p.id} style={{ marginBottom: empIdx < empresas.length - 1 ? 30 : 0 }} className="nb">
                  {/* Header empresa */}
                  <div style={{
                    background: activo ? LIGHT : GRAY50, borderRadius: 12,
                    padding: '14px 18px', border: `1px solid ${activo ? PRIMARY + '30' : GRAY100}`,
                    marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: GRAY900 }}>{nombre}</p>
                        {activo && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: PRIMARY,
                            background: PRIMARY + '15', borderRadius: 10, padding: '2px 7px' }}>ACTUAL</span>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: GRAY500, marginTop: 2 }}>
                        {[p.cargo, p.area].filter(Boolean).join(' · ')}{periodo ? ` · ${periodo}` : ''}
                      </p>
                      <p style={{ fontSize: 9, color: GRAY400, marginTop: 2 }}>
                        {emp.objetivos.length} objetivos · {emp.avances.length} avances registrados
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 26, fontWeight: 900, color: eColor, lineHeight: 1 }}>{eIndice.score}</p>
                      <p style={{ fontSize: 8, color: GRAY400, marginTop: 2 }}>Índice en esta empresa</p>
                    </div>
                  </div>

                  {/* Objetivos */}
                  {emp.objetivos.length === 0 ? (
                    <p style={{ fontSize: 10, color: GRAY400, paddingLeft: 14 }}>Sin objetivos registrados en este período.</p>
                  ) : emp.objetivos.map((o, idx) => {
                    const objAvs = emp.avances.filter((a: any) => a.objetivo_id === o.id)
                    const res = (() => {
                      if (o.validacion === 'De acuerdo')              return { text: 'Validado positivamente',        color: GREEN,   bg: '#f0fdf4' }
                      if (o.validacion === 'Parcialmente de acuerdo') return { text: 'Con observaciones del manager', color: AMBER,   bg: '#fef3c7' }
                      if (o.validacion === 'En desacuerdo')           return { text: 'No acordado por el manager',   color: RED,     bg: '#fef2f2' }
                      if (o.estado === 'Completado')                  return { text: 'Completado · sin validar',      color: GRAY500, bg: GRAY50   }
                      if (o.estado === 'En progreso')                 return { text: 'En progreso',                  color: PRIMARY, bg: LIGHT    }
                      return                                                  { text: 'Pendiente',                   color: GRAY400, bg: GRAY50   }
                    })()

                    return (
                      <div key={o.id} className="nb" style={{
                        display: 'flex', gap: 12,
                        padding: '10px 0', marginLeft: 4,
                        borderBottom: idx < emp.objetivos.length - 1 ? `1px solid ${GRAY100}` : 'none',
                      }}>
                        {/* Indicador lateral */}
                        <div style={{ flexShrink: 0, paddingTop: 2 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: res.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{ fontSize: 11.5, fontWeight: 700, color: GRAY900, lineHeight: 1.3, flex: 1 }}>
                              {o.titulo}
                            </p>
                            <div style={{ flexShrink: 0, display: 'flex', gap: 5 }}>
                              {o.prioridad === 'Alta' && (
                                <span style={{ fontSize: 7.5, fontWeight: 700, color: RED,
                                  background: '#fef2f2', borderRadius: 8, padding: '1.5px 6px' }}>ALTA</span>
                              )}
                              <span style={{ fontSize: 7.5, fontWeight: 700, color: res.color,
                                background: res.bg, borderRadius: 8, padding: '1.5px 6px' }}>
                                {res.text}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                            {o.fecha_limite && (
                              <span style={{ fontSize: 9, color: GRAY400 }}>Fecha: {formatFecha(o.fecha_limite)}</span>
                            )}
                            {objAvs.length > 0 && (
                              <span style={{ fontSize: 9, color: GRAY400 }}>{objAvs.length} avance{objAvs.length !== 1 ? 's' : ''}</span>
                            )}
                            {o.categoria && (
                              <span style={{ fontSize: 9, color: GRAY400 }}>{o.categoria}</span>
                            )}
                          </div>
                          {o.comentario_supervisor?.trim() && (
                            <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${GRAY100}` }}>
                              <p style={{ fontSize: 10, color: GRAY700, fontStyle: 'italic', lineHeight: 1.6 }}>
                                "{o.comentario_supervisor}"
                              </p>
                              <p style={{ fontSize: 8.5, color: GRAY400, marginTop: 2 }}>— Manager / Supervisor</p>
                            </div>
                          )}
                          {(o as any).comentario_empleado?.trim() && (
                            <p style={{ fontSize: 9.5, color: GRAY500, lineHeight: 1.5, marginTop: 4, fontStyle: 'italic' }}>
                              Autoevaluación: "{(o as any).comentario_empleado}"
                            </p>
                          )}
                          {(o as any).evidencia_url && (
                            <p style={{ fontSize: 8.5, color: PRIMARY, marginTop: 3 }}>↗ {(o as any).evidencia_url}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            <PF nombre={nombreCompleto} trazaId={persona.traza_id} page={5} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            PÁGINA 6 · EVIDENCIA (condicional)
        ════════════════════════════════════════════════════════ */}
        {(reconocimientos.length > 0 || valConf.length > 0) && (
          <div className="pb" style={{ background: '#fff' }}>
            <Strip section="Evidencia y Validaciones" />
            <div style={{ padding: '32px 48px' }}>
              <SH title="Evidencia y Validaciones Externas"
                sub="Validaciones verificadas por terceros y reconocimientos formales documentados en TRAZA" />

              {/* Reconocimientos */}
              {reconocimientos.length > 0 && (
                <div style={{ marginBottom: 28 }} className="nb">
                  <p style={{ fontSize: 10, fontWeight: 700, color: GRAY700, marginBottom: 12,
                    paddingBottom: 6, borderBottom: `1px solid ${GRAY100}` }}>
                    Reconocimientos recibidos ({reconocimientos.length})
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {reconocimientos.map((r: any) => (
                      <div key={r.id} style={{ background: '#fffbeb', borderRadius: 10,
                        padding: '12px 14px', border: '1px solid #fde68a' }} className="nb">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{r.emoji ?? '⭐'}</span>
                          <p style={{ fontSize: 11, fontWeight: 700, color: GRAY900 }}>{r.tipo ?? 'Reconocimiento'}</p>
                        </div>
                        {r.mensaje && (
                          <p style={{ fontSize: 10.5, color: GRAY700, lineHeight: 1.6, fontStyle: 'italic' }}>
                            "{r.mensaje}"
                          </p>
                        )}
                        {r.otorgado_por_nombre && (
                          <p style={{ fontSize: 9, color: GRAY500, marginTop: 5 }}>
                            De: {r.otorgado_por_nombre} · {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validaciones externas */}
              {valConf.length > 0 && (
                <div className="nb">
                  <p style={{ fontSize: 10, fontWeight: 700, color: GRAY700, marginBottom: 12,
                    paddingBottom: 6, borderBottom: `1px solid ${GRAY100}` }}>
                    Validaciones externas verificadas ({valConf.length})
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {valConf.map((v: any) => {
                      const vc = v.calificacion === 'De acuerdo'
                        ? { bg: '#f0fdf4', border: '#86efac', color: GREEN,  label: '✓ Positivo' }
                        : v.calificacion === 'Parcialmente de acuerdo'
                        ? { bg: '#fef3c7', border: '#fde68a', color: AMBER,  label: '~ Parcial' }
                        : { bg: '#fef2f2', border: '#fca5a5', color: RED,    label: '✗ Negativo' }
                      const nivel = v.nivel_confianza ?? 'personal'
                      return (
                        <div key={v.id} style={{ background: vc.bg, borderRadius: 10,
                          padding: '12px 14px', border: `1px solid ${vc.border}` }} className="nb">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 700, color: GRAY900 }}>{v.nombre}</p>
                              {(v.cargo || v.empresa) && (
                                <p style={{ fontSize: 9, color: GRAY500 }}>{[v.cargo, v.empresa].filter(Boolean).join(' · ')}</p>
                              )}
                            </div>
                            <span style={{ fontSize: 8.5, fontWeight: 700, color: vc.color,
                              background: `${vc.border}55`, padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>
                              {vc.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 8.5, color: nivel === 'corporativo' ? GREEN : GRAY400,
                            fontWeight: 600, marginBottom: v.comentario ? 5 : 0 }}>
                            {nivel === 'corporativo' ? '🏢 Email corporativo verificado' : '📧 Email personal verificado'}
                          </p>
                          {v.comentario && (
                            <p style={{ fontSize: 10, color: GRAY700, fontStyle: 'italic', lineHeight: 1.55 }}>
                              "{v.comentario}"
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <PF nombre={nombreCompleto} trazaId={persona.traza_id} page={6} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            PÁGINA FINAL · AUTENTICIDAD Y SELLO
        ════════════════════════════════════════════════════════ */}
        <div className="pb" style={{ background: '#fff' }}>
          <Strip section="Autenticidad y Metodología" />
          <div style={{ padding: '32px 48px' }}>
            <SH title="Sello de Autenticidad" sub="Metodología, transparencia y verificación del documento" />

            {/* Metodología del índice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: GRAY50, borderRadius: 12, padding: '16px' }} className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: BRAND, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>Qué mide TRAZA</p>
                {[
                  'Objetivos acordados y verificados por supervisores',
                  'Validaciones ponderadas por nivel de confianza del emisor',
                  'Regularidad y consistencia del registro de avances',
                  'Evolución temporal del desempeño objetivo',
                  'Alineación entre autopercepción y feedback externo',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                    <span style={{ color: GREEN, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 10, color: GRAY700, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: GRAY50, borderRadius: 12, padding: '16px' }} className="nb">
                <p style={{ fontSize: 10, fontWeight: 700, color: RED, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>Qué no hace TRAZA</p>
                {[
                  'No inventa ni estima datos sin evidencia registrada',
                  'No pondera por percepciones subjetivas sin respaldo',
                  'No permite que el colaborador manipule validaciones externas',
                  'No comparte datos sin autorización explícita del titular',
                  'No emite juicios de valor sobre la persona como individuo',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                    <span style={{ color: RED, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✕</span>
                    <p style={{ fontSize: 10, color: GRAY700, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sello de verificación */}
            <div style={{
              background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`,
              borderRadius: 16, padding: '24px 28px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 24,
            }} className="nb">
              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8.5, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Documento verificado por TRAZA
                </p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                  {nombreCompleto}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                  {persona.cargo ?? '—'} · {empNombreActual}
                </p>
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {persona.traza_id && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ID TRAZA</p>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em' }}>{persona.traza_id}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Índice Global</p>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{indice.score}/100 · {badge.label}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Generado</p>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{hoy}</p>
                  </div>
                </div>
              </div>

              {/* QR real */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR de verificación"
                    style={{ width: 80, height: 80, borderRadius: 8, display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 80, height: 80, background: 'rgba(255,255,255,0.12)',
                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2.5,
                    padding: 8,
                  }}>
                    {Array.from({ length: 49 }, (_, i) => (
                      <div key={i} style={{
                        borderRadius: 0.5,
                        background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,12,19,26,33,40,10,24,38].includes(i)
                          ? 'rgba(255,255,255,0.85)' : 'transparent',
                      }} />
                    ))}
                  </div>
                )}
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, marginTop: 5 }}>Verificar en línea</p>
                {persona.traza_id && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, marginTop: 2, fontFamily: 'monospace' }}>
                    traza.app/p/{persona.traza_id}
                  </p>
                )}
              </div>
            </div>

            {/* Nota IA */}
            <div style={{ background: LIGHT, borderRadius: 10, padding: '12px 16px',
              border: `1px solid ${PRIMARY}25`, marginBottom: 20 }} className="nb">
              <p style={{ fontSize: 9, fontWeight: 700, color: PRIMARY, letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 5 }}>✦ Sobre el análisis generado por IA</p>
              <p style={{ fontSize: 9.5, color: GRAY600, lineHeight: 1.65 }}>
                Las secciones marcadas con "✦ Análisis generado por IA" en este documento son síntesis
                narrativas producidas por inteligencia artificial a partir de los datos verificados registrados en TRAZA.
                No reemplazan el juicio humano ni constituyen evaluaciones de rendimiento formales.
                Todos los datos numéricos y validaciones son registros objetivos, auditables e independientes de la IA.
              </p>
            </div>

            {/* Footer final */}
            <div style={{ paddingTop: 16, borderTop: `1px solid ${GRAY100}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>T</span>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: BRAND }}>TRAZA · Performance Intelligence</p>
                  <p style={{ fontSize: 8.5, color: GRAY400 }}>El estándar verificado de desempeño profesional</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: GRAY400 }}>traza.app · {hoy}</p>
                <p style={{ fontSize: 8.5, color: GRAY300 }}>
                  Datos registrados y verificados · {objetivos.length} obj. · {avances.length} avances · {indice.score}/100
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div id="print-bar" style={{ height: 32 }} />
    </>
  )
}
