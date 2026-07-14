'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, LogOut, CalendarDays,
  Flame, Search, MessageSquare, UsersRound, X,
  type LucideIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getNavForRole, cn } from '@/lib/traza'
import type { Profile } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, CalendarDays,
  Flame, Search, MessageSquare, UsersRound,
}

interface SidebarProps {
  profile: Profile
  empresaNombre?: string | null
  isOpen?: boolean
  onClose?: () => void
}

/* Z-mark — símbolo de traza */
function TrazaLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill="#1C2B90" />
      {/* Barra superior del Z */}
      <rect x="9" y="10" width="18" height="3" rx="1.5" fill="white" />
      {/* Diagonal del Z */}
      <path
        d="M 25 13 L 11 23"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Barra inferior del Z */}
      <rect x="9" y="23" width="18" height="3" rx="1.5" fill="white" />
    </svg>
  )
}

export default function Sidebar({ profile, empresaNombre, isOpen = false, onClose }: SidebarProps) {
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
      className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{
        backgroundColor: '#0F172A',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div
        className="px-5 py-5 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <TrazaLogo />
          <div>
            <p
              className="font-extrabold text-white leading-none tracking-tight"
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '1.125rem',
                letterSpacing: '-0.02em',
              }}
            >
              TRAZA
            </p>
            <p
              className="text-xs mt-0.5 font-medium"
              style={{ color: '#334155', letterSpacing: '0.02em' }}
            >
              Performance Platform
            </p>
          </div>
        </Link>

        {/* Cerrar en mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: '#475569' }}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Empresa activa ────────────────────────────────────── */}
      {empresaNombre && (
        <div
          className="px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: 'rgba(16,185,129,0.08)' }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#10B981' }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#6EE7B7' }}>
                {empresaNombre}
              </p>
              <p className="text-xs" style={{ color: '#334155', fontSize: '10px' }}>
                Empresa activa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navegación ────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = ICON_MAP[item.icon]

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-200'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'rgba(51, 80, 208, 0.18)',
                          color: '#E2E8F0',
                        }
                      : undefined
                  }
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {Icon && (
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{
                        color: isActive ? '#8899EE' : 'inherit',
                        flexShrink: 0,
                        transition: 'color 150ms',
                      }}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#5572E5' }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Usuario + cerrar sesión ───────────────────────────── */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 mb-2 px-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(51, 80, 208, 0.20)' }}
          >
            <span className="text-xs font-bold" style={{ color: '#8899EE' }}>
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E2E8F0' }}>
              {fullName}
            </p>
            <p className="text-xs capitalize" style={{ color: '#475569' }}>
              {profile.rol.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Soporte */}
        <Link
          href="/soporte"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150"
          style={{ color: '#475569' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'
            ;(e.currentTarget as HTMLElement).style.color = '#94A3B8'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = '#475569'
          }}
        >
          <MessageSquare size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span>Soporte</span>
        </Link>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 mt-1"
          style={{ color: '#475569' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'
            ;(e.currentTarget as HTMLElement).style.color = '#FCA5A5'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = '#475569'
          }}
        >
          <LogOut size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
