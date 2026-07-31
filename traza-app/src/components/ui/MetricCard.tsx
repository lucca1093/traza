import {
  Users, Target, CheckSquare, TrendingUp, Trophy,
  Building2, BarChart2, FileText, Award, User,
  type LucideIcon
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Target, CheckSquare, TrendingUp, Trophy,
  Building2, BarChart2, FileText, Award, User,
}

const ICON_THEMES: Record<string, { icon: string; label: string }> = {
  Users:       { icon: '#6366F1', label: '#E0E7FF' },
  Target:      { icon: '#3350D0', label: '#EEF2FF' },
  CheckSquare: { icon: '#16A34A', label: '#DCFCE7' },
  TrendingUp:  { icon: '#D97706', label: '#FEF3C7' },
  Trophy:      { icon: '#CA8A04', label: '#FEF9C3' },
  Building2:   { icon: '#0891B2', label: '#CFFAFE' },
  BarChart2:   { icon: '#7C3AED', label: '#EDE9FE' },
  FileText:    { icon: '#64748B', label: '#F1F5F9' },
  Award:       { icon: '#CA8A04', label: '#FEF9C3' },
  User:        { icon: '#3350D0', label: '#EEF2FF' },
}

interface MetricCardProps {
  label: string
  value: string | number
  icon?: string
  sub?: string
  highlight?: boolean
  className?: string
  delta?: string        // e.g. "+12%" or "−3"
  deltaPositive?: boolean
}

export default function MetricCard({
  label, value, icon, sub, highlight, className = '', delta, deltaPositive,
}: MetricCardProps) {
  const Icon  = icon ? ICON_MAP[icon] : null
  const theme = icon ? ICON_THEMES[icon] : null

  /* ── HIGHLIGHT (brand gradient) ─────────────────────────────── */
  if (highlight) {
    return (
      <div
        className={`traza-brand-card ${className}`}
        style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Subtle dot texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {Icon && (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <Icon size={16} strokeWidth={2} color="rgba(255,255,255,0.9)" />
            </div>
          )}

          <p style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {value}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'rgba(199,210,254,0.85)', fontWeight: 500 }}>{label}</p>
            {delta && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,.7)',
                background: 'rgba(255,255,255,.12)',
                padding: '2px 8px',
                borderRadius: 99,
              }}>
                {delta}
              </span>
            )}
          </div>

          {sub && (
            <p style={{ fontSize: 11.5, color: 'rgba(165,180,252,0.7)', marginTop: 4 }}>{sub}</p>
          )}
        </div>
      </div>
    )
  }

  /* ── NORMAL ─────────────────────────────────────────────────── */
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-2xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 150ms, border-color 150ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-h)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      {/* Top: icon + delta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        {Icon && theme ? (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: theme.label,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} strokeWidth={2} style={{ color: theme.icon }} />
          </div>
        ) : <div />}

        {delta && (
          <span style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: deltaPositive !== false ? 'var(--green)' : 'var(--red)',
            background: deltaPositive !== false ? 'var(--green-bg)' : 'var(--red-bg)',
            padding: '3px 9px',
            borderRadius: 99,
          }}>
            {delta}
          </span>
        )}
      </div>

      {/* Number */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--ink-1)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        marginBottom: 5,
      }}>
        {value}
      </p>

      {/* Label */}
      <p style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</p>

      {sub && (
        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>{sub}</p>
      )}

      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 20, right: 20,
        height: 2,
        background: theme ? `${theme.icon}22` : 'var(--border)',
        borderRadius: '99px 99px 0 0',
      }} />
    </div>
  )
}
