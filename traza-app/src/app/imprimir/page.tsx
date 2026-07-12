'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, formatFecha } from '@/lib/traza'
import type { Objetivo } from '@/types'

/* ─── Paleta ─────────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'
const GREEN   = '#16a34a'
const AMBER   = '#d97706'
const RED     = '#dc2626'
const GRAY50  = '#F8FAFC'
const GRAY100 = '#F1F5F9'
const GRAY300 = '#CBD5E1'
const GRAY500 = '#64748B'
const GRAY700 = '#334155'
const GRAY900 = '#0F172A'

function scoreColor(s: number) {
  if (s >= 85) return GREEN
  if (s >= 65) return PRIMARY
  if (s >= 40) return AMBER
  return GRAY300
}
function scoreBadge(nivel: string): { label: string; bg: string; color: string } {
  if (nivel === 'Élite')         return { label: 'Élite',         bg: '#dcfce7', color: GREEN   }
  if (nivel === 'Avanzado')      return { label: 'Avanzado',      bg: LIGHT,     color: PRIMARY  }
  if (nivel === 'En desarrollo') return { label: 'En desarrollo', bg: '#fef3c7', color: AMBER   }
  return { label: 'Inicial', bg: GRAY100, color: GRAY500 }
}

/* ─── Score ring SVG ──────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke={GRAY100} strokeWidth="9" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 60 60)" />
      <text x="60" y="54" textAnchor="middle" fontSize="26" fontWeight="900" fill={color}
        fontFamily="'Plus Jakarta Sans', Inter, sans-serif">{score}</text>
      <text x="60" y="70" textAnchor="middle" fontSize="10" fill={GRAY500}
        fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

/* ─── Barra de módulo ─────────────────────────────────────── */
function Bar({ label, pct, val, color, desc }: { label: string; pct: string; val: number; color: string; desc: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GRAY700 }}>
          {label} <span style={{ fontSize: 10, fontWeight: 400, color: GRAY500 }}>{pct}</span>
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{val}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: GRAY100, overflow: 'hidden', marginBottom: 2 }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${val}%`, background: color }} />
      </div>
      <p style={{ fontSize: 9, color: GRAY500 }}>{desc}</p>
    </div>
  )
}

/* ─── Sección header ──────────────────────────────────────── */
function SecHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: GRAY500, letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: 12,
      paddingBottom: 8, borderBottom: `1px solid ${GRAY100}`,
    }}>
      {title}
    </div>
  )
}

/* ─── Main ────────────────────────────────────────────────── */
export default function ImprimirPage() {
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [narrativa,  setNarrativa]  = useState('')
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

      // Traemos TODAS las personas del usuario por user_id
      const { data: porUserId } = await supabase
        .from('personas').select('*').eq('user_id', user.id)
      if (!porUserId || porUserId.length === 0) {
        setError('No se encontró el perfil.'); setLoading(false); return
      }
      const persona = porUserId.find(p => p.empleo_activo !== false) ?? porUserId[0]

      // También buscamos por traza_id para incluir historial completo de carrera
      // (el seed puede tener personas sin user_id pero con el mismo traza_id)
      let todasPersonas = porUserId
      if (persona.traza_id) {
        const { data: porTrazaId } = await supabase
          .from('personas').select('*').eq('traza_id', persona.traza_id)
          .order('fecha_inicio_empleo', { ascending: false })
        if (porTrazaId && porTrazaId.length > 0) {
          // Merge: todas las de traza_id + las de user_id que no estén ya
          const merged = [...porTrazaId]
          porUserId.forEach(p => {
            if (!merged.find(x => x.id === p.id)) merged.push(p)
          })
          todasPersonas = merged.sort((a, b) =>
            (b.fecha_inicio_empleo ?? '').localeCompare(a.fecha_inicio_empleo ?? ''))
        }
      }

      // Combinamos objetivos y avances de todas las empresas para score global
      let todosObjs: Objetivo[] = []
      let todosAvances: any[]   = []
      // También agrupamos por empresa para mostrar en el PDF
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

      // Validaciones externas de TODOS los objetivos (para score global correcto)
      // Reconocimientos solo de la persona activa (para display)
      const allObjIds = todosObjs.length > 0 ? todosObjs.map(o => o.id) : ['00000000-0000-0000-0000-000000000000']
      const [{ data: valExtRaw }, { data: reconRaw }] = await Promise.all([
        supabase.from('validaciones_externas').select('*').in('objetivo_id', allObjIds).order('created_at', { ascending: false }),
        supabase.from('reconocimientos').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }),
      ])

      setData({
        persona,
        objetivos: todosObjs,
        avances: todosAvances,
        validacionesExternas: valExtRaw ?? [],
        reconocimientos: reconRaw ?? [],
        empresas,
      })
      setLoading(false)

      // Generar narrativa IA en paralelo
      if (todosObjs.length > 0) {
        const indice = calcularIndiceTraza(todosObjs, todosAvances, valExtRaw ?? [], persona.supervisor_verificado ?? true)
        try {
          const res = await fetch('/api/narrativa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: persona.nombre, apellido: persona.apellido,
              cargo: persona.cargo, area: persona.area,
              score: indice.score, moduloA: indice.moduloA,
              moduloB: indice.moduloB, moduloC: indice.moduloC,
              autonomo: indice.moduloC, cumplimiento: indice.cumplimiento,
              total: indice.total, completados: indice.completados, positivos: indice.positivos,
            }),
          })
          const json = await res.json()
          if (json.narrativa) setNarrativa(json.narrativa)
        } catch { /* sin narrativa */ }
      }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: GRAY500 }}>
      Preparando informe…
    </div>
  )
  if (error || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: GRAY500 }}>
      {error || 'Error al cargar datos.'}
    </div>
  )

  const { persona, objetivos, avances, validacionesExternas, reconocimientos, empresas } = data
  const supVerificado = persona.supervisor_verificado ?? true
  const indice  = calcularIndiceTraza(objetivos, avances, validacionesExternas, supVerificado)
  const color   = scoreColor(indice.score)
  const badge   = scoreBadge(indice.nivel)
  const hoy     = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  const completados  = objetivos.filter(o => o.estado === 'Completado')
  const validados    = objetivos.filter(o => o.validacion === 'De acuerdo')
  const parciales    = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo')
  const negativos    = objetivos.filter(o => o.validacion === 'En desacuerdo')
  const conFeedback  = objetivos.filter(o => o.comentario_supervisor?.trim())

  // Contar semanas con avance (racha acumulada)
  const semanasConAvance = new Set(
    avances.map(a => {
      const d = new Date(a.creado_en)
      const startOfYear = new Date(d.getFullYear(), 0, 1)
      const week = Math.floor((d.getTime() - startOfYear.getTime()) / (7 * 24 * 3600 * 1000))
      return `${d.getFullYear()}-W${week}`
    })
  ).size

  const modulos = [
    { label: 'Resultados validados',   pct: '35%', val: indice.moduloA,    color: PRIMARY,    desc: 'Calificaciones de supervisores, admin y autoevaluación ponderadas' },
    { label: 'Cumplimiento',           pct: '25%', val: indice.moduloB,    color: GREEN,      desc: 'Porcentaje de objetivos vencidos que fueron completados' },
    { label: 'Proactividad',           pct: '20%', val: indice.moduloC,    color: '#7c3aed',  desc: 'Regularidad de avances registrados semana a semana' },
    { label: 'Alineación',             pct: '10%', val: indice.alineacion, color: '#0891b2',  desc: 'Coherencia entre autoevaluación y validación del supervisor' },
    { label: 'Evolución',              pct: '10%', val: indice.evolucion,  color: AMBER,      desc: 'Tendencia del score respecto al período anterior (90 días)' },
  ]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e2e8f0; }
        @media print {
          #print-bar { display: none !important; }
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Barra superior (solo pantalla) ─── */}
      <div id="print-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: BRAND, padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13 }}>
          Informe Profesional TRAZA · {persona.nombre} {persona.apellido}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.history.back()} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
          }}>← Volver</button>
          <button onClick={() => window.print()} style={{
            background: '#fff', border: 'none', color: BRAND,
            borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>⬇ Descargar PDF</button>
        </div>
      </div>

      {/* ── Documento A4 ─── */}
      <div style={{
        width: 794, margin: '52px auto 40px',
        background: '#fff',
        boxShadow: '0 4px 40px rgba(0,0,0,0.15)',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
      }}>

        {/* ══ PÁGINA 1 ══════════════════════════════════════════ */}

        {/* Header azul */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`, padding: '32px 48px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>T</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 16, letterSpacing: '0.04em' }}>TRAZA</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>· Informe Profesional Verificado</span>
              </div>
              {/* Nombre */}
              <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}>
                {persona.nombre} {persona.apellido}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 3 }}>{persona.cargo ?? '—'}</p>
              {persona.area && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 3 }}>{persona.area}</p>}
              {(persona.empresa_actual_nombre) && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{persona.empresa_actual_nombre}</p>
              )}
            </div>
            {/* Ring */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <ScoreRing score={indice.score} color="#fff" />
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '3px 12px', marginTop: 6, display: 'inline-block' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em' }}>ÍNDICE TRAZA</span>
              </div>
            </div>
          </div>

          {/* Sub-banda */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {persona.traza_id && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em' }}>ID TRAZA</p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em' }}>{persona.traza_id}</p>
              </div>
            )}
            <div style={{ background: badge.bg, borderRadius: 20, padding: '3px 12px' }}>
              <span style={{ color: badge.color, fontWeight: 700, fontSize: 11 }}>{badge.label}</span>
            </div>
            {persona.supervisor_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: supVerificado ? '#86efac' : '#fde68a', fontWeight: 600 }}>
                  {supVerificado ? '✓ Supervisor verificado' : '⏳ Supervisor pendiente'}
                </span>
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>Generado el {hoy}</span>
            </div>
          </div>
        </div>

        {/* Cuerpo página 1 */}
        <div style={{ padding: '32px 48px' }}>

          {/* Métricas en grid */}
          <div style={{ marginBottom: 28 }}>
            <SecHeader title="Resumen de desempeño" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {[
                { val: objetivos.length,          label: 'Objetivos\ntotales',       color: BRAND   },
                { val: completados.length,         label: 'Completados',              color: GREEN   },
                { val: validados.length,           label: 'Validados\npositivos',     color: PRIMARY },
                { val: parciales.length,           label: 'Con\nobservaciones',       color: '#7c3aed' },
                { val: semanasConAvance,           label: 'Semanas\ncon actividad',   color: AMBER   },
                { val: validacionesExternas.filter(v => v.confirmado !== false).length, label: 'Validaciones\nexternas', color: '#0891b2' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', background: GRAY50, borderRadius: 12, padding: '14px 6px', border: `1px solid ${GRAY100}` }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.val}</p>
                  <p style={{ fontSize: 9, color: GRAY500, marginTop: 4, lineHeight: 1.35, whiteSpace: 'pre-line' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Índice TRAZA */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
            {/* Score grande */}
            <div style={{ flex: '0 0 130px' }}>
              <SecHeader title="Índice global · carrera completa" />
              <div style={{ textAlign: 'center', background: GRAY50, borderRadius: 14, padding: '20px 10px', border: `1px solid ${GRAY100}` }}>
                <p style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1 }}>{indice.score}</p>
                <p style={{ fontSize: 12, color: GRAY500 }}>/100 · carrera completa</p>
                <div style={{ background: badge.bg, borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginTop: 8 }}>
                  <span style={{ color: badge.color, fontWeight: 700, fontSize: 10 }}>{badge.label}</span>
                </div>
                <p style={{ fontSize: 9, color: GRAY500, marginTop: 10, lineHeight: 1.4 }}>
                  {`${Math.round((completados.length / Math.max(objetivos.length, 1)) * 100)}% cumplimiento`}
                  {'\n'}
                  {validados.length > 0 && `${Math.round((validados.length / Math.max(objetivos.filter(o => o.validacion).length, 1)) * 100)}% validados +`}
                </p>
              </div>
            </div>

            {/* Módulos */}
            <div style={{ flex: 1 }}>
              <SecHeader title="Desglose del Índice Traza (5 dimensiones)" />
              {modulos.map(m => <Bar key={m.label} {...m} />)}
            </div>
          </div>

          {/* Narrativa IA */}
          {(narrativa) && (
            <div style={{ marginBottom: 28 }} className="no-break">
              <SecHeader title="Perfil profesional · Análisis IA" />
              <div style={{ background: LIGHT, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${PRIMARY}` }}>
                <p style={{ fontSize: 12, color: GRAY700, lineHeight: 1.7 }}>{narrativa}</p>
              </div>
            </div>
          )}

          {/* Supervisor */}
          {persona.supervisor_email && (
            <div style={{ marginBottom: 28 }} className="no-break">
              <SecHeader title="Supervisor / Responsable declarado" />
              <div style={{ background: GRAY50, borderRadius: 12, padding: '12px 16px', border: `1px solid ${GRAY100}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: supVerificado ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>{supVerificado ? '✓' : '⏳'}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: GRAY900 }}>{persona.supervisor_nombre || 'Supervisor'}</p>
                  <p style={{ fontSize: 11, color: GRAY500 }}>{persona.supervisor_email}</p>
                  <p style={{ fontSize: 10, color: supVerificado ? GREEN : AMBER, fontWeight: 600, marginTop: 2 }}>
                    {supVerificado ? 'Verificado · validaciones con peso completo en el Índice' : 'Pendiente de verificación · email enviado al supervisor'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ PÁGINA 2 ══════════════════════════════════════════ */}
        <div style={{ padding: '32px 48px' }} className="page-break">

          {/* Reconocimientos */}
          {reconocimientos.length > 0 && (
            <div style={{ marginBottom: 28 }} className="no-break">
              <SecHeader title={`Reconocimientos recibidos (${reconocimientos.length})`} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {reconocimientos.map((r: any) => (
                  <div key={r.id} style={{ background: '#fffbeb', borderRadius: 12, padding: '12px 14px', border: '1px solid #fde68a' }} className="no-break">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{r.emoji ?? '⭐'}</span>
                      <p style={{ fontSize: 12, fontWeight: 700, color: GRAY900 }}>{r.tipo ?? 'Reconocimiento'}</p>
                    </div>
                    {r.mensaje && <p style={{ fontSize: 11, color: GRAY700, lineHeight: 1.5, fontStyle: 'italic' }}>"{r.mensaje}"</p>}
                    {r.otorgado_por_nombre && (
                      <p style={{ fontSize: 10, color: GRAY500, marginTop: 6 }}>
                        De: {r.otorgado_por_nombre} · {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validaciones externas */}
          {validacionesExternas.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <SecHeader title={`Validaciones externas (${validacionesExternas.length})`} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {validacionesExternas.map((v: any) => {
                  const c = v.calificacion === 'De acuerdo' ? { bg: '#f0fdf4', border: '#86efac', color: GREEN }
                    : v.calificacion === 'Parcialmente de acuerdo' ? { bg: '#fffbeb', border: '#fde68a', color: AMBER }
                    : { bg: '#fef2f2', border: '#fca5a5', color: RED }
                  const nivel = v.nivel_confianza ?? 'personal'
                  return (
                    <div key={v.id} style={{ background: c.bg, borderRadius: 12, padding: '12px 14px', border: `1px solid ${c.border}` }} className="no-break">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: GRAY900 }}>{v.nombre}</p>
                          {(v.cargo || v.empresa) && (
                            <p style={{ fontSize: 10, color: GRAY500 }}>{[v.cargo, v.empresa].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: c.color, background: c.border + '55', padding: '2px 8px', borderRadius: 20 }}>
                          {v.calificacion === 'De acuerdo' ? '✓ Positivo' : v.calificacion}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, color: nivel === 'corporativo' ? GREEN : GRAY500, fontWeight: 600 }}>
                          {nivel === 'corporativo' ? '🏢 Email corporativo' : nivel === 'personal' ? '📧 Email personal' : 'Sin email'}
                        </span>
                        {v.confirmado && <span style={{ fontSize: 9, color: GREEN, fontWeight: 600 }}>· Confirmado</span>}
                      </div>
                      {v.comentario && <p style={{ fontSize: 10, color: GRAY700, fontStyle: 'italic', lineHeight: 1.5 }}>"{v.comentario}"</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historial por empresa */}
          <div>
            <SecHeader title={`Trayectoria profesional verificada · ${objetivos.length} registro${objetivos.length !== 1 ? 's' : ''}`} />

            {empresas.length === 0 ? (
              <p style={{ fontSize: 12, color: GRAY500 }}>Sin registros de objetivos.</p>
            ) : empresas.map((emp, empIdx) => {
              const p       = emp.persona
              const empNombre = p.empresa_actual_nombre ?? 'Empresa'
              const periodo = (() => {
                const fmt = (f: string) => new Date(f).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
                if (!p.fecha_inicio_empleo) return ''
                return p.fecha_fin_empleo
                  ? `${fmt(p.fecha_inicio_empleo)} – ${fmt(p.fecha_fin_empleo)}`
                  : `${fmt(p.fecha_inicio_empleo)} – Actualidad`
              })()
              const empIndice = calcularIndiceTraza(emp.objetivos, emp.avances)
              const empColor  = scoreColor(empIndice.score)

              return (
                <div key={p.id} style={{ marginBottom: empIdx < empresas.length - 1 ? 28 : 0 }}>
                  {/* Cabecera de empresa */}
                  <div style={{
                    background: GRAY50, borderRadius: 12, padding: '12px 16px',
                    border: `1px solid ${GRAY100}`, marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: GRAY900 }}>{empNombre}</p>
                      <p style={{ fontSize: 11, color: GRAY500 }}>
                        {[p.cargo, p.area].filter(Boolean).join(' · ')}
                        {periodo ? ` · ${periodo}` : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: empColor, lineHeight: 1 }}>{empIndice.score}</p>
                      <p style={{ fontSize: 9, color: GRAY500 }}>score en esta empresa</p>
                    </div>
                  </div>

                  {/* Objetivos de esta empresa */}
                  {emp.objetivos.length === 0 ? (
                    <p style={{ fontSize: 11, color: GRAY500, paddingLeft: 8 }}>Sin objetivos registrados en este período.</p>
                  ) : emp.objetivos.map((o, idx) => {
                    const objAvances = emp.avances.filter(a => a.objetivo_id === o.id)

                    // Texto legible del resultado
                    const resultadoTexto = (() => {
                      if (o.validacion === 'De acuerdo')              return { text: 'Validado positivamente por el supervisor', color: GREEN   }
                      if (o.validacion === 'Parcialmente de acuerdo') return { text: 'Supervisor señaló áreas de mejora',          color: AMBER   }
                      if (o.validacion === 'En desacuerdo')           return { text: 'Supervisor no acordó con el resultado',      color: RED     }
                      if (o.estado === 'Completado')                  return { text: 'Completado · pendiente de validación',       color: GRAY500 }
                      if ((o.estado as string) === 'En progreso' || (o.estado as string) === 'En curso')
                                                                       return { text: 'En curso',                                  color: PRIMARY }
                      return { text: 'Pendiente',                                                                                  color: GRAY300 }
                    })()

                    return (
                      <div key={o.id} className="no-break" style={{
                        paddingLeft: 16, paddingTop: 10, paddingBottom: 10,
                        borderLeft: `2px solid ${idx % 2 === 0 ? LIGHT : GRAY100}`,
                        marginLeft: 8, marginBottom: 2,
                      }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: GRAY900, lineHeight: 1.3, marginBottom: 3 }}>
                          {o.titulo}
                        </p>
                        <p style={{ fontSize: 10, color: resultadoTexto.color, fontWeight: 600, marginBottom: o.comentario_supervisor?.trim() ? 5 : 0 }}>
                          {resultadoTexto.text}
                          {o.fecha_limite ? ` · ${formatFecha(o.fecha_limite)}` : ''}
                          {objAvances.length > 0 ? ` · ${objAvances.length} avance${objAvances.length !== 1 ? 's' : ''} registrados` : ''}
                        </p>

                        {/* Comentario del supervisor — lo más valioso para un lector externo */}
                        {o.comentario_supervisor?.trim() && (
                          <p style={{ fontSize: 11, color: GRAY700, fontStyle: 'italic', lineHeight: 1.6, marginTop: 3 }}>
                            "{o.comentario_supervisor}"
                            <span style={{ fontSize: 10, color: GRAY500, fontStyle: 'normal' }}> — supervisor</span>
                          </p>
                        )}

                        {/* Autoevaluación del profesional */}
                        {(o as any).comentario_empleado?.trim() && (
                          <p style={{ fontSize: 10, color: GRAY500, lineHeight: 1.5, marginTop: 2, fontStyle: 'italic' }}>
                            Autoevaluación: "{(o as any).comentario_empleado}"
                          </p>
                        )}

                        {/* Evidencia */}
                        {(o as any).evidencia_url && (
                          <p style={{ fontSize: 9, color: PRIMARY, marginTop: 2 }}>↗ {(o as any).evidencia_url}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Pie de página */}
          <div style={{ marginTop: 36, paddingTop: 18, borderTop: `1px solid ${GRAY100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>T</span>
              </div>
              <span style={{ color: GRAY500, fontWeight: 700, fontSize: 11 }}>TRAZA · Performance Intelligence</span>
            </div>
            <p style={{ fontSize: 10, color: GRAY300, textAlign: 'center', maxWidth: 260, lineHeight: 1.4 }}>
              Este informe refleja datos reales validados por supervisores y terceros verificados.
            </p>
            {persona.traza_id && (
              <p style={{ fontSize: 10, color: GRAY300 }}>traza.app/p/{persona.traza_id}</p>
            )}
          </div>
        </div>
      </div>
      <div id="print-bar" style={{ height: 32 }} />
    </>
  )
}
