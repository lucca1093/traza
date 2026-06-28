'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, LogOut, CalendarDays,
  Flame, Search,
  type LucideIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getNavForRole, cn } from '@/lib/traza'
import type { Profile } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, CalendarDays,
  Flame, Search,
}

interface SidebarProps {
  profile: Profile
  empresaNombre?: string | null
}

export default function Sidebar({ profile, empresaNombre }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const navItems = getNavForRole(profile.rol)

  const fullName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Usuario'
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"
      style={{ backgroundColor: '#16213E', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#0F4C81' }}
          >
            <span className="text-white text-sm font-bold tracking-tight">T</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none tracking-tight">TRAZA</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Performance Platform</p>
          </div>
        </div>
      </div>

      {/* Empresa activa */}
      {empresaNombre && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.08)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
            <div className="min-w-0">
              <p className="text-xs truncate font-medium" style={{ color: '#6ee7b7' }}>{empresaNombre}</p>
              <p className="text-xs" style={{ color: '#6B7280', fontSize: '10px' }}>Empresa activa</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = ICON_MAP[item.icon]

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={isActive
                    ? { backgroundColor: '#243B6A', color: '#E2E8F0' }
                    : { color: '#64748B' }
                  }
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#1E3352'; if (!isActive) (e.currentTarget as HTMLElement).style.color = '#CBD5E1' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; if (!isActive) (e.currentTarget as HTMLElement).style.color = '#64748B' }}
                >
                  {Icon && (
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{ color: isActive ? '#60A5FA' : 'inherit', flexShrink: 0 }}
                    />
                  )}
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#3B82F6' }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario + cerrar sesión */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#243B6A' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#93C5FD' }}>{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E2E8F0' }}>{fullName}</p>
            <p className="text-xs capitalize" style={{ color: '#475569' }}>{profile.rol.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: '#475569' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#FCA5A5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#475569' }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
