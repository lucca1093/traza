import { cn } from '@/lib/traza'
import {
  Users, Target, CheckSquare, TrendingUp, Trophy,
  Building2, BarChart2, FileText, Award, User,
  type LucideIcon
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Target, CheckSquare, TrendingUp, Trophy,
  Building2, BarChart2, FileText, Award, User,
}

// Color del ícono según el tipo de métrica
const ICON_COLORS: Record<string, { bg: string; color: string }> = {
  Users:       { bg: 'rgba(99,102,241,0.10)',  color: '#6366F1' },
  Target:      { bg: 'rgba(15,76,129,0.10)',   color: '#0F4C81' },
  CheckSquare: { bg: 'rgba(16,185,129,0.10)',  color: '#10B981' },
  TrendingUp:  { bg: 'rgba(245,158,11,0.10)',  color: '#D97706' },
  Trophy:      { bg: 'rgba(234,179,8,0.12)',   color: '#CA8A04' },
  Building2:   { bg: 'rgba(15,76,129,0.10)',   color: '#0F4C81' },
  BarChart2:   { bg: 'rgba(99,102,241,0.10)',  color: '#6366F1' },
  FileText:    { bg: 'rgba(107,114,128,0.10)', color: '#6B7280' },
  Award:       { bg: 'rgba(234,179,8,0.12)',   color: '#CA8A04' },
  User:        { bg: 'rgba(15,76,129,0.10)',   color: '#0F4C81' },
}

interface MetricCardProps {
  label: string
  value: string | number
  icon?: string
  sub?: string
  highlight?: boolean
  className?: string
}

export default function MetricCard({ label, value, icon, sub, highlight, className }: MetricCardProps) {
  const Icon = icon ? ICON_MAP[icon] : null
  const iconStyle = icon ? ICON_COLORS[icon] : null

  if (highlight) {
    return (
      <div
        className={cn('rounded-2xl p-5 relative overflow-hidden', className)}
        style={{ backgroundColor: '#0F4C81', border: '1px solid #0A3A65' }}
      >
        {/* Glow sutil de fondo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.15) 0%, transparent 70%)' }}
        />
        {Icon && (
          <div className="mb-3 relative">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Icon size={16} strokeWidth={1.75} className="text-blue-200" />
            </div>
          </div>
        )}
        <p className="text-3xl font-bold text-white relative">{value}</p>
        <p className="text-sm mt-1 text-blue-200 relative">{label}</p>
        {sub && <p className="text-xs mt-0.5 text-blue-300 relative">{sub}</p>}
      </div>
    )
  }

  return (
    <div
      className={cn('bg-white rounded-2xl p-5 shadow-sm', className)}
      style={{ border: '1px solid #EDEAE4' }}
    >
      {Icon && iconStyle && (
        <div className="mb-3">
          <div
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: iconStyle.bg }}
          >
            <Icon size={16} strokeWidth={1.75} style={{ color: iconStyle.color }} />
          </div>
        </div>
      )}
      <p className="text-3xl font-bold" style={{ color: '#111827' }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}
