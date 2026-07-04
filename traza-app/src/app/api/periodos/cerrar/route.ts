import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

function calcularScore(objetivos: any[]): {
  score: number; completados: number; validados: number; parciales: number; rechazados: number; cumplimiento: number
} {
  const total       = objetivos.length
  const completados = objetivos.filter(o => o.estado === 'Completado').length
  const validados   = objetivos.filter(o => o.validacion === 'De acuerdo').length
  const parciales   = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo').length
  const rechazados  = objetivos.filter(o => o.validacion === 'En desacuerdo').length
  const cumplimiento = total > 0 ? Math.round((completados / total) * 100) : 0

  // Score simplificado para el período
  const moduloA = total > 0
    ? Math.round(((validados * 1 + parciales * 0.5) / total) * 100)
    : 50
  const moduloB = cumplimiento
  const score   = Math.round(moduloA * 0.6 + moduloB * 0.4)

  return { score, completados, validados, parciales, rechazados, cumplimiento }
}

function estadoGeneral(score: number, total: number): string {
  if (total === 0) return 'Sin datos'
  if (score >= 70) return 'Cumplió'
  if (score >= 40) return 'Cumplió parcialmente'
  return 'No cumplió'
}

export async function POST(req: NextRequest) {
  const supabaseAuth = createServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabaseAuth
    .from('profiles').select('empresa_id, rol').eq('id', user.id).single()

  if (!['admin', 'super_admin', 'supervisor'].includes(profile?.rol ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { periodoId } = await req.json()
  if (!periodoId) return NextResponse.json({ error: 'periodoId requerido' }, { status: 400 })

  const sb = admin()

  // Obtener el período
  const { data: periodo, error: perError } = await sb
    .from('periodos_evaluacion')
    .select('*')
    .eq('id', periodoId)
    .single()

  if (perError || !periodo) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
  if (periodo.estado === 'cerrado') return NextResponse.json({ error: 'El período ya está cerrado' }, { status: 400 })

  // Todas las personas de la empresa
  const { data: personas } = await sb
    .from('personas')
    .select('id, nombre, apellido')
    .eq('empresa_id', periodo.empresa_id)

  if (!personas?.length) {
    return NextResponse.json({ error: 'No hay personas en la empresa' }, { status: 400 })
  }

  // Objetivos del período (por fecha_limite dentro del rango, o creados en el rango)
  const { data: todosObjetivos } = await sb
    .from('objetivos')
    .select('*')
    .eq('empresa_id', periodo.empresa_id)
    .or(`fecha_limite.gte.${periodo.fecha_inicio},fecha_limite.lte.${periodo.fecha_fin}`)

  // Generar resumen por persona
  const resumenes = personas.map((persona: any) => {
    const obsPersona = (todosObjetivos ?? []).filter((o: any) => o.persona_id === persona.id)
    const { score, completados, validados, parciales, rechazados, cumplimiento } = calcularScore(obsPersona)
    return {
      periodo_id:      periodoId,
      empresa_id:      periodo.empresa_id,
      persona_id:      persona.id,
      score,
      total_objetivos: obsPersona.length,
      completados,
      cumplimiento,
      validados,
      parciales,
      rechazados,
      estado_general:  estadoGeneral(score, obsPersona.length),
    }
  })

  // Insertar resúmenes
  const { error: insertError } = await sb.from('resumen_periodo_empleado').insert(resumenes)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Cerrar el período
  await sb.from('periodos_evaluacion').update({
    estado:     'cerrado',
    cerrado_por: user.id,
    cerrado_en:  new Date().toISOString(),
  }).eq('id', periodoId)

  return NextResponse.json({ ok: true, resumenesGenerados: resumenes.length })
}
