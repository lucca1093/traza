import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/colaborar/[token] — carga todos los datos de la página pública
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = admin()

  const { data: externo, error } = await supabase
    .from('objetivo_externos')
    .select('*, grupo:objetivo_grupos(*)')
    .eq('token', params.token)
    .single()

  if (error || !externo) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Todos los objetivos del grupo (miembros internos)
  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('id, persona:personas(nombre, apellido)')
    .eq('grupo_id', externo.grupo_id)

  const objetivoIds = (objetivos ?? []).map((o: any) => o.id)

  // Avances de internos
  let avances: any[] = []
  if (objetivoIds.length > 0) {
    const { data: avs } = await supabase
      .from('objetivo_avances')
      .select('*')
      .in('objetivo_id', objetivoIds)
      .order('creado_en', { ascending: true })
    avances = avs ?? []
  }

  // Todos los externos del grupo (para ver su estado de completado)
  const { data: todosExternos } = await supabase
    .from('objetivo_externos')
    .select('id, nombre, empresa_nombre, completado_en')
    .eq('grupo_id', externo.grupo_id)

  // Avances de todos los externos
  const externosIds = (todosExternos ?? []).map((e: any) => e.id)
  if (externosIds.length > 0) {
    const { data: avsExt } = await supabase
      .from('objetivo_avances')
      .select('*')
      .in('externo_id', externosIds)
      .order('creado_en', { ascending: true })

    const existing = new Set(avances.map(a => a.id))
    const nuevos = (avsExt ?? []).filter(a => !existing.has(a.id))
    avances = [...avances, ...nuevos].sort(
      (a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()
    )
  }

  return NextResponse.json({
    externo,
    grupo:          externo.grupo,
    objetivos:      objetivos ?? [],
    avances,
    todosExternos:  todosExternos ?? [],
  })
}

// POST /api/colaborar/[token] — agrega un avance
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = admin()
  const { contenido, tipo } = await req.json()

  if (!contenido?.trim()) {
    return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
  }

  const { data: externo, error } = await supabase
    .from('objetivo_externos')
    .select('id, nombre, grupo_id')
    .eq('token', params.token)
    .single()

  if (error || !externo) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
  }

  // Primer objetivo del grupo para vincular el avance
  const { data: primer } = await supabase
    .from('objetivos')
    .select('id')
    .eq('grupo_id', externo.grupo_id)
    .limit(1)
    .maybeSingle()

  const { error: insertError } = await supabase.from('objetivo_avances').insert({
    objetivo_id:    primer?.id ?? null,
    externo_id:     externo.id,
    nombre_externo: externo.nombre,
    contenido:      contenido.trim(),
    tipo:           tipo ?? 'comentario',
    creado_en:      new Date().toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/colaborar/[token] — marca la parte del externo como completada
export async function PATCH(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = admin()

  const { error } = await supabase
    .from('objetivo_externos')
    .update({ completado_en: new Date().toISOString() })
    .eq('token', params.token)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
