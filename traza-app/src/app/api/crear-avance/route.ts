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
    const { objetivo_id, tipo, contenido } = body

    if (!objetivo_id || !tipo || !contenido?.trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verificar que el objetivo pertenece al usuario autenticado
    const { data: objetivo } = await admin
      .from('objetivos')
      .select('id, persona_id, empresa_id')
      .eq('id', objetivo_id)
      .maybeSingle()

    if (!objetivo) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 })
    }

    // Verificar que la persona del objetivo pertenece al usuario
    const { data: persona } = await admin
      .from('personas')
      .select('id')
      .eq('id', objetivo.persona_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!persona) {
      return NextResponse.json({ error: 'Sin permisos para este objetivo' }, { status: 403 })
    }

    const { data: avance, error: insertError } = await admin
      .from('objetivo_avances')
      .insert({
        empresa_id:  objetivo.empresa_id ?? null,
        objetivo_id: objetivo_id,
        persona_id:  objetivo.persona_id,
        tipo:        tipo,
        contenido:   contenido.trim(),
        creado_por:  user.id,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('crear-avance insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ avance })
  } catch (err: any) {
    console.error('crear-avance error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
