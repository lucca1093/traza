'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, calcularRacha } from '@/lib/traza'
import type { Objetivo } from '@/types'
import { Sparkles, RefreshCw } from 'lucide-react'

const PRIMARY = '#3350D0'
const BRAND   = '#1C2B90'
const LIGHT   = '#EDEFFD'

export default function CareerInsightsCard() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading,  setLoading]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const [error,    setError]    = useState('')

  async function fetchInsights() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: persona } = await supabase
        .from('personas').select('*')
        .eq('user_id', user.id).eq('empleo_activo', true).single()
      if (!persona) return

      const { data: objetivosRaw } = await supabase
        .from('objetivos').select('*')
        .eq('persona_id', persona.id)
        .order('created_at', { ascending: false })
      const objetivos = (objetivosRaw ?? []) as Objetivo[]

      const { data: avancesRaw } = await supabase
        .from('objetivo_avances').select('*')
        .in('objetivo_id', objetivos.map(o => o.id))
      const avances = avancesRaw ?? []

      const indice = calcularIndiceTraza(objetivos, avances, [], persona.supervisor_verificado ?? true)
      const racha  = calcularRacha(avances)

      const res = await fetch('/api/analisis-carrera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:    persona.nombre,
          cargo:     persona.cargo,
          area:      persona.area,
          score:     indice.score,
          moduloA:   indice.moduloA,
          moduloB:   indice.moduloB,
          moduloC:   indice.moduloC,
          alineacion: indice.alineacion,
          proactividad: indice.proactividad,
          total:      indice.total,
          completados: indice.completados,
          positivos:  indice.positivos,
          racha,
          objetivosRecientes: objetivos.slice(0, 5).map(o => ({
            titulo:    o.titulo,
            estado:    o.estado,
            validacion: o.validacion,
          })),
        }),
      })
      const json = await res.json()
      setInsights(json.insights ?? [])
    } catch {
      setError('No se pudieron generar los insights.')
    }
    setLoading(false)
    setLoaded(true)
  }

  return (
    <div
      className="traza-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #F1F5F9' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: LIGHT }}
          >
            <Sparkles size={14} strokeWidth={1.75} style={{ color: PRIMARY }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              Insights de carrera
            </h2>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Análisis personalizado con IA
            </p>
          </div>
        </div>

        {loaded && !loading && (
          <button
            onClick={fetchInsights}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: PRIMARY }}
          >
            <RefreshCw size={12} />
            Regenerar
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <div className="px-6 py-5">
        {!loaded && !loading && (
          <div className="flex flex-col items-center py-4 gap-3 text-center">
            <p className="text-sm" style={{ color: '#64748B' }}>
              Analizá tu trayectoria y recibí observaciones concretas sobre tu desempeño.
            </p>
            <button
              onClick={fetchInsights}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${BRAND}, ${PRIMARY})` }}
            >
              <Sparkles size={14} />
              Generar análisis
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0"
              style={{ borderColor: LIGHT, borderTopColor: PRIMARY }}
            />
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Analizando tu historial…
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs py-2" style={{ color: '#dc2626' }}>{error}</p>
        )}

        {loaded && !loading && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-xl"
                style={{ background: i === 0 ? LIGHT : '#F8FAFC' }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                  style={{
                    background: i === 0 ? PRIMARY : '#E2E8F0',
                    color: i === 0 ? '#fff' : '#64748B',
                  }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
