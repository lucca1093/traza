'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import GlobalSearch from './GlobalSearch'
import DemoTour from '@/components/DemoTour'
import type { Profile } from '@/types'

interface AppShellProps {
  profile: Profile
  empresaNombre: string | null
  userId: string
  children: React.ReactNode
}

export default function AppShell({ profile, empresaNombre, userId, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fullName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Usuario'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        profile={profile}
        empresaNombre={empresaNombre}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 overflow-y-auto flex flex-col min-w-0">

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
            background: 'rgba(242,244,248,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Left: hamburger (mobile) + breadcrumb placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                color: 'var(--ink-3)',
              }}
              aria-label="Abrir menú"
            >
              <Menu size={17} />
            </button>
          </div>

          {/* Right: search + notifications + user chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobalSearch userId={userId} />
            <NotificationBell userId={userId} />

            {/* User chip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px 5px 6px',
              borderRadius: 99,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'default',
            }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1C2B90, #4F63D2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>{initials}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.nombre}
              </span>
            </div>
          </div>
        </header>

        {/* ── Contenido ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '28px 24px 40px' }}>
          {children}
        </div>
      </main>

      <DemoTour />
    </div>
  )
}
