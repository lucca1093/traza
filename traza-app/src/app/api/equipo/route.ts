import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/equipo
// Devuelve el equipo del supervisor logueado.
// RLS "Ver personas de mi empresa" permite al supervisor ver todas las personas
// de su empresa; filtramos por supervisor_id para mostrar solo sus reportes directos.
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ personas: [], nivel2: [], empresaId: null, rol: null })
  }

  // Perfil del usuario (empresa + rol)
  const { data: prof } = await supabase
    .from('profiles')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!prof?.empresa_id) {
    return NextResponse.json({ personas: [], nivel2: [], empresaId: null, rol: prof?.rol ?? null })
  }

  // Persona del supervisor (necesaria para filtrar por supervisor_id)
  const { data: miPersona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .eq('empresa_id', prof.empresa_id)
    .maybeSingle()

  // Query base de personas activas de la empresa
  let q = supabase
    .from('personas')
    .select('id, nombre, apellido, cargo, area, traza_id, empleo_activo, supervisor_verificado, supervisor_id')
    .eq('empresa_id', prof.empresa_id)
    .eq('empleo_activo', true)
    .order('apellido')
    .limit(200)

  // Si es supervisor y tiene persona propia → mostrar solo reportes directos
  if (prof.rol === 'supervisor' && miPersona?.id) {
    q = q.eq('supervisor_id', miPersona.id)
  }

  const { data: personas, error } = await q

  if (error) {
    console.error('[/api/equipo] personas query error:', error.message)
  }

  // Nivel 2 — reportes de reportes (solo si hay nivel 1)
  let nivel2: any[] = []
  if (prof.rol === 'supervisor' && miPersona?.id && personas?.length) {
    const nivel1Ids = personas.map((p: any) => p.id)
    const { data: ind } = await supabase
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
