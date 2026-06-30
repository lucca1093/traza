import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const empresaId  = searchParams.get('empresaId')
  const empleadoId = searchParams.get('empleadoId')
  const supervisorId = searchParams.get('supervisorId')

  const admin = createAdminClient()

  let query = admin
    .from('reuniones_1on1')
    .select(`
      *,
      empleado:personas!reuniones_1on1_empleado_id_fkey(id, nombre, apellido, cargo, area),
      supervisor:personas!reuniones_1on1_supervisor_id_fkey(id, nombre, apellido),
      objetivo:objetivos(id, titulo)
    `)
    .order('fecha', { ascending: false })

  if (empresaId)    query = query.eq('empresa_id', empresaId)
  if (empleadoId)   query = query.eq('empleado_id', empleadoId)
  if (supervisorId) query = query.eq('supervisor_id', supervisorId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reuniones: data ?? [] })
}

export async function POST(request: NextRequest) {
  const userClient = createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { empresaId, supervisorId, empleadoId, fecha, agenda, notas, acuerdos, objetivoId } = await request.json()

  if (!empresaId || !supervisorId || !empleadoId || !fecha) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('reuniones_1on1').insert({
    empresa_id:    empresaId,
    supervisor_id: supervisorId,
    empleado_id:   empleadoId,
    fecha,
    agenda:     agenda?.trim()   || null,
    notas:      notas?.trim()    || null,
    acuerdos:   acuerdos?.trim() || null,
    objetivo_id: objetivoId || null,
    created_by:  user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reunion: data })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const userClient = createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('reuniones_1on1').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
