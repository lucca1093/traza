import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const admin = createAdminClient()
    const { token } = params

    // Buscar el token
    const { data: tokenData } = await admin
      .from('tokens_validacion')
      .select('*, objetivo:objetivos(id, titulo, persona_id)')
      .eq('token', token)
      .single()

    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    if (tokenData.usado) {
      return NextResponse.json({ error: 'Este link ya fue utilizado' }, { status: 410 })
    }

    if (new Date(tokenData.expira_en) < new Date()) {
      return NextResponse.json({ error: 'Este link expiró' }, { status: 410 })
    }

    // Leer los datos del formulario
    const body = await request.json()
    const { nombre, email, cargo, empresa, calificacion, comentario } = body

    if (!nombre?.trim() || !calificacion) {
      return NextResponse.json({ error: 'Nombre y calificación son requeridos' }, { status: 400 })
    }

    const calificacionesValidas = ['De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo']
    if (!calificacionesValidas.includes(calificacion)) {
      return NextResponse.json({ error: 'Calificación inválida' }, { status: 400 })
    }

    // Guardar la validación externa
    const { error: insertError } = await admin
      .from('validaciones_externas')
      .insert({
        token_id:    tokenData.id,
        objetivo_id: tokenData.objetivo_id,
        nombre:      nombre.trim(),
        email:       email?.trim() ?? null,
        cargo:       cargo?.trim() ?? null,
        empresa:     empresa?.trim() ?? null,
        calificacion,
        comentario:  comentario?.trim() ?? null,
      })

    if (insertError) {
      console.error('Error insertando validación:', insertError)
      return NextResponse.json({ error: 'Error guardando validación' }, { status: 500 })
    }

    // Marcar token como usado
    await admin
      .from('tokens_validacion')
      .update({ usado: true, usado_en: new Date().toISOString() })
      .eq('id', tokenData.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/validar:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
