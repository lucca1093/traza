import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

function generarToken(len = 32): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

export async function POST(request: NextRequest) {
  try {
    const userClient = createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

    const { empresaId, rol = 'empleado', email } = await request.json()
    if (!empresaId) return NextResponse.json({ error: 'empresaId requerido.' }, { status: 400 })

    const admin = createAdminClient()
    const token = generarToken()
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await admin
      .from('invitaciones')
      .insert({
        empresa_id: empresaId,
        email:      email ?? null,
        token,
        rol,
        creado_por: user.id,
        expira_en:  expira,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const url = `${baseUrl}/registro/unirse/${token}`

    return NextResponse.json({ token, url })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
