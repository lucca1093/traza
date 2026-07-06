import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'

  try {
    const admin = createAdminClient()
    const { token } = params

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

    return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=ok`)
  } catch (err) {
    console.error('Error en /api/confirmar-validacion:', err)
    return NextResponse.redirect(`${baseUrl}/confirmar-validacion/${token}?estado=error`)
  }
}
