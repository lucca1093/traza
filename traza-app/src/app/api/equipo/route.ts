import { createAdminClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

// GET /api/equipo
// Devuelve el equipo del supervisor logueado usando admin client (bypass RLS).
export async function GET() {
  const { user, error } = await requireAuth(['supervisor', 'admin', 'super_admin'])
  if (error || !user) {
    return NextResponse.json({ personas: [], nivel2: [], empresaId: null, rol: null })
  }

  const admin = createAdminClient()

  // Perfil del usuario
  const { data: prof } = await admin
    .from('profiles')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!prof?.empresa_id) {
    return NextResponse.json({ personas: [], nivel2: [], empresaId: null, rol: prof?.rol ?? null })
  }

  // Persona del supervisor
  const { data: miPersona } = await admin
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .eq('empresa_id', prof.empresa_id)
    .maybeSingle()

  // Query base de personas
  let q = admin
    .from('personas')
    .select('id, nombre, apellido, cargo, area, traza_id, empleo_activo, supervisor_verificado, supervisor_id')
    .eq('empresa_id', prof.empresa_id)
    .eq('empleo_activo', true)
    .order('apellido')
    .limit(200)

  if (prof.rol === 'supervisor' && miPersona?.id) {
    q = q.eq('supervisor_id', miPersona.id)
  }

  const { data: personas } = await q

  // Nivel 2 — reportes de reportes
  let nivel2: any[] = []
  if (prof.rol === 'supervisor' && miPersona?.id && personas?.length) {
    const nivel1Ids = personas.map((p: any) => p.id)
    const { data: ind } = await admin
      .from('personas')
      .select('id, nombre, apellido, cargo, area, traza_id, empleo_activo, supervisor_verificado, supervisor_id')
      .eq('empresa_id', prof.empresa_id)
      .eq('empleo_activo', true)
      .in('supervisor_id', nivel1Ids)
    nivel2 = (ind ?? []).filter((p: any) => !nivel1Ids.includes(p.id))
  }

  return NextResponse.json({
    personas: personas ?? [],
    nivel2,
    empresaId: prof.empresa_id,
    rol: prof.rol,
  })
}
