import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/demo/setup
// Crea los 3 usuarios demo en Supabase.
// Solo ejecutar UNA vez. Protegido por query param secret.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== 'TrazaSetup2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const MERIDIAN = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'
  const results: Record<string, unknown> = {}

  // ── Paso 0: limpiar usuarios demo previos ──────────────────
  const demoEmails = ['demo-pro@traza.app', 'demo-emp@traza.app', 'demo-mgr@traza.app']
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const toDelete = existingUsers?.users?.filter(u => demoEmails.includes(u.email ?? '')) ?? []
  for (const u of toDelete) {
    // Borrar persona + datos en cascada
    await supabase.from('personas').delete().eq('user_id', u.id)
    await supabase.auth.admin.deleteUser(u.id)
  }
  results.cleanup = `Deleted ${toDelete.length} existing demo user(s)`

  // ── Paso 1: Nicolás Romero — Profesional independiente ─────
  const { data: proUser, error: proErr } = await supabase.auth.admin.createUser({
    email: 'demo-pro@traza.app',
    password: 'TrazaDemo2024!',
    email_confirm: true,
    user_metadata: { nombre: 'Nicolás', apellido: 'Romero' },
  })
  if (proErr || !proUser?.user) {
    return NextResponse.json({ error: 'Error creando demo-pro', detail: proErr?.message }, { status: 500 })
  }
  const proId = proUser.user.id

  await supabase.from('profiles').upsert({
    id: proId, nombre: 'Nicolás', apellido: 'Romero',
    cargo: 'Consultor de Marketing Digital', area: 'Marketing',
    rol: 'individuo', empresa_id: null,
  })

  const { data: proPersona } = await supabase.from('personas').insert({
    user_id: proId, nombre: 'Nicolás', apellido: 'Romero',
    cargo: 'Consultor de Marketing Digital',
    empresa_actual_nombre: 'Digital Boost Agency',
    tipo_cuenta: 'individual', empleo_activo: true,
    traza_id: 'TRZ-DEMO-NIC', credencial_publica: true,
  }).select('id').single()
  const proPersonaId = proPersona?.id
  results.pro = { userId: proId, personaId: proPersonaId }

  // Objetivos Nicolás
  if (proPersonaId) {
    const { data: objs } = await supabase.from('objetivos').insert([
      { persona_id: proPersonaId, titulo: 'Estrategia de contenido para cliente SaaS',
        descripcion: 'Diseñar y ejecutar plan de contenido de 90 días para startup B2B',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
        validacion: 'De acuerdo', fecha_limite: '2024-04-15', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Campaña de awareness — LinkedIn Ads',
        descripcion: 'Gestionar presupuesto de $5.000 USD en LinkedIn para generación de leads',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
        validacion: 'De acuerdo', fecha_limite: '2024-03-31', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Análisis competitivo de mercado fintech',
        descripcion: 'Benchmark de 12 competidores, entregable PDF ejecutivo',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Media',
        validacion: 'De acuerdo', fecha_limite: '2024-03-31', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Rediseño de onboarding email journey',
        descripcion: 'Optimizar secuencia de emails post-registro. Aumentar activación +15%',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
        validacion: 'De acuerdo', fecha_limite: '2024-06-30', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Certificación Google Ads',
        descripcion: 'Obtener certificación oficial para mejorar oferta de servicios',
        categoria: 'Aprendizaje', estado: 'Completado', prioridad: 'Media',
        validacion: 'De acuerdo', fecha_limite: '2024-04-30', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Lanzamiento canal YouTube — B2B Marketing',
        descripcion: 'Producir 8 episodios piloto, alcanzar 500 suscriptores en 60 días',
        categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
        fecha_limite: '2024-12-31', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Propuesta de retainer para cliente eCommerce',
        descripcion: 'Negociar y cerrar contrato de 6 meses de consultoría',
        categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
        fecha_limite: '2024-12-15', tipo: 'Personal', origen: 'autodefinido' },
      { persona_id: proPersonaId, titulo: 'Portfolio profesional con casos reales',
        descripcion: 'Armar portfolio con métricas y resultados de los últimos 2 años',
        categoria: 'Aprendizaje', estado: 'Pendiente', prioridad: 'Media',
        fecha_limite: '2025-01-31', tipo: 'Personal', origen: 'autodefinido' },
    ]).select('id, titulo')
    results.proObjetivos = objs?.length ?? 0

    // Validaciones externas Nicolás (solo los 4 primeros objetivos completados)
    if (objs && objs.length >= 4) {
      await supabase.from('validaciones_externas').insert([
        { objetivo_id: objs[0].id, nombre: 'Laura Méndez', email: 'laura.mendez@saascompany.com',
          cargo: 'CMO', empresa: 'SaaS Company',
          calificacion: 'De acuerdo',
          comentario: 'Nicolás entregó exactamente lo que prometió: una estrategia sólida con resultados medibles.',
          confirmado: true },
        { objetivo_id: objs[1].id, nombre: 'Andrés Villalba', email: 'andres@agencia-paid.com',
          cargo: 'Especialista Paid Media', empresa: 'Agencia Paid',
          calificacion: 'De acuerdo',
          comentario: 'El performance de la campaña fue sobresaliente. CPL muy por debajo del promedio del sector.',
          confirmado: true },
        { objetivo_id: objs[3].id, nombre: 'Camila Torres', email: 'ctorres@techstartup.io',
          cargo: 'CEO', empresa: 'Tech Startup',
          calificacion: 'De acuerdo',
          comentario: 'La nueva secuencia de emails mejoró nuestra tasa de activación del 18% al 31%.',
          confirmado: true },
      ])
    }

    // Avances Nicolás
    if (objs && objs.length >= 2) {
      await supabase.from('objetivo_avances').insert([
        { objetivo_id: objs[0].id, persona_id: proPersonaId, tipo: 'comentario',
          contenido: 'Finalicé el calendario editorial con 30 piezas. El cliente aprobó la estrategia.' },
        { objetivo_id: objs[0].id, persona_id: proPersonaId, tipo: 'link',
          contenido: 'https://docs.google.com/presentation/estrategia-q1' },
        { objetivo_id: objs[1].id, persona_id: proPersonaId, tipo: 'comentario',
          contenido: 'CPL promedio de $12 USD vs objetivo de $20. Superamos la meta de leads en 40%.' },
        { objetivo_id: objs[5].id, persona_id: proPersonaId, tipo: 'comentario',
          contenido: 'Grabamos los primeros 3 episodios. Canal lanzado con trailer.' },
      ])
    }
  }

  // ── Paso 2: Martín Aguirre — Empleado Grupo Meridian ───────
  const { data: empUser, error: empErr } = await supabase.auth.admin.createUser({
    email: 'demo-emp@traza.app',
    password: 'TrazaDemo2024!',
    email_confirm: true,
    user_metadata: { nombre: 'Martín', apellido: 'Aguirre' },
  })
  if (empErr || !empUser?.user) {
    return NextResponse.json({ error: 'Error creando demo-emp', detail: empErr?.message }, { status: 500 })
  }
  const empId = empUser.user.id

  await supabase.from('profiles').upsert({
    id: empId, nombre: 'Martín', apellido: 'Aguirre',
    cargo: 'Analista de Datos', area: 'Tecnología',
    rol: 'empleado', empresa_id: MERIDIAN,
  })

  const { data: empPersona } = await supabase.from('personas').insert({
    user_id: empId, nombre: 'Martín', apellido: 'Aguirre',
    cargo: 'Analista de Datos', empresa_id: MERIDIAN,
    tipo_cuenta: 'empresa', empleo_activo: true,
    traza_id: 'TRZ-DEMO-MAR', credencial_publica: true,
  }).select('id').single()
  const empPersonaId = empPersona?.id
  results.emp = { userId: empId, personaId: empPersonaId }

  // Objetivos Martín
  if (empPersonaId) {
    const { data: mObjs } = await supabase.from('objetivos').insert([
      { persona_id: empPersonaId, empresa_id: MERIDIAN,
        titulo: 'Dashboard de métricas operacionales en Power BI',
        descripcion: 'Construir dashboard ejecutivo con KPIs de operaciones para gerencia',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
        validacion: 'De acuerdo', fecha_limite: '2024-04-30', tipo: 'Asignado' },
      { persona_id: empPersonaId, empresa_id: MERIDIAN,
        titulo: 'Migración de reportes de Excel a automatización Python',
        descripcion: 'Automatizar 5 reportes semanales, reducir tiempo de armado en 80%',
        categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
        validacion: 'De acuerdo', fecha_limite: '2024-06-30', tipo: 'Asignado' },
      { persona_id: empPersonaId, empresa_id: MERIDIAN,
        titulo: 'Modelo de forecast de ventas Q4',
        descripcion: 'Desarrollar modelo predictivo para planificación de inventario',
        categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
        fecha_limite: '2024-12-31', tipo: 'Asignado' },
      { persona_id: empPersonaId, empresa_id: MERIDIAN,
        titulo: 'Capacitación al equipo en uso de Looker Studio',
        descripcion: 'Dar 3 talleres internos sobre visualización de datos',
        categoria: 'Aprendizaje', estado: 'En progreso', prioridad: 'Media',
        fecha_limite: '2024-11-30', tipo: 'Asignado' },
      { persona_id: empPersonaId, empresa_id: MERIDIAN,
        titulo: 'Certificación en dbt (data build tool)',
        descripcion: 'Obtener certificación para unificar transformaciones de datos del equipo',
        categoria: 'Aprendizaje', estado: 'Pendiente', prioridad: 'Media',
        fecha_limite: '2025-02-28', tipo: 'Asignado' },
    ]).select('id')
    results.empObjetivos = mObjs?.length ?? 0

    if (mObjs && mObjs.length >= 2) {
      await supabase.from('objetivo_avances').insert([
        { objetivo_id: mObjs[0].id, persona_id: empPersonaId, tipo: 'comentario',
          contenido: 'Dashboard terminado y presentado a gerencia. Ahora lo usan en las reuniones del lunes.' },
        { objetivo_id: mObjs[1].id, persona_id: empPersonaId, tipo: 'link',
          contenido: 'https://github.com/martinaguirre/auto-reportes' },
        { objetivo_id: mObjs[2].id, persona_id: empPersonaId, tipo: 'comentario',
          contenido: 'Primera versión del modelo con ARIMA. MAE del 8.3%. Ajustando variables externas.' },
        { objetivo_id: mObjs[3].id, persona_id: empPersonaId, tipo: 'comentario',
          contenido: 'Primer taller completado con 12 personas. Preparando segunda sesión.' },
      ])
    }

    // Cierre semanal Martín
    const semana = new Date()
    semana.setDate(semana.getDate() - semana.getDay() + 1) // lunes de esta semana
    await supabase.from('cierres_semanales').insert({
      persona_id: empPersonaId,
      semana: semana.toISOString().split('T')[0],
      que_avance: 'Completé la segunda iteración del modelo de forecast. Mejoré el MAE a 6.1%.',
      que_obstaculos: 'El proveedor de datos externos tardó en actualizar el feed.',
      que_necesito: 'Acceso a datos históricos de ventas de los últimos 3 años.',
    })
  }

  // ── Paso 3: Diego Sánchez — Manager Grupo Meridian ─────────
  const { data: mgrUser, error: mgrErr } = await supabase.auth.admin.createUser({
    email: 'demo-mgr@traza.app',
    password: 'TrazaDemo2024!',
    email_confirm: true,
    user_metadata: { nombre: 'Diego', apellido: 'Sánchez' },
  })
  if (mgrErr || !mgrUser?.user) {
    return NextResponse.json({ error: 'Error creando demo-mgr', detail: mgrErr?.message }, { status: 500 })
  }
  const mgrId = mgrUser.user.id

  await supabase.from('profiles').upsert({
    id: mgrId, nombre: 'Diego', apellido: 'Sánchez',
    cargo: 'Director de Recursos Humanos', area: 'RRHH',
    rol: 'supervisor', empresa_id: MERIDIAN,
  })

  results.mgr = { userId: mgrId }

  return NextResponse.json({
    success: true,
    message: '✓ Demo users creados',
    credentials: {
      pro: 'demo-pro@traza.app / TrazaDemo2024!',
      emp: 'demo-emp@traza.app / TrazaDemo2024!',
      mgr: 'demo-mgr@traza.app / TrazaDemo2024!',
    },
    results,
  })
}
