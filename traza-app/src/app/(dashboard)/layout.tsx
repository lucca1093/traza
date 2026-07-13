import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBell from '@/components/layout/NotificationBell'
import DemoTour from '@/components/DemoTour'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let profile: Profile | null = profileData

  // Usuario independiente — no tiene row en profiles
  if (!profile) {
    const { data: persona } = await supabase
      .from('personas')
      .select('nombre, apellido')
      .eq('user_id', user.id)
      .eq('empleo_activo', true)
      .single()

    if (!persona) {
      redirect('/login')
    }

    profile = {
      id: user.id,
      empresa_id: null,
      nombre: persona.nombre,
      apellido: persona.apellido,
      cargo: null,
      area: null,
      supervisor_id: null,
      rol: 'individuo',
      avatar_url: null,
      created_at: new Date().toISOString(),
    } as Profile
  }

  const { data: empresa } = profile?.empresa_id
    ? await supabase.from('empresas').select('nombre').eq('id', profile.empresa_id).single()
    : { data: null }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      <Sidebar profile={profile as Profile} empresaNombre={empresa?.nombre ?? null} />

      <main className="flex-1 ml-64 overflow-y-auto flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-end px-8 h-14 sticky top-0 z-40 flex-shrink-0"
          style={{
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <NotificationBell userId={user.id} />
        </div>

        {/* Contenido */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-8 py-8">
          {children}
        </div>
      </main>

      {/* Demo tour overlay — solo activo si hay demo_role en sessionStorage */}
      <DemoTour />
    </div>
  )
}
