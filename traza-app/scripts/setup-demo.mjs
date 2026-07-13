// ============================================================
// TRAZA — Setup demo users
// Correr UNA sola vez desde la carpeta del proyecto:
//   node scripts/setup-demo.mjs
// ============================================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://udsrqsefhcvsidnxrrly.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const MERIDIAN     = '4ffe2f78-5a3f-47c5-82b7-f903e6a39406'

if (!SERVICE_KEY) {
  console.error('ERROR: Falta SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  // Test conexión
  const { data: allUsers, error: connErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (connErr) { console.error('ERROR conexión:', connErr.message); process.exit(1) }
  console.log('✓ Conexión OK')

  // 0. Limpiar demo previo
  console.log('\n── 0. Limpiando demo previo...')
  const demoEmails = ['demo-pro@traza.app', 'demo-emp@traza.app', 'demo-mgr@traza.app']
  const demos = (allUsers?.users ?? []).filter(u => demoEmails.includes(u.email ?? ''))
  for (const u of demos) {
    await supabase.from('personas').delete().eq('user_id', u.id)
    await supabase.auth.admin.deleteUser(u.id)
    console.log('  Borrado:', u.email)
  }

  // 1. Nicolás Romero — Profesional independiente
  console.log('\n── 1. Creando Nicolás Romero (profesional)...')
  const { data: pro, error: proErr } = await supabase.auth.admin.createUser({
    email: 'demo-pro@traza.app', password: 'TrazaDemo2024!',
    email_confirm: true, user_metadata: { nombre: 'Nicolás', apellido: 'Romero' }
  })
  if (proErr) { console.error('ERROR:', proErr.message); process.exit(1) }
  const proId = pro.user.id

  const { error: proProfErr } = await supabase.from('profiles').upsert({
    id: proId, nombre: 'Nicolás', apellido: 'Romero',
    cargo: 'Consultor de Marketing Digital', area: 'Marketing',
    rol: 'individuo', empresa_id: null
  })
  if (proProfErr) console.warn('  [profile]', proProfErr.message)

  const { data: proP, error: proPErr } = await supabase.from('personas').insert({
    user_id: proId, nombre: 'Nicolás', apellido: 'Romero',
    cargo: 'Consultor de Marketing Digital',
    empresa_actual_nombre: 'Digital Boost Agency',
    tipo_cuenta: 'individual', empleo_activo: true,
    traza_id: 'TRZ-DEMO-NIC', credencial_publica: true
  }).select('id').single()
  if (proPErr) { console.error('  [persona]', proPErr.message); process.exit(1) }
  const proPId = proP.id
  console.log('  persona_id:', proPId)

  const { data: proObjs, error: proObjErr } = await supabase.from('objetivos').insert([
    { persona_id: proPId, titulo: 'Estrategia de contenido para cliente SaaS',
      descripcion: 'Diseñar y ejecutar plan de contenido de 90 días para startup B2B',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
      validacion: 'De acuerdo', fecha_limite: '2024-04-15', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Campaña de awareness — LinkedIn Ads',
      descripcion: 'Gestionar $5.000 USD en LinkedIn para generación de leads',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
      validacion: 'De acuerdo', fecha_limite: '2024-03-31', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Análisis competitivo de mercado fintech',
      descripcion: 'Benchmark de 12 competidores, entregable PDF ejecutivo',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Media',
      validacion: 'De acuerdo', fecha_limite: '2024-03-31', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Rediseño de onboarding email journey',
      descripcion: 'Optimizar secuencia de emails post-registro. Aumentar activación +15%',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
      validacion: 'De acuerdo', fecha_limite: '2024-06-30', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Certificación Google Ads',
      descripcion: 'Obtener certificación oficial para mejorar oferta de servicios',
      categoria: 'Aprendizaje', estado: 'Completado', prioridad: 'Media',
      validacion: 'De acuerdo', fecha_limite: '2024-04-30', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Lanzamiento canal YouTube — B2B Marketing',
      descripcion: 'Producir 8 episodios piloto, alcanzar 500 suscriptores en 60 días',
      categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
      fecha_limite: '2024-12-31', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Propuesta de retainer para cliente eCommerce',
      descripcion: 'Negociar y cerrar contrato de 6 meses de consultoría',
      categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
      fecha_limite: '2024-12-15', tipo: 'Personal', origen: 'autodefinido' },
    { persona_id: proPId, titulo: 'Portfolio profesional con casos reales',
      descripcion: 'Armar portfolio con métricas y resultados de los últimos 2 años',
      categoria: 'Aprendizaje', estado: 'Pendiente', prioridad: 'Media',
      fecha_limite: '2025-01-31', tipo: 'Personal', origen: 'autodefinido' },
  ]).select('id')
  if (proObjErr) console.warn('  [objetivos]', proObjErr.message)
  console.log('  objetivos:', proObjs?.length ?? 0)

  if (proObjs && proObjs.length >= 4) {
    const { error: ve } = await supabase.from('validaciones_externas').insert([
      { objetivo_id: proObjs[0].id, nombre: 'Laura Méndez', email: 'laura.mendez@saascompany.com',
        cargo: 'CMO', empresa: 'SaaS Company', calificacion: 'De acuerdo',
        comentario: 'Nicolás entregó exactamente lo que prometió. Estrategia sólida con resultados medibles.',
        confirmado: true },
      { objetivo_id: proObjs[1].id, nombre: 'Andrés Villalba', email: 'andres@agencia-paid.com',
        cargo: 'Especialista Paid Media', empresa: 'Agencia Digital', calificacion: 'De acuerdo',
        comentario: 'Performance sobresaliente. CPL muy por debajo del promedio del sector.',
        confirmado: true },
      { objetivo_id: proObjs[3].id, nombre: 'Camila Torres', email: 'ctorres@techstartup.io',
        cargo: 'CEO', empresa: 'Tech Startup', calificacion: 'De acuerdo',
        comentario: 'La nueva secuencia de emails mejoró nuestra activación del 18% al 31%.',
        confirmado: true },
    ])
    if (ve) console.warn('  [validaciones]', ve.message)
    else console.log('  validaciones externas OK')

    const { error: ae } = await supabase.from('objetivo_avances').insert([
      { objetivo_id: proObjs[0].id, persona_id: proPId, tipo: 'comentario',
        contenido: 'Finalicé el calendario editorial con 30 piezas. El cliente aprobó la estrategia.' },
      { objetivo_id: proObjs[0].id, persona_id: proPId, tipo: 'link',
        contenido: 'https://docs.google.com/presentation/estrategia-q1' },
      { objetivo_id: proObjs[1].id, persona_id: proPId, tipo: 'comentario',
        contenido: 'CPL promedio de $12 USD vs objetivo de $20. Superamos la meta de leads en 40%.' },
      { objetivo_id: proObjs[5].id, persona_id: proPId, tipo: 'comentario',
        contenido: 'Grabamos los primeros 3 episodios. Canal lanzado con trailer.' },
    ])
    if (ae) console.warn('  [avances]', ae.message)
    else console.log('  avances OK')
  }

  // 2. Martín Aguirre — Empleado Grupo Meridian
  console.log('\n── 2. Creando Martín Aguirre (empleado)...')
  const { data: emp, error: empErr } = await supabase.auth.admin.createUser({
    email: 'demo-emp@traza.app', password: 'TrazaDemo2024!',
    email_confirm: true, user_metadata: { nombre: 'Martín', apellido: 'Aguirre' }
  })
  if (empErr) { console.error('ERROR:', empErr.message); process.exit(1) }
  const empId = emp.user.id

  const { error: empProfErr } = await supabase.from('profiles').upsert({
    id: empId, nombre: 'Martín', apellido: 'Aguirre',
    cargo: 'Analista de Datos', area: 'Tecnología',
    rol: 'empleado', empresa_id: MERIDIAN
  })
  if (empProfErr) console.warn('  [profile]', empProfErr.message)

  const { data: empP, error: empPErr } = await supabase.from('personas').insert({
    user_id: empId, nombre: 'Martín', apellido: 'Aguirre',
    cargo: 'Analista de Datos', empresa_id: MERIDIAN,
    tipo_cuenta: 'empresa', empleo_activo: true,
    traza_id: 'TRZ-DEMO-MAR', credencial_publica: true
  }).select('id').single()
  if (empPErr) { console.error('  [persona]', empPErr.message); process.exit(1) }
  const empPId = empP.id
  console.log('  persona_id:', empPId)

  const { data: empObjs, error: empObjErr } = await supabase.from('objetivos').insert([
    { persona_id: empPId, empresa_id: MERIDIAN,
      titulo: 'Dashboard de métricas operacionales en Power BI',
      descripcion: 'Construir dashboard ejecutivo con KPIs de operaciones para gerencia',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
      validacion: 'De acuerdo', fecha_limite: '2024-04-30', tipo: 'Asignado' },
    { persona_id: empPId, empresa_id: MERIDIAN,
      titulo: 'Migración de reportes de Excel a automatización Python',
      descripcion: 'Automatizar 5 reportes semanales, reducir tiempo de armado en 80%',
      categoria: 'Resultado', estado: 'Completado', prioridad: 'Alta',
      validacion: 'De acuerdo', fecha_limite: '2024-06-30', tipo: 'Asignado' },
    { persona_id: empPId, empresa_id: MERIDIAN,
      titulo: 'Modelo de forecast de ventas Q4',
      descripcion: 'Desarrollar modelo predictivo para planificación de inventario',
      categoria: 'Resultado', estado: 'En progreso', prioridad: 'Alta',
      fecha_limite: '2024-12-31', tipo: 'Asignado' },
    { persona_id: empPId, empresa_id: MERIDIAN,
      titulo: 'Capacitación al equipo en Looker Studio',
      descripcion: 'Dar 3 talleres internos sobre visualización de datos',
      categoria: 'Aprendizaje', estado: 'En progreso', prioridad: 'Media',
      fecha_limite: '2024-11-30', tipo: 'Asignado' },
    { persona_id: empPId, empresa_id: MERIDIAN,
      titulo: 'Certificación en dbt (data build tool)',
      descripcion: 'Obtener certificación para unificar transformaciones de datos del equipo',
      categoria: 'Aprendizaje', estado: 'Pendiente', prioridad: 'Media',
      fecha_limite: '2025-02-28', tipo: 'Asignado' },
  ]).select('id')
  if (empObjErr) console.warn('  [objetivos]', empObjErr.message)
  console.log('  objetivos:', empObjs?.length ?? 0)

  if (empObjs && empObjs.length >= 4) {
    await supabase.from('objetivo_avances').insert([
      { objetivo_id: empObjs[0].id, persona_id: empPId, tipo: 'comentario',
        contenido: 'Dashboard terminado y presentado a gerencia. Ahora lo usan en las reuniones del lunes.' },
      { objetivo_id: empObjs[1].id, persona_id: empPId, tipo: 'link',
        contenido: 'https://github.com/martinaguirre/auto-reportes' },
      { objetivo_id: empObjs[2].id, persona_id: empPId, tipo: 'comentario',
        contenido: 'Primera versión del modelo con ARIMA. MAE del 8.3%. Ajustando variables externas.' },
      { objetivo_id: empObjs[3].id, persona_id: empPId, tipo: 'comentario',
        contenido: 'Primer taller completado con 12 personas. Preparando segunda sesión.' },
    ])
    console.log('  avances OK')
  }

  const hoy = new Date()
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
  const { error: csErr } = await supabase.from('cierres_semanales').insert({
    persona_id: empPId,
    semana: lunes.toISOString().split('T')[0],
    que_avance: 'Completé la segunda iteración del modelo de forecast. Mejoré el MAE a 6.1%.',
    que_obstaculos: 'El proveedor de datos externos tardó en actualizar el feed.',
    que_necesito: 'Acceso a datos históricos de ventas de los últimos 3 años.',
  })
  if (csErr) console.warn('  [cierre]', csErr.message)
  else console.log('  cierre semanal OK')

  // 3. Diego Sánchez — Manager / Supervisor
  console.log('\n── 3. Creando Diego Sánchez (manager)...')
  const { data: mgr, error: mgrErr } = await supabase.auth.admin.createUser({
    email: 'demo-mgr@traza.app', password: 'TrazaDemo2024!',
    email_confirm: true, user_metadata: { nombre: 'Diego', apellido: 'Sánchez' }
  })
  if (mgrErr) { console.error('ERROR:', mgrErr.message); process.exit(1) }
  const mgrId = mgr.user.id

  const { error: mgrProfErr } = await supabase.from('profiles').upsert({
    id: mgrId, nombre: 'Diego', apellido: 'Sánchez',
    cargo: 'Director de Recursos Humanos', area: 'RRHH',
    rol: 'supervisor', empresa_id: MERIDIAN
  })
  if (mgrProfErr) console.warn('  [profile]', mgrProfErr.message)
  console.log('  OK')

  console.log('\n══════════════════════════════════════════')
  console.log('✓ DEMO USERS CREADOS EXITOSAMENTE')
  console.log('══════════════════════════════════════════')
  console.log('  demo-pro@traza.app  / TrazaDemo2024!  → Nicolás (profesional)')
  console.log('  demo-emp@traza.app  / TrazaDemo2024!  → Martín  (empleado)')
  console.log('  demo-mgr@traza.app  / TrazaDemo2024!  → Diego   (manager)')
  console.log('\n  Probá el demo en: /demo')
}

run().catch(e => { console.error('\nFATAL:', e.message); process.exit(1) })
