import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  // Verificar que quien llama es admin o super_admin
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { email, nombre, apellido, cargo, area, rol } = await request.json()

  if (!email || !nombre || !apellido || !rol) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Invitar usuario vía Supabase Admin
  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  const newUserId = invited.user.id

  // Actualizar el profile con rol y datos
  await supabaseAdmin
    .from('profiles')
    .upsert({
      id: newUserId,
      nombre,
      apellido,
      rol,
      empresa_id: profile.empresa_id,
    })

  // Crear persona vinculada
  await supabaseAdmin
    .from('personas')
    .insert({
      empresa_id: profile.empresa_id,
      user_id: newUserId,
      nombre,
      apellido,
      cargo: cargo || null,
      area: area || null,
    })

  return NextResponse.json({ success: true })
}
