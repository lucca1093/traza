import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { objetivo_id, ...campos } = body

    if (!objetivo_id) {
      return NextResponse.json({ error: 'objetivo_id requerido' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verificar que el objetivo pertenece al usuario
    const { data: objetivo } = await admin
      .from('objetivos')
      .select('id, persona_id')
      .eq('id', objetivo_id)
      .maybeSingle()

    if (!objetivo) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 })
    }

    const { data: persona } = await admin
      .from('personas')
      .select('id')
      .eq('id', objetivo.persona_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!persona) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Campos permitidos para actualizar
    const permitidos = ['estado', 'completado_en', 'autoevaluacion', 'comentario_empleado', 'progreso']
    const update: Record<string, any> = {}
    for (const k of permitidos) {
      if (k in campos) update[k] = campos[k]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await admin
      .from('objetivos')
      .update(update)
      .eq('id', objetivo_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('actualizar-objetivo error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ objetivo: updated })
  } catch (err: any) {
    console.error('actualizar-objetivo error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
