import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

function generarTrazaId(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums   = '23456789'
  const p1 = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  const p2 = Array.from({ length: 4 }, () => nums[Math.floor(Math.random() * nums.length)]).join('')
  return `TRZ-${p1}-${p2}`
}

export async function POST() {
  try {
    // Verificar sesión del usuario
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Verificar que no exista ya una persona
    const { data: existing } = await admin
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Retornar la persona completa para que el frontend no tenga que re-fetchear
      return NextResponse.json({ ok: true, already_existed: true, persona: existing })
    }

    // Obtener datos del profile o user_metadata
    const { data: profile } = await admin
      .from('profiles')
      .select('nombre, apellido, cargo, rol')
      .eq('id', user.id)
      .maybeSingle()

    const meta     = (user.user_metadata ?? {}) as Record<string, string>
    const nombre   = profile?.nombre   ?? meta.nombre   ?? user.email?.split('@')[0] ?? ''
    const apellido = profile?.apellido ?? meta.apellido ?? ''
    const cargo    = profile?.cargo    ?? null

    // Crear profile si no existe
    if (!profile) {
      await admin.from('profiles').upsert({
        id: user.id, nombre, apellido, cargo, rol: 'individuo', empresa_id: null,
      }, { onConflict: 'id' })
    }

    // Crear persona con admin client (bypasea RLS)
    const { data: persona, error: insertError } = await admin.from('personas').insert({
      user_id:            user.id,
      nombre,
      apellido,
      cargo,
      tipo_cuenta:        'individual',
      empleo_activo:      true,
      traza_id:           generarTrazaId(),
      credencial_publica: true,
    }).select().single()

    if (insertError) {
      console.error('setup-persona insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, persona })
  } catch (err) {
    console.error('setup-persona error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
