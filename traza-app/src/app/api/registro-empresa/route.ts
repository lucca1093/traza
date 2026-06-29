import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

function generarToken(len = 32): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let t = ''
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

export async function POST(request: NextRequest) {
  try {
    const {
      // Empresa
      empresaNombre, rubro, tamano,
      // Admin
      nombre, apellido, cargo, email, password,
    } = await request.json()

    if (!empresaNombre || !nombre || !apellido || !email || !password) {
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

    // 2. Crear el usuario admin en Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,           // confirmado automáticamente
      user_metadata: { nombre: nombre.trim(), apellido: apellido.trim() },
    })

    if (authError || !authData.user) {
      // Rollback empresa
      await admin.from('empresas').delete().eq('id', empresa.id)
      return NextResponse.json({
        error: authError?.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email.'
          : (authError?.message ?? 'Error creando la cuenta.')
      }, { status: 400 })
    }

    const userId = authData.user.id

    // 3. Crear el profile con rol admin
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:         userId,
        empresa_id: empresa.id,
        nombre:     nombre.trim(),
        apellido:   apellido.trim(),
        cargo:      cargo?.trim() ?? null,
        rol:        'admin',
      })

    if (profileError) {
      console.error('Error creando profile:', profileError)
      // No bloqueamos — el usuario puede completar su perfil después
    }

    // 4. Generar token de invitación pre-creado para el equipo
    const token = generarToken()
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días

    const { error: invError } = await admin
      .from('invitaciones')
      .insert({
        empresa_id: empresa.id,
        token,
        rol:        'empleado',
        creado_por: userId,
        expira_en:  expira,
      })

    if (invError) console.error('Error creando invitación inicial:', invError)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const inviteUrl = `${baseUrl}/registro/unirse/${token}`

    return NextResponse.json({
      empresaId:   empresa.id,
      empresaNombre: empresa.nombre,
      userId,
      inviteUrl,
      token,
    })
  } catch (err: any) {
    console.error('Error en registro-empresa:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
