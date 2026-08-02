import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// PATCH /api/admin/persona
// Acciones: cambiar_rol | dar_de_baja | reactivar | asignar_supervisor | editar_datos
export async function PATCH(req: NextRequest) {
  const supabase = admin()
  const { action, persona_id, nuevo_rol, supervisor_id, cargo, area, nombre, apellido } = await req.json()

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
    // 1. Marcar persona como inactiva
    const { error } = await supabase
      .from('personas')
      .update({ empleo_activo: false })
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2. Liberar la cuenta: desconectar de la empresa para que pueda seguir usando TRAZA
    //    como usuario independiente con su propio historial
    if (persona.user_id) {
      const { error: pErr2 } = await supabase
        .from('profiles')
        .update({ empresa_id: null, rol: 'individuo' })
        .eq('id', persona.user_id)

      if (pErr2) {
        // No es fatal (la persona ya fue dada de baja), pero lo reportamos
        console.error('Error liberando perfil:', pErr2.message)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // ── Reactivar ────────────────────────────────────────────────
  if (action === 'reactivar') {
    const { error } = await supabase
      .from('personas')
      .update({ empleo_activo: true })
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Si tenían perfil, re-asignar la empresa
    if (persona.user_id) {
      // Obtener empresa_id de la propia persona (a través de la tabla personas que tiene empresa_id)
      const { data: personaFull } = await supabase
        .from('personas')
        .select('empresa_id')
        .eq('id', persona_id)
        .single()

      if (personaFull?.empresa_id) {
        await supabase
          .from('profiles')
          .update({ empresa_id: personaFull.empresa_id, rol: 'empleado' })
          .eq('id', persona.user_id)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // ── Asignar supervisor ───────────────────────────────────────
  if (action === 'asignar_supervisor') {
    const { error } = await supabase
      .from('personas')
      .update({ supervisor_id: supervisor_id ?? null })
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Editar datos de persona ──────────────────────────────────
  if (action === 'editar_datos') {
    const updates: Record<string, string> = {}
    if (cargo !== undefined) updates.cargo = cargo
    if (area  !== undefined) updates.area  = area
    if (nombre !== undefined) updates.nombre = nombre
    if (apellido !== undefined) updates.apellido = apellido

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Sin datos para actualizar' }, { status: 400 })
    }

    const { error } = await supabase
      .from('personas')
      .update(updates)
      .eq('id', persona_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
