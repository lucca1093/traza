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

const ICON_COLORS: Record<string, { bg: string; color: string }> = {
  Users:       { bg: 'rgba(99,102,241,0.10)',   color: '#6366F1' },
  Target:      { bg: 'rgba(51,80,208,0.10)',    color: '#3350D0' },
  CheckSquare: { bg: 'rgba(16,185,129,0.10)',   color: '#10B981' },
  TrendingUp:  { bg: 'rgba(245,158,11,0.10)',   color: '#D97706' },
  Trophy:      { bg: 'rgba(234,179,8,0.12)',    color: '#CA8A04' },
  Building2:   { bg: 'rgba(51,80,208,0.10)',    color: '#3350D0' },
  BarChart2:   { bg: 'rgba(99,102,241,0.10)',   color: '#6366F1' },
  FileText:    { bg: 'rgba(100,116,139,0.10)',  color: '#64748B' },
  Award:       { bg: 'rgba(234,179,8,0.12)',    color: '#CA8A04' },
  User:        { bg: 'rgba(51,80,208,0.10)',    color: '#3350D0' },
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

  /* ── Highlight — card de acento Sapphire Indigo ─── */
  if (highlight) {
    return (
      <div
        className={cn('rounded-2xl p-5 relative overflow-hidden', className)}
        style={{
          background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)',
          border: '1px solid rgba(51,80,208,0.30)',
          boxShadow: '0 4px 12px rgba(28,43,144,0.25)',
        }}
      >
        {/* Glow sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, rgba(136,153,238,0.20) 0%, transparent 65%)',
          }}
        />
        {Icon && (
          <div className="mb-3 relative">
            <div
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
            >
              <Icon size={15} strokeWidth={1.75} className="text-indigo-200" />
            </div>
          </div>
        )}
        <p
          className="text-3xl font-bold text-white relative"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}
        >
          {value}
        </p>
        <p className="text-sm mt-1 text-indigo-200 relative font-medium">{label}</p>
        {sub && <p className="text-xs mt-0.5 relative" style={{ color: 'rgba(199,210,254,0.75)' }}>{sub}</p>}
      </div>
    )
  }

  /* ── Normal ─────────────────────────────────────── */
  return (
    <div
      className={cn('bg-white rounded-2xl p-5', className)}
      style={{
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      }}
    >
      {Icon && iconStyle && (
        <div className="mb-3">
          <div
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: iconStyle.bg }}
          >
            <Icon size={15} strokeWidth={1.75} style={{ color: iconStyle.color }} />
          </div>
        </div>
      )}
      <p
        className="text-3xl font-bold"
        style={{
          color: '#0F172A',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </p>
      <p className="text-sm mt-1 font-medium" style={{ color: '#64748B' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</p>}
    </div>
  )
}
