import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

function generarTokenAleatorio(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

export async function POST(request: NextRequest) {
  try {
    const userClient = createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { objetivoId } = await request.json()
    if (!objetivoId) {
      return NextResponse.json({ error: 'objetivoId requerido' }, { status: 400 })
    }

    // Usamos el cliente del usuario para verificar acceso via RLS
    // Si puede leer el objetivo, está autorizado
    const { data: objetivo } = await userClient
      .from('objetivos')
      .select('id, titulo')
      .eq('id', objetivoId)
      .single()

    if (!objetivo) {
      return NextResponse.json({ error: 'Objetivo no encontrado o sin acceso' }, { status: 403 })
    }

    // Insertar con admin client (bypasa RLS para el insert)
    const admin = createAdminClient()
    const token = generarTokenAleatorio()

    const { error: insertError } = await admin
      .from('tokens_validacion')
      .insert({
        objetivo_id: objetivoId,
        token,
        creado_por:  user.id,
        expira_en:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

    if (insertError) {
      console.error('Error creando token:', insertError)
      return NextResponse.json({ error: 'Error creando token: ' + insertError.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const url = `${baseUrl}/validar/${token}`

    return NextResponse.json({ token, url, objetivoTitulo: objetivo.titulo })
  } catch (err: any) {
    console.error('Error en generar-token:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
