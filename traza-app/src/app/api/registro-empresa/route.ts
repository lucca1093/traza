import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

function generarToken(len = 32): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

// Recibe userId ya creado por el cliente vía signUp
export async function POST(request: NextRequest) {
  try {
    const { empresaNombre, rubro, tamano, nombre, apellido, cargo, userId } = await request.json()

    if (!empresaNombre || !userId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Crear la empresa
    const { data: empresa, error: empresaError } = await admin
      .from('empresas')
      .insert({ nombre: empresaNombre.trim(), rubro: rubro ?? null })
      .select('id, nombre')
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json({ error: 'Error creando la empresa: ' + (empresaError?.message ?? 'desconocido') }, { status: 500 })
    }

    // 2. Crear el profile con rol admin
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:         userId,
        empresa_id: empresa.id,
        nombre:     nombre?.trim() ?? null,
        apellido:   apellido?.trim() ?? null,
        cargo:      cargo?.trim() ?? null,
        rol:        'admin',
      })

    if (profileError) {
      console.error('Error creando profile:', profileError)
      // No bloqueamos — el usuario puede completar su perfil después
    }

    // 3. Generar token de invitación inicial
    const token = generarToken()
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await admin.from('invitaciones').insert({
      empresa_id: empresa.id,
      token,
      rol:        'empleado',
      creado_por: userId,
      expira_en:  expira,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const inviteUrl = `${baseUrl}/registro/unirse/${token}`

    return NextResponse.json({ empresaId: empresa.id, empresaNombre: empresa.nombre, inviteUrl })
  } catch (err: any) {
    console.error('Error en registro-empresa:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
