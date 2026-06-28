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

    // Verificar que el objetivo existe y pertenece al usuario
    const { data: objetivo } = await admin
      .from('objetivos')
      .select('id, titulo, persona_id, personas!inner(user_id)')
      .eq('id', objetivoId)
      .single()

    if (!objetivo) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 })
    }

    const personas = (objetivo as any).personas
    const personaUserId = Array.isArray(personas) ? personas[0]?.user_id : personas?.user_id
    if (personaUserId !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este objetivo' }, { status: 403 })
    }

    // Generar token único
    const token = generarTokenAleatorio()

    const { data: tokenData, error } = await admin
      .from('tokens_validacion')
      .insert({
        objetivo_id: objetivoId,
        token,
        creado_por: user.id,
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando token:', error)
      return NextResponse.json({ error: 'Error creando token' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const url = `${baseUrl}/validar/${token}`

    return NextResponse.json({ token, url, objetivoTitulo: (objetivo as any).titulo })
  } catch (err) {
    console.error('Error en generar-token:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
