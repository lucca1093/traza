import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBell from '@/components/layout/NotificationBell'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: empresa } = profile?.empresa_id
    ? await supabase.from('empresas').select('nombre').eq('id', profile.empresa_id).single()
    : { data: null }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>
      <Sidebar profile={profile as Profile} empresaNombre={empresa?.nombre ?? null} />
      <main className="flex-1 ml-64 overflow-y-auto">
        {/* Top bar con campana */}
        <div className="flex items-center justify-end px-8 py-3 border-b border-gray-100 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
          <NotificationBell userId={user.id} />
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
