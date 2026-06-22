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

  return (
    <div
      className={cn(
        'border rounded-2xl shadow-sm p-5',
        highlight ? 'border-blue-900' : 'bg-white border-gray-200',
        className
      )}
      style={highlight ? { backgroundColor: '#0F4C81' } : undefined}
    >
      {Icon && (
        <div className="mb-3">
          <Icon
            size={18}
            strokeWidth={1.75}
            className={highlight ? 'text-blue-200' : 'text-gray-400'}
          />
        </div>
      )}
      <p className={cn('text-3xl font-bold', highlight ? 'text-white' : 'text-gray-900')}>
        {value}
      </p>
      <p className={cn('text-sm mt-1', highlight ? 'text-blue-200' : 'text-gray-500')}>
        {label}
      </p>
      {sub && (
        <p className={cn('text-xs mt-0.5', highlight ? 'text-blue-300' : 'text-gray-400')}>
          {sub}
        </p>
      )}
    </div>
  )
}
