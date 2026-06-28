import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient } from '@/lib/supabase-server'

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
    // Verificar que el usuario está autenticado
    const userClient = createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { objetivoId } = await request.json()
    if (!objetivoId) {
      return NextResponse.json({ error: 'objetivoId requerido' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verificar que el objetivo existe
    const { data: objetivo } = await admin
      .from('objetivos')
      .select('id, titulo, empresa_id')
      .eq('id', objetivoId)
      .single()

    if (!objetivo) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario pertenece a la misma empresa que el objetivo
    // (empleados, supervisores y admins pueden generar tokens)
    const { data: profile } = await admin
      .from('profiles')
      .select('empresa_id, rol')
      .eq('id', user.id)
      .single()

    const tieneAcceso = profile?.rol === 'super_admin'
      || profile?.empresa_id === (objetivo as any).empresa_id

    if (!tieneAcceso) {
      return NextResponse.json({ error: 'No autorizado para este objetivo' }, { status: 403 })
    }

    // Generar token único
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

    return NextResponse.json({ token, url, objetivoTitulo: (objetivo as any).titulo })
  } catch (err) {
    console.error('Error en generar-token:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
