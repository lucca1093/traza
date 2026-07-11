'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, formatFecha } from '@/lib/traza'
import type { Objetivo } from '@/types'

/* ─── Paleta TRAZA ────────────────────────────────────────── */
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const LIGHT   = '#EDEFFD'
const GREEN   = '#16a34a'
const AMBER   = '#d97706'
const GRAY50  = '#F8FAFC'
const GRAY100 = '#F1F5F9'
const GRAY300 = '#CBD5E1'
const GRAY500 = '#64748B'
const GRAY900 = '#0F172A'

/* ─── Score color ─────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 85) return GREEN
  if (s >= 65) return PRIMARY
  if (s >= 40) return AMBER
  return GRAY300
}

function scoreBadge(nivel: string) {
  if (nivel === 'Élite')         return { label: 'Élite',          bg: '#dcfce7', color: GREEN }
  if (nivel === 'Avanzado')      return { label: 'Avanzado',       bg: LIGHT,     color: PRIMARY }
  if (nivel === 'En desarrollo') return { label: 'En desarrollo',  bg: '#fef3c7', color: AMBER }
  return { label: 'Inicial', bg: GRAY100, color: GRAY500 }
}

/* ─── SVG ring ─────────────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      {/* Fondo */}
      <circle cx="64" cy="64" r={r} fill="none" stroke={GRAY100} strokeWidth="10" />
      {/* Arco score */}
      <circle
        cx="64" cy="64" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
      />
      {/* Score en el centro */}
      <text x="64" y="58" textAnchor="middle" fontSize="28" fontWeight="900" fill={color} fontFamily="'Plus Jakarta Sans', Inter, sans-serif">{score}</text>
      <text x="64" y="75" textAnchor="middle" fontSize="10" fill={GRAY500} fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

