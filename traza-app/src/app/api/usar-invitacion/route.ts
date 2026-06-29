import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { token, userId, empresaId, nombre, apellido, cargo, email } = await request.json()

    if (!token || !userId || !empresaId) {
      return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verificar que el token existe y no fue usado
    const { data: inv } = await admin
      .from('invitaciones')
      .select('id, usado, expira_en')
      .eq('token', token)
      .single()

    if (!inv || inv.usado || new Date(inv.expira_en) < new Date()) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 400 })
    }

    // Crear profile vinculado a la empresa
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:         userId,
        empresa_id: empresaId,
        nombre:     nombre ?? null,
        apellido:   apellido ?? null,
        cargo:      cargo ?? null,
        rol:        'empleado',
      })

    if (profileError) {
      console.error('Error creando profile:', profileError)
      return NextResponse.json({ error: 'Error vinculando la cuenta.' }, { status: 500 })
    }

    // Marcar invitación como usada
    await admin
      .from('invitaciones')
      .update({ usado: true, usado_en: new Date().toISOString(), usado_por: userId })
      .eq('id', inv.id)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error en usar-invitacion:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
