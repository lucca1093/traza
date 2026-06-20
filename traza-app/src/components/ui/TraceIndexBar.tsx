'use client'

import { getNivelClasses, cn } from '@/lib/traza'
import type { IndiceTraza } from '@/types'

interface TraceIndexBarProps {
  indice: IndiceTraza
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function TraceIndexBar({ indice, showDetails = true, size = 'md' }: TraceIndexBarProps) {
  const { score, nivel, badge, cumplimiento, completados, total, positivos } = indice

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn(
          'px-2.5 py-1 rounded-full border text-xs font-semibold',
          getNivelClasses(nivel)
        )}>
          {badge}
        </span>
        <span className={cn(
          'font-bold text-traza-700',
          size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
        )}>
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
    </div>
  )
}
