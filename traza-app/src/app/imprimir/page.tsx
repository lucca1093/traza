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
    persona:             any
    objetivos:           Objetivo[]
    avances:             any[]
    validacionesExternas: any[]
    reconocimientos:     any[]
  } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); setLoading(false); return }

      const { data: persona } = await supabase
        .from('personas').select('*')
        .eq('user_id', user.id).eq('empleo_activo', true).single()
      if (!persona) { setError('No se encontró el perfil.'); setLoading(false); return }

      const [{ data: objRaw }, { data: valExtRaw }, { data: reconRaw }] = await Promise.all([
        supabase.from('objetivos').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }),
        supabase.from('validaciones_externas').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }),
        supabase.from('reconocimientos').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }),
      ])

      const objs = (objRaw ?? []) as Objetivo[]
      let avances: any[] = []
      if (objs.length > 0) {
        const { data: av } = await supabase
          .from('objetivo_avances').select('*')
          .in('objetivo_id', objs.map(o => o.id))
        avances = av ?? []
      }

      setData({
        persona,
        objetivos: objs,
        avances,
        validacionesExternas: valExtRaw ?? [],
        reconocimientos: reconRaw ?? [],
      })
      setLoading(false)

      // Generar narrativa IA en paralelo
      if (objs.length > 0) {
        const indice = calcularIndiceTraza(objs, avances, [], persona.supervisor_verificado ?? true)
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

  const { persona, objetivos, avances, validacionesExternas, reconocimientos } = data
  const supVerificado = persona.supervisor_verificado ?? true
  const indice  = calcularIndiceTraza(objetivos, avances, [], supVerificado)
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
              <SecHeader title="Score global" />
              <div style={{ textAlign: 'center', background: GRAY50, borderRadius: 14, padding: '20px 10px', border: `1px solid ${GRAY100}` }}>
                <p style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1 }}>{indice.score}</p>
                <p style={{ fontSize: 12, color: GRAY500 }}>/100</p>
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

          {/* Historial de objetivos */}
          <div>
            <SecHeader title={`Historial completo de objetivos (${objetivos.length})`} />
            {objetivos.length === 0 ? (
              <p style={{ fontSize: 12, color: GRAY500 }}>Sin objetivos registrados.</p>
            ) : (
              objetivos.map((o, idx) => {
                const estadoColor: Record<string, string> = {
                  'Completado': GREEN, 'En progreso': PRIMARY, 'Pendiente': GRAY500,
                }
                const valColor: Record<string, { bg: string; color: string }> = {
                  'De acuerdo':               { bg: '#dcfce7', color: '#15803d' },
                  'Parcialmente de acuerdo':  { bg: '#fef3c7', color: '#92400e' },
                  'En desacuerdo':            { bg: '#fee2e2', color: '#b91c1c' },
                }
                const ec = estadoColor[o.estado as string] ?? GRAY500
                const vc = o.validacion ? valColor[o.validacion] : null
                const objAvances = avances.filter(a => a.objetivo_id === o.id)

                return (
                  <div key={o.id} className="no-break" style={{
                    padding: '14px 0',
                    borderBottom: idx < objetivos.length - 1 ? `1px solid ${GRAY100}` : 'none',
                  }}>
                    {/* Fila principal */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, background: LIGHT, color: PRIMARY,
                        fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: GRAY900, lineHeight: 1.3, marginBottom: 5 }}>{o.titulo}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                          {/* Estado */}
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: ec + '18', color: ec,
                          }}>{o.estado}</span>
                          {/* Validación */}
                          {vc && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: vc.bg, color: vc.color }}>
                              {o.validacion === 'De acuerdo' ? '✓ Validado' : o.validacion}
                            </span>
                          )}
                          {/* Fecha */}
                          {o.fecha_limite && (
                            <span style={{ fontSize: 10, color: GRAY500 }}>{formatFecha(o.fecha_limite)}</span>
                          )}
                          {/* Avances count */}
                          {objAvances.length > 0 && (
                            <span style={{ fontSize: 10, color: GRAY500 }}>{objAvances.length} avance{objAvances.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                        {/* Autoevaluación + validaciones */}
                        {((o as any).autoevaluacion || o.validacion || (o as any).validacion_admin) && (
                          <div style={{ display: 'flex', gap: 14, marginBottom: 4, flexWrap: 'wrap' }}>
                            {(o as any).autoevaluacion && (
                              <span style={{ fontSize: 10, color: GRAY500 }}>Vos: <strong style={{ color: GRAY700 }}>{(o as any).autoevaluacion}</strong></span>
                            )}
                            {o.validacion && (
                              <span style={{ fontSize: 10, color: GRAY500 }}>Supervisor: <strong style={{ color: GRAY700 }}>{o.validacion}</strong></span>
                            )}
                            {(o as any).validacion_admin && (
                              <span style={{ fontSize: 10, color: GRAY500 }}>Admin: <strong style={{ color: GRAY700 }}>{(o as any).validacion_admin}</strong></span>
                            )}
                          </div>
                        )}
                        {/* Comentario supervisor */}
                        {o.comentario_supervisor?.trim() && (
                          <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${GRAY100}` }}>
                            <p style={{ fontSize: 10, color: GRAY500, fontStyle: 'italic', lineHeight: 1.55 }}>
                              Supervisor: "{o.comentario_supervisor}"
                            </p>
                          </div>
                        )}
                        {/* Comentario empleado */}
                        {(o as any).comentario_empleado?.trim() && (
                          <div style={{ marginTop: 4, paddingLeft: 10, borderLeft: `2px solid ${GRAY100}` }}>
                            <p style={{ fontSize: 10, color: GRAY500, fontStyle: 'italic', lineHeight: 1.55 }}>
                              Tu autoevaluación: "{(o as any).comentario_empleado}"
                            </p>
                          </div>
                        )}
                        {/* Evidencia URL */}
                        {(o as any).evidencia_url && (
                          <p style={{ fontSize: 10, color: PRIMARY, marginTop: 4 }}>
                            Evidencia: {(o as any).evidencia_url}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
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
