import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    // Obtener empresa_id del profile via admin
    const { data: profile } = await admin
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .maybeSingle()
    const empresaId = profile?.empresa_id ?? null

    // Verificar que la persona pertenece al usuario autenticado
    const { data: persona } = await admin
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', body.persona_id)
      .maybeSingle()

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 })
    }

    // Crear grupo si es objetivo con colaborador externo
    let grupoId: string | null = null
    if (body.con_externo) {
      const { data: grupo } = await admin
        .from('objetivo_grupos')
        .insert({
          empresa_id:   empresaId,
          titulo:       body.titulo,
          descripcion:  body.descripcion || null,
          prioridad:    body.prioridad,
          categoria:    body.categoria,
          es_continuo:  body.es_continuo,
          fecha_limite: body.es_continuo ? null : (body.fecha_limite || null),
          creado_por:   user.id,
          tipo:         'externo',
        })
        .select()
        .single()
      grupoId = grupo?.id ?? null
    }

    const payload = {
      empresa_id:    empresaId,
      persona_id:    body.persona_id,
      creado_por:    user.id,
      titulo:        body.titulo,
      descripcion:   body.descripcion || null,
      prioridad:     body.prioridad,
      categoria:     body.categoria,
      es_continuo:   body.es_continuo,
      fecha_limite:  body.es_continuo ? null : (body.fecha_limite || null),
      evidencia_url: body.evidencia_url || null,
      tipo:          'Personal',
      estado:        'Pendiente',
      grupo_id:      grupoId,
    }

    const { data: objetivo, error: insertError } = await admin
      .from('objetivos')
      .insert(payload)
      .select('*, grupo:objetivo_grupos(tipo)')
      .single()

    if (insertError) {
      console.error('crear-objetivo insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ objetivo })
  } catch (err: any) {
    console.error('crear-objetivo error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
