'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, LogOut,
  type LucideIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getNavForRole, cn } from '@/lib/traza'
import type { Profile } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText,
}

interface SidebarProps {
  profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-traza-700 flex items-center justify-center">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <p className="font-bold text-traza-700 text-lg leading-none">TRAZA</p>
            <p className="text-xs text-gray-400 mt-0.5">Performance Platform</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-traza-700 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {(() => { const Icon = ICON_MAP[item.icon]; return Icon ? <Icon size={16} strokeWidth={1.75} /> : null })()}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario + cerrar sesión */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
            <span className="text-traza-700 text-sm font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            <p className="text-xs text-gray-500 capitalize">{profile.rol.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
