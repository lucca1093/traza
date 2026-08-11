import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Obtener persona del usuario
    const { data: persona } = await admin
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .eq('empleo_activo', true)
      .maybeSingle()

    if (!persona) {
      return NextResponse.json({ objetivos: [] })
    }

    // Cargar objetivos bypasseando RLS
    const { data: objetivos } = await admin
      .from('objetivos')
      .select('*, grupo:objetivo_grupos(tipo)')
      .eq('persona_id', persona.id)
      .order('fecha_limite', { ascending: true, nullsFirst: false })

    return NextResponse.json({ objetivos: objetivos ?? [] })
  } catch (err) {
    console.error('mis-objetivos error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
