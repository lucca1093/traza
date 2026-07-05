'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { getNivelClasses, cn } from '@/lib/traza'
import type { IndiceTraza } from '@/types'

interface TraceIndexBarProps {
  indice: IndiceTraza
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function TraceIndexBar({ indice, showDetails = true, size = 'md' }: TraceIndexBarProps) {
  const { score, nivel, badge, cumplimiento, completados, total, positivos } = indice
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('px-2.5 py-1 rounded-full border text-xs font-semibold', getNivelClasses(nivel))}>
            {badge}
          </span>
          <button
            onClick={() => setShowInfo(true)}
            className="p-0.5 rounded-full text-gray-300 hover:text-gray-500 transition-colors"
            title="¿Cómo se calcula el Índice Traza?"
          >
            <Info size={14} />
          </button>
        </div>
        <span
          className={cn(size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl')}
          style={{
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            letterSpacing: '-0.04em',
            color: score >= 85 ? '#16a34a' : score >= 65 ? '#3350D0' : score >= 40 ? '#d97706' : '#94a3b8',
          }}
        >
          {score}<span className="text-sm font-normal" style={{ color: '#CBD5E1' }}>/100</span>
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full rounded-full overflow-hidden" style={{ height: size === 'lg' ? 10 : 6, backgroundColor: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: score >= 85
              ? 'linear-gradient(90deg, #F59E0B, #D97706)'
              : score >= 65
              ? 'linear-gradient(90deg, #3350D0, #1C2B90)'
              : score >= 40
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : 'linear-gradient(90deg, #94A3B8, #64748B)',
          }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.02em' }}>{cumplimiento}%</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Cumplimiento</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.02em' }}>{completados}/{total}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Completados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: '-0.02em' }}>{positivos}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Validados ✓</p>
          </div>
        </div>
      )}

      {/* Modal info */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.20)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui" }}>¿Cómo se calcula?</h3>
              <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#94A3B8' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
                <X size={16} />
              </button>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
              El Índice Traza es un score de 0 a 100 que refleja tu desempeño profesional en base a 5 dimensiones.
            </p>

            <div className="space-y-3">
              {[
                { letra: 'A', nombre: 'Resultados validados', peso: '35%', desc: 'Promedio de las validaciones de tus objetivos por supervisor y admin.' },
                { letra: 'B', nombre: 'Cumplimiento',         peso: '25%', desc: 'Cuántos de tus objetivos con fecha de entrega fueron completados.' },
                { letra: 'C', nombre: 'Proactividad',         peso: '20%', desc: 'Regularidad con la que registrás avances semana a semana.' },
                { letra: 'D', nombre: 'Alineación',           peso: '10%', desc: 'Qué tan cerca está tu autoevaluación de la validación del supervisor.' },
                { letra: 'E', nombre: 'Evolución',            peso: '10%', desc: 'Si tu score mejoró o bajó respecto al período anterior.' },
              ].map(d => (
                <div key={d.letra} className="flex gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}>
                    {d.letra}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{d.nombre} <span className="font-normal" style={{ color: '#94A3B8' }}>· {d.peso}</span></p>
                    <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                Los niveles son: <span className="font-semibold" style={{ color: '#0F172A' }}>Élite</span> (85+), <span className="font-semibold" style={{ color: '#0F172A' }}>Avanzado</span> (65–84), <span className="font-semibold" style={{ color: '#0F172A' }}>En desarrollo</span> (40–64) e <span className="font-semibold" style={{ color: '#0F172A' }}>Inicial</span> (menos de 40).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
