import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MERIDIAN = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'

// GET /api/demo/fix-mgr
// Se llama automáticamente al iniciar el demo como Manager.
// Asegura que Diego tenga su persona + equipo asignado.
export async function GET() {
  const supabase = createAdminClient()

  // 1. Buscar el user de Diego por email
  const { data: users } = await supabase.auth.admin.listUsers()
  const diegoUser = users?.users?.find(u => u.email === 'demo-mgr@traza.app')
  if (!diegoUser) {
    return NextResponse.json({ ok: false, error: 'Usuario demo manager no encontrado' })
  }

  // 2. Crear o recuperar la persona de Diego
  let diegoPersonaId: string | null = null

  const { data: existing } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', diegoUser.id)
    .eq('empresa_id', MERIDIAN)
    .single()

  if (existing?.id) {
    diegoPersonaId = existing.id
  } else {
    const { data: created } = await supabase
      .from('personas')
      .insert({
        user_id:              diegoUser.id,
        nombre:               'Diego',
        apellido:             'Sánchez',
        cargo:                'Director de Recursos Humanos',
        area:                 'RRHH',
        empresa_id:           MERIDIAN,
        tipo_cuenta:          'empresa',
        empleo_activo:        true,
        traza_id:             'TRZ-DEMO-DGO',
        credencial_publica:   false,
        supervisor_verificado: true,
      })
      .select('id')
      .single()
    diegoPersonaId = created?.id ?? null
  }

  if (!diegoPersonaId) {
    return NextResponse.json({ ok: false, error: 'No se pudo crear persona de Diego' })
  }

  // 3. Asignar empleados de Meridian sin supervisor a Diego (hasta 5)
  const { data: sinSup } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', MERIDIAN)
    .eq('empleo_activo', true)
    .is('supervisor_id', null)
    .neq('id', diegoPersonaId)
    .limit(5)

  let asignados = 0
  if (sinSup && sinSup.length > 0) {
    await supabase
      .from('personas')
      .update({ supervisor_id: diegoPersonaId })
      .in('id', sinSup.map(p => p.id))
    asignados = sinSup.length
  }

  // 4. Contar equipo actual de Diego
  const { count } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })
    .eq('supervisor_id', diegoPersonaId)
    .eq('empleo_activo', true)

  return NextResponse.json({
    ok: true,
    diegoPersonaId,
    asignados,
    equipoTotal: count ?? 0,
  })
}
