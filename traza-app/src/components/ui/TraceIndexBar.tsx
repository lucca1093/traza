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
        <span className={cn('font-bold text-traza-700', size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl')}>
          {score}<span className="text-sm text-gray-400">/100</span>
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: size === 'lg' ? 12 : 8 }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: score >= 85
              ? 'linear-gradient(90deg, #F59E0B, #D97706)'
              : score >= 65
              ? 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
              : score >= 40
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : 'linear-gradient(90deg, #6B7280, #4B5563)',
          }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{cumplimiento}%</p>
            <p className="text-xs text-gray-500">Cumplimiento</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{completados}/{total}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{positivos}</p>
            <p className="text-xs text-gray-500">Validaciones ✓</p>
          </div>
        </div>
      )}

      {/* Modal info */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">¿Cómo se calcula?</h3>
              <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
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
                    style={{ backgroundColor: '#0F4C81' }}>
                    {d.letra}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{d.nombre} <span className="text-gray-400 font-normal">· {d.peso}</span></p>
                    <p className="text-xs text-gray-500 leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Los niveles son: <span className="font-semibold text-gray-700">Élite</span> (85+), <span className="font-semibold text-gray-700">Avanzado</span> (65–84), <span className="font-semibold text-gray-700">En desarrollo</span> (40–64) e <span className="font-semibold text-gray-700">Inicial</span> (menos de 40).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