/* ─── Mini barra de módulo ──────────────────────────────────── */
function ModuleBar({ label, pct, val, color }: { label: string; pct: string; val: number; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: GRAY500 }}>{label} <span style={{ color: GRAY300 }}>{pct}</span></span>
        <span style={{ fontSize: 10, fontWeight: 700, color: GRAY900 }}>{val}</span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: GRAY100, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${val}%`, background: color }} />
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function ImprimirPage() {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [data, setData] = useState<{
    persona:    any
    objetivos:  Objetivo[]
    avances:    any[]
  } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No autenticado'); setLoading(false); return }

      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .eq('empleo_activo', true)
        .single()

      if (!persona) { setError('No se encontró el perfil.'); setLoading(false); return }

      const { data: objetivos } = await supabase
        .from('objetivos')
        .select('*')
        .eq('persona_id', persona.id)
        .order('created_at', { ascending: false })

      const objs = (objetivos ?? []) as Objetivo[]
      let avances: any[] = []
      if (objs.length > 0) {
        const { data: av } = await supabase
          .from('objetivo_avances')
          .select('*')
          .in('objetivo_id', objs.map(o => o.id))
        avances = av ?? []
      }
      setData({ persona, objetivos: objs, avances })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: GRAY500 }}>
        Preparando informe…
      </div>
    )
  }
  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: GRAY500 }}>
        {error || 'Error al cargar datos.'}
      </div>
    )
  }

  const { persona, objetivos, avances } = data
  const supVerificado = persona.supervisor_verificado ?? true
  const indice  = calcularIndiceTraza(objetivos, avances, [], supVerificado)
  const color   = scoreColor(indice.score)
  const badge   = scoreBadge(indice.nivel)
  const hoy     = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  const completados = objetivos.filter(o => o.estado === 'Completado')
  const validados   = objetivos.filter(o => o.validacion === 'De acuerdo')
  const enCurso     = objetivos.filter(o => (o.estado as string) === 'En curso' || o.estado === 'En progreso')

  const modulos = [
    { label: 'Resultados',   pct: '35%', val: indice.moduloA,    color: PRIMARY },
    { label: 'Cumplimiento', pct: '25%', val: indice.moduloB,    color: PRIMARY },
    { label: 'Proactividad', pct: '20%', val: indice.moduloC,    color: PRIMARY },
    { label: 'Alineación',   pct: '10%', val: indice.alineacion, color: '#0891b2' },
    { label: 'Evolución',    pct: '10%', val: indice.evolucion,  color: AMBER },
  ]

  return (
    <>
      {/* ── Estilos de impresión ─────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        @media print {
          #print-btn { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* ── Botón imprimir (solo pantalla) ───────────────────── */}
      <div
        id="print-btn"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: BRAND, padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14 }}>
          Informe profesional · TRAZA
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: 8, padding: '6px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Volver
          </button>
          <button
            onClick={() => window.print()}
            style={{
              background: '#fff', border: 'none', color: BRAND,
              borderRadius: 8, padding: '7px 18px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {/* ── Documento A4 ─────────────────────────────────────── */}
      <div
        style={{
          width: 794,
          minHeight: 1123,
          margin: '56px auto 40px',
          background: '#fff',
          boxShadow: '0 4px 40px rgba(0,0,0,0.12)',
          fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
        }}
      >
        {/* ── Header banda azul ── */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`, padding: '36px 48px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Logo + nombre */}
            <div>
              {/* Logo TRAZA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px' }}>T</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 18, letterSpacing: '0.04em' }}>
                  TRAZA
                </span>
              </div>
              <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, lineHeight: 1.1, marginBottom: 6 }}>
                {persona.nombre} {persona.apellido}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 }}>
                {persona.cargo ?? '—'}
              </p>
              {persona.area && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{persona.area}</p>
              )}
              {persona.empresa_actual_nombre && (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                  {persona.empresa_actual_nombre}
                </p>
              )}
            </div>

            {/* Score ring + ID */}
            <div style={{ textAlign: 'center' }}>
              <ScoreRing score={indice.score} color="#fff" />
              <div style={{
                marginTop: 8,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 8, padding: '4px 12px',
                display: 'inline-block',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em' }}>
                  ÍNDICE TRAZA
                </span>
              </div>
            </div>
          </div>

          {/* Sub-banda: ID + badge + fecha */}
          <div style={{
            marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', gap: 24,
          }}>
            {persona.traza_id && (
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em' }}>
                  ID TRAZA
                </span>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', marginTop: 2 }}>
                  {persona.traza_id}
                </p>
              </div>
            )}
            <div style={{
              background: badge.bg, borderRadius: 20, padding: '4px 12px',
            }}>
              <span style={{ color: badge.color, fontWeight: 700, fontSize: 11 }}>{badge.label}</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                Generado el {hoy}
              </span>
            </div>
          </div>
        </div>

        {/* ── Cuerpo del informe ── */}
        <div style={{ padding: '36px 48px' }}>

          {/* ── Fila 1: Métricas + Módulos ── */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>

            {/* Métricas resumen */}
            <div style={{
              flex: '0 0 200px',
              background: GRAY50, borderRadius: 16, padding: '20px',
              border: `1px solid ${GRAY100}`,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GRAY500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                Resumen
              </p>
              {[
                { label: 'Objetivos total',    val: objetivos.length },
                { label: 'Completados',         val: completados.length },
                { label: 'Validados ✓',         val: validados.length },
                { label: 'En curso',            val: enCurso.length },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: GRAY500 }}>{m.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: GRAY900 }}>{m.val}</span>
                </div>
              ))}
              {/* Supervisor */}
              {persona.supervisor_email && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${GRAY100}` }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: GRAY500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Supervisor
                  </p>
                  <p style={{ fontSize: 11, color: GRAY900, fontWeight: 600 }}>
                    {persona.supervisor_nombre || persona.supervisor_email}
                  </p>
                  <p style={{ fontSize: 9, color: supVerificado ? GREEN : AMBER, fontWeight: 600, marginTop: 2 }}>
                    {supVerificado ? '✓ Verificado' : '⏳ Pendiente'}
                  </p>
                </div>
              )}
            </div>

            {/* Módulos del Índice */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GRAY500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                Desglose del Índice Traza
              </p>
              {/* Score grande */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color, lineHeight: 1 }}>{indice.score}</span>
                <span style={{ fontSize: 13, color: GRAY500, paddingBottom: 6 }}>/100</span>
              </div>
              {/* Barras */}
              {modulos.map(m => (
                <ModuleBar key={m.label} {...m} />
              ))}
              <p style={{ fontSize: 9, color: GRAY300, marginTop: 10 }}>
                A (Resultados) · B (Cumplimiento) · C (Proactividad) · D (Alineación) · E (Evolución)
              </p>
            </div>
          </div>

          {/* ── Historial de objetivos ── */}
          <div>
            <p style={{
              fontSize: 10, fontWeight: 700, color: GRAY500, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 14,
              paddingBottom: 10, borderBottom: `1px solid ${GRAY100}`,
            }}>
              Historial de objetivos
            </p>

            {objetivos.length === 0 ? (
              <p style={{ fontSize: 12, color: GRAY500 }}>Sin objetivos registrados.</p>
            ) : (
              <div>
                {objetivos.map((o, idx) => {
                  const validStyle: Record<string, { bg: string; color: string }> = {
                    'De acuerdo':                  { bg: '#dcfce7', color: '#15803d' },
                    'Parcialmente de acuerdo':     { bg: '#fef3c7', color: '#92400e' },
                    'En desacuerdo':               { bg: '#fee2e2', color: '#b91c1c' },
                  }
                  const estadoStyle: Record<string, { bg: string; color: string }> = {
                    'Completado':  { bg: '#dcfce7', color: '#15803d' },
                    'En progreso': { bg: LIGHT,     color: PRIMARY    },
                    'Pendiente':   { bg: GRAY100,   color: GRAY500    },
                  }
                  const vs = o.validacion ? validStyle[o.validacion] : null
                  const es = estadoStyle[o.estado as string] ?? { bg: GRAY100, color: GRAY500 }

                  return (
                    <div
                      key={o.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: idx < objetivos.length - 1 ? `1px solid ${GRAY100}` : 'none',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      {/* Fila título + estado + validación */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Número */}
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: LIGHT, color: PRIMARY,
                          fontSize: 10, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 1,
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: GRAY900, lineHeight: 1.3 }}>
                            {o.titulo}
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Estado */}
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                              background: es.bg, color: es.color,
                            }}>
                              {o.estado}
                            </span>
                            {/* Validación */}
                            {vs && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                background: vs.bg, color: vs.color,
                              }}>
                                {o.validacion === 'De acuerdo' ? '✓ Validado' : o.validacion}
                              </span>
                            )}
                            {/* Fecha */}
                            {o.fecha_limite && (
                              <span style={{ fontSize: 10, color: GRAY500 }}>
                                {formatFecha(o.fecha_limite)}
                              </span>
                            )}
                          </div>
                          {/* Comentario supervisor */}
                          {o.comentario_supervisor?.trim() && (
                            <p style={{
                              fontSize: 11, color: GRAY500, fontStyle: 'italic',
                              marginTop: 6, paddingLeft: 10,
                              borderLeft: `2px solid ${GRAY100}`,
                              lineHeight: 1.5,
                            }}>
                              "{o.comentario_supervisor}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Pie de página ── */}
          <div style={{
            marginTop: 40, paddingTop: 20, borderTop: `1px solid ${GRAY100}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: BRAND,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>T</span>
              </div>
              <span style={{ color: GRAY500, fontWeight: 700, fontSize: 11 }}>TRAZA</span>
            </div>
            <p style={{ fontSize: 10, color: GRAY300 }}>
              Este informe refleja desempeño verificado por supervisores y validadores externos.
            </p>
            {persona.traza_id && (
              <p style={{ fontSize: 10, color: GRAY300 }}>
                traza.app/p/{persona.traza_id}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Espaciado inferior solo en pantalla ── */}
      <div id="print-btn" style={{ height: 40 }} />
    </>
  )
}
