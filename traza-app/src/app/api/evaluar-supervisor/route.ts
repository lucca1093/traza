import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const userClient = createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { empleadoId, empresaId, periodo, calificacion, aspectos, comentario } = await request.json()

  if (!empleadoId || !empresaId || !periodo || !calificacion) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from('evaluaciones_supervisor').upsert({
    empleado_id:  empleadoId,
    empresa_id:   empresaId,
    periodo,
    calificacion,
    aspectos:     aspectos ?? [],
    comentario:   comentario ?? null,
  }, { onConflict: 'empleado_id,periodo' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresaId')
  const empleadoId = searchParams.get('empleadoId')
  const periodo = searchParams.get('periodo')

  const admin = createAdminClient()

  // Si piden por empleado + periodo (verificar si ya evaluó este mes)
  if (empleadoId && periodo) {
    const { data } = await admin
      .from('evaluaciones_supervisor')
      .select('id, calificacion, aspectos, comentario')
      .eq('empleado_id', empleadoId)
      .eq('periodo', periodo)
      .single()
    return NextResponse.json({ evaluacion: data ?? null })
  }

  // Si piden resumen por empresa (para analytics)
  if (empresaId) {
    const { data } = await admin
      .from('evaluaciones_supervisor')
      .select('calificacion, aspectos, periodo, created_at')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    return NextResponse.json({ evaluaciones: data ?? [] })
  }

  return NextResponse.json({ evaluaciones: [] })
}
