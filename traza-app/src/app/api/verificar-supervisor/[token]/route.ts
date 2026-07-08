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

    const { data: persona } = await admin
      .from('personas')
      .select('id, nombre, apellido, supervisor_verificado, empresa_actual_nombre')
      .eq('supervisor_token', token)
      .maybeSingle()

    if (!persona) {
      return NextResponse.redirect(`${baseUrl}/verificar-supervisor/${token}?estado=invalido`)
    }

    if (persona.supervisor_verificado) {
      return NextResponse.redirect(`${baseUrl}/verificar-supervisor/${token}?estado=ya_verificado`)
    }

    await admin
      .from('personas')
      .update({ supervisor_verificado: true })
      .eq('id', persona.id)

    // Notificar al empleado
    await admin.from('notificaciones').insert({
      empresa_id:  null,
      persona_id:  persona.id,
      tipo:        'supervisor_verificado',
      objetivo_id: null,
      mensaje:     `✅ Tu supervisor confirmó tu vínculo laboral en ${persona.empresa_actual_nombre ?? 'tu empresa'}`,
    })

    return NextResponse.redirect(`${baseUrl}/verificar-supervisor/${token}?estado=ok&nombre=${encodeURIComponent(persona.nombre + ' ' + persona.apellido)}`)
  } catch (err) {
    console.error('Error en verificar-supervisor:', err)
    return NextResponse.redirect(`${baseUrl}/verificar-supervisor/${token}?estado=error`)
  }
}
