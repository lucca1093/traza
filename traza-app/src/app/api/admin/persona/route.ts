import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// PATCH /api/admin/persona
// Acciones: cambiar_rol | dar_de_baja | reactivar
export async function PATCH(req: NextRequest) {
  const supabase = admin()
  const { action, persona_id, nuevo_rol } = await req.json()

  if (!persona_id || !action) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Obtener la persona para verificar que existe
  const { data: persona, error: pErr } = await supabase
    .from('personas')
    .select('id, user_id, empleo_activo')
    .eq('id', persona_id)
    .single()

  if (pErr || !persona) {
    return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 })
  }

  // ── Cambiar rol ──────────────────────────────────────────────
  if (action === 'cambiar_rol') {
    const rolesValidos = ['empleado', 'supervisor', 'admin']
    if (!rolesValidos.includes(nuevo_rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }
    if (!persona.user_id) {
      return NextResponse.json({ error: 'Esta persona no tiene acceso al sistema todavía' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ rol: nuevo_rol })
      .eq('id', persona.user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Dar de baja ──────────────────────────────────────────────
  if (action === 'dar_de_baja') {
    const { error } = await supabase
      .from('personas')
      .update({ empleo_activo: false })
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Reactivar ────────────────────────────────────────────────
  if (action === 'reactivar') {
    const { error } = await supabase
      .from('personas')
      .update({ empleo_activo: true })
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
