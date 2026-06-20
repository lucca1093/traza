import { cn } from '@/lib/traza'

interface MetricCardProps {
  label: string
  value: string | number
  icon?: string
  sub?: string
  highlight?: boolean
  className?: string
}

export default function MetricCard({ label, value, icon, sub, highlight, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'border rounded-2xl shadow-sm p-5',
        highlight ? 'border-blue-900' : 'bg-white border-gray-200',
        className
      )}
      style={highlight ? { backgroundColor: '#0F4C81' } : undefined}
    >
      {icon && <p className="text-2xl mb-2">{icon}</p>}
      <p className={cn('text-3xl font-bold', highlight ? 'text-white' : 'text-gray-900')}>
        {value}
      </p>
      <p className={cn('text-sm mt-1', highlight ? 'text-blue-200' : 'text-gray-500')}>
        {label}
      </p>
      {sub && (
        <p className={cn('text-xs mt-0.5', highlight ? 'text-traza-300' : 'text-gray-400')}>
          {sub}
        </p>
      )}
    </div>
  )
}
