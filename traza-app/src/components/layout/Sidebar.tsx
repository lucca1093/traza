'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, LogOut, CalendarDays,
  Flame, Search, MessageSquare, UsersRound, X, Settings,
  type LucideIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getNavForRole, cn } from '@/lib/traza'
import type { Profile } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Users, Target, ClipboardList,
  CheckSquare, BarChart2, User, Award, FileText, CalendarDays,
  Flame, Search, MessageSquare, UsersRound, Settings,
}

interface SidebarProps {
  profile: Profile
  empresaNombre?: string | null
  isOpen?: boolean
  onClose?: () => void
}

/* ── Logo ─────────────────────────────────────────────────── */
function TrazaLogo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1C2B90"/>
      <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white"/>
      <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white"/>
    </svg>
  )
}

/* ── Section group definitions ────────────────────────────── */
const SECTION_GROUPS: Record<string, { label: string; hrefs: string[] }[]> = {
  super_admin: [
    { label: 'General',   hrefs: ['/dashboard'] },
    { label: 'Trabajo',   hrefs: ['/mi-trabajo', '/mi-semana', '/objetivos', '/reuniones', '/validacion'] },
    { label: 'Equipo',    hrefs: ['/equipo', '/personas', '/calendario', '/periodos'] },
    { label: 'Analytics', hrefs: ['/analytics', '/reportes'] },
    { label: 'Admin',     hrefs: ['/empresas', '/mi-empresa', '/buscar-talento'] },
  ],
  admin: [
    { label: 'General',   hrefs: ['/dashboard'] },
    { label: 'Trabajo',   hrefs: ['/mi-trabajo', '/mi-semana', '/objetivos', '/reuniones', '/validacion'] },
    { label: 'Equipo',    hrefs: ['/equipo', '/personas', '/calendario', '/periodos'] },
    { label: 'Analytics', hrefs: ['/analytics', '/reportes'] },
    { label: 'Admin',     hrefs: ['/mi-empresa'] },
  ],
  supervisor: [
    { label: 'General',   hrefs: ['/dashboard'] },
    { label: 'Trabajo',   hrefs: ['/mi-trabajo', '/mi-semana', '/objetivos', '/validacion'] },
    { label: 'Equipo',    hrefs: ['/equipo', '/reuniones'] },
    { label: 'Analytics', hrefs: ['/analytics'] },
  ],
  empleado: [
    { label: 'General',   hrefs: ['/dashboard'] },
    { label: 'Mi trabajo', hrefs: ['/mi-trabajo', '/mi-semana', '/objetivos'] },
    { label: 'Carrera',   hrefs: ['/perfil'] },
  ],
  individuo: [
    { label: 'General',   hrefs: ['/dashboard'] },
    { label: 'Mi trabajo', hrefs: ['/mi-trabajo', '/mi-semana', '/objetivos'] },
    { label: 'Carrera',   hrefs: ['/perfil'] },
  ],
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

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  /* Build section groups for this role */
  const groups = SECTION_GROUPS[profile.rol] ?? [{ label: '', hrefs: navItems.map(n => n.href) }]

  /* Map href → nav item */
  const navByHref: Record<string, typeof navItems[0]> = {}
  navItems.forEach(n => { navByHref[n.href] = n })

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{
        background: 'var(--sb-bg)',
        borderRight: '1px solid var(--sb-border)',
      }}
    >
      {/* ── Logo + close ──────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--sb-border)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
          <TrazaLogo size={32} />
          <div>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: 17,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              traza
            </p>
            <p style={{ fontSize: 10, color: '#2D3A56', fontWeight: 600, letterSpacing: '0.04em', marginTop: 2 }}>
              PERFORMANCE
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: 'var(--sb-text)', background: 'rgba(255,255,255,.05)', border: 'none', cursor: 'pointer' }}
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Empresa activa pill ────────────────────────────────── */}
      {empresaNombre && (
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(22,163,74,0.09)',
              border: '1px solid rgba(22,163,74,0.18)',
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 0 2px rgba(34,197,94,.25)',
              flexShrink: 0,
            }} />
            <div className="min-w-0">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {empresaNombre}
              </p>
              <p style={{ fontSize: 10, color: '#1A3A2A', fontWeight: 600, marginTop: 1 }}>Empresa activa</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navegación con grupos ─────────────────────────────── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {groups.map((group, gi) => {
          const items = group.hrefs
            .map(h => navByHref[h])
            .filter(Boolean)
          if (items.length === 0) return null

          return (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && (
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: '#1E2A40',
                  paddingLeft: 10,
                  marginBottom: 5,
                  marginTop: gi === 0 ? 4 : 0,
                }}>
                  {group.label}
                </p>
              )}
              <ul style={{ listStyle: 'none' }}>
                {items.map(item => {
                  const active = isActive(item.href)
                  const Icon = ICON_MAP[item.icon]
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '7px 10px',
                          borderRadius: 10,
                          marginBottom: 2,
                          textDecoration: 'none',
                          fontSize: 13.5,
                          fontWeight: active ? 600 : 500,
                          color: active ? '#C7D0F8' : 'var(--sb-text)',
                          background: active ? 'var(--sb-active-bg)' : 'transparent',
                          borderLeft: active ? '2px solid #4F63D2' : '2px solid transparent',
                          paddingLeft: active ? 8 : 10,
                          transition: 'all 130ms ease',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'
                            ;(e.currentTarget as HTMLElement).style.color = 'var(--sb-text-h)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent'
                            ;(e.currentTarget as HTMLElement).style.color = 'var(--sb-text)'
                          }
                        }}
                      >
                        {Icon && (
                          <Icon
                            size={15}
                            strokeWidth={active ? 2.1 : 1.75}
                            style={{
                              color: active ? 'var(--sb-active-fg)' : 'inherit',
                              flexShrink: 0,
                              transition: 'color 130ms',
                            }}
                          />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* ── Footer del sidebar ────────────────────────────────── */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid var(--sb-border)' }}
      >
        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 10px',
          borderRadius: 12,
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.05)',
          marginBottom: 6,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1C2B90, #4F63D2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#C7D0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </p>
            <p style={{ fontSize: 10.5, color: '#2D3A56', fontWeight: 600, textTransform: 'capitalize', marginTop: 1 }}>
              {profile.rol.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Soporte */}
        <Link
          href="/soporte"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--sb-text)',
            textDecoration: 'none',
            transition: 'background 130ms, color 130ms',
            marginBottom: 2,
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--sb-text-h)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--sb-text)'
          }}
        >
          <MessageSquare size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span>Soporte</span>
        </Link>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '7px 10px',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--sb-text)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 130ms, color 130ms',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'
            ;(e.currentTarget as HTMLElement).style.color = '#FCA5A5'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--sb-text)'
          }}
        >
          <LogOut size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
