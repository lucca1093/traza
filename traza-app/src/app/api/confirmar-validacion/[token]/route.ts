import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'
  const { token } = params

  try {
    const admin = createAdminClient()

    const { data: validacion, error } = await admin
      .from('validaciones_externas')
      .select('id, confirmado')
      .eq('token_confirmacion', token)
      .single()

    if (error || !validacion) {
      return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=invalido`)
    }

    if (validacion.confirmado) {
      return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=ya_confirmado`)
    }

    await admin
      .from('validaciones_externas')
      .update({ confirmado: true })
      .eq('id', validacion.id)

    // Notificar al empleado dueño del objetivo
    const { data: valFull } = await admin
      .from('validaciones_externas')
      .select('objetivo_id, nombre, objetivo:objetivos(titulo, empresa_id, persona:personas(id))')
      .eq('id', validacion.id)
      .maybeSingle()

    if (valFull?.objetivo) {
      const obj = valFull.objetivo as any
      const personaId = Array.isArray(obj.persona) ? obj.persona[0]?.id : obj.persona?.id
      if (personaId) {
        await admin.from('notificaciones').insert({
          empresa_id:  obj.empresa_id ?? null,
          persona_id:  personaId,
          tipo:        'validacion_externa_confirmada',
          objetivo_id: valFull.objetivo_id,
          mensaje:     `✅ ${valFull.nombre} confirmó su validación en "${obj.titulo}"`,
        })
      }
    }

    return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=ok`)
  } catch (err) {
    console.error('Error en /api/confirmar-validacion:', err)
    return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=error`)
  }
}
