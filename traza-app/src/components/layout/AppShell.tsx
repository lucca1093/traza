'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
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
        {/* Top bar */}
        <div
          className="flex items-center justify-between lg:justify-end px-4 lg:px-8 h-14 sticky top-0 z-30 flex-shrink-0"
          style={{
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {/* Hamburger — solo mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <NotificationBell userId={userId} />
        </div>

        {/* Contenido */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <DemoTour />
    </div>
  )
}
