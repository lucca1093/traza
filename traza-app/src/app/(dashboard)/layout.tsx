import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AppShell from '@/components/layout/AppShell'
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
    <AppShell
      profile={profile as Profile}
      empresaNombre={empresa?.nombre ?? null}
      userId={user.id}
    >
      {children}
    </AppShell>
  )
}
