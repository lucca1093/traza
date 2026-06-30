/**
 * seed-1on1.mjs
 * Carga reuniones 1:1 de ejemplo para 2 empleados de la empresa de prueba.
 * Uso: node scripts/seed-1on1.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('🔍 Buscando empresa de prueba...')

  // Tomar la primera empresa disponible
  const { data: empresas } = await supabase
    .from('empresas').select('id, nombre').limit(1)
  if (!empresas?.length) { console.error('❌ No hay empresas.'); return }

  const empresa = empresas[0]
  console.log(`✅ Empresa: ${empresa.nombre} (${empresa.id})`)

  // Buscar personas activas de esa empresa
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, cargo')
    .eq('empresa_id', empresa.id)
    .eq('empleo_activo', true)
    .order('apellido')
    .limit(4)

  if (!personas || personas.length < 2) {
    console.error('❌ Necesitás al menos 2 personas en la empresa.')
    return
  }

  console.log('\n👥 Personas encontradas:')
  personas.forEach((p, i) => console.log(`   ${i+1}. ${p.nombre} ${p.apellido} — ${p.cargo}`))

  // El primero hace de supervisor, los siguientes de empleados
  const supervisor = personas[0]
  const emp1 = personas[1]
  const emp2 = personas[2] ?? personas[1] // si solo hay 2, usamos el mismo

  const hoy = new Date()
  const hace = (dias) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - dias)
    return d.toISOString().split('T')[0]
  }

  // Buscar un objetivo de emp1 para vincularlo
  const { data: obs1 } = await supabase
    .from('objetivos').select('id, titulo').eq('persona_id', emp1.id).limit(1)
  const objetivo1 = obs1?.[0] ?? null

  const { data: obs2 } = await personas[2]
    ? await supabase.from('objetivos').select('id, titulo').eq('persona_id', emp2.id).limit(1)
    : { data: null }
  const objetivo2 = obs2?.[0] ?? null

  console.log('\n📋 Insertando reuniones de ejemplo...')

  const reuniones = [
    // === Empleado 1 ===
    {
      empresa_id:    empresa.id,
      supervisor_id: supervisor.id,
      empleado_id:   emp1.id,
      fecha: hace(45),
      agenda:   'Revisión de objetivos del trimestre. Ajuste de prioridades para Q3.',
      notas:    `${emp1.nombre} comentó que se siente bien con los objetivos de impacto pero que tiene dificultades con los tiempos del área de sistemas para poder avanzar. El bloqueo principal es la falta de acceso al módulo de reportes.`,
      acuerdos: `- ${supervisor.nombre} gestiona el acceso al módulo antes del viernes.\n- ${emp1.nombre} envía un mail documentando el bloqueo para tener trazabilidad.`,
      objetivo_id: objetivo1?.id ?? null,
    },
    {
      empresa_id:    empresa.id,
      supervisor_id: supervisor.id,
      empleado_id:   emp1.id,
      fecha: hace(14),
      agenda:   'Seguimiento de acuerdos anteriores. Desarrollo profesional.',
      notas:    `El acceso al módulo se resolvió. ${emp1.nombre} pudo avanzar con el objetivo. Comentó interés en participar en la capacitación de liderazgo que se está organizando. Se ve motivado y con buena energía.`,
      acuerdos: `- ${supervisor.nombre} evalúa incluirlo en el programa de liderazgo del semestre.\n- Próxima reunión en 2 semanas para ver avance del objetivo.`,
      objetivo_id: objetivo1?.id ?? null,
    },
    {
      empresa_id:    empresa.id,
      supervisor_id: supervisor.id,
      empleado_id:   emp1.id,
      fecha: hace(1),
      agenda:   'Check-in mensual. Cierre de objetivo.',
      notas:    `${emp1.nombre} cerró el objetivo con éxito. La autoevaluación que envió está alineada con lo que vio el equipo. Mencionó que el mes fue exigente pero que se siente orgulloso del resultado. Consultó sobre la posibilidad de tomar más responsabilidades en Q4.`,
      acuerdos: `- Validar el objetivo formalmente esta semana.\n- Revisar junto a RRHH si hay posibilidad de ampliar su scope para Q4.`,
      objetivo_id: objetivo1?.id ?? null,
    },

    // === Empleado 2 ===
    {
      empresa_id:    empresa.id,
      supervisor_id: supervisor.id,
      empleado_id:   emp2.id,
      fecha: hace(30),
      agenda:   'Revisión del período. Cómo se siente con la carga de trabajo.',
      notas:    `${emp2.nombre} expresó que la carga de trabajo está siendo alta desde el cambio de estructura. Siente que le cuesta llegar a los objetivos porque tiene muchas tareas operativas que no estaban previstas. No es una queja, lo plantea con apertura.`,
      acuerdos: `- Mapear juntos cuáles tareas operativas se le asignaron de más y si pueden redistribuirse.\n- ${emp2.nombre} hace un listado esta semana de todo lo que está haciendo.`,
      objetivo_id: objetivo2?.id ?? null,
    },
    {
      empresa_id:    empresa.id,
      supervisor_id: supervisor.id,
      empleado_id:   emp2.id,
      fecha: hace(7),
      agenda:   'Seguimiento de carga operativa. Ajuste de expectativas.',
      notas:    `Revisamos el listado. Efectivamente hay tareas que no deberían estar en su scope. Se acordó con el área redistribuir 2 tareas. ${emp2.nombre} se mostró aliviado y con más claridad para el mes que viene. También habló de que le gustaría desarrollarse más en análisis de datos.`,
      acuerdos: `- Las 2 tareas operativas pasan a otra persona desde el lunes.\n- Explorar si puede participar en el proyecto de BI del Q4 como experiencia de desarrollo.`,
      objetivo_id: objetivo2?.id ?? null,
    },
  ]

  const { data, error } = await supabase.from('reuniones_1on1').insert(reuniones).select()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`\n✅ Se insertaron ${data.length} reuniones de ejemplo:`)
  console.log(`   📁 ${emp1.nombre} ${emp1.apellido}: 3 reuniones`)
  if (personas[2]) console.log(`   📁 ${emp2.nombre} ${emp2.apellido}: 2 reuniones`)
  console.log('\n🚀 Listo. Entrá a /reuniones para verlo.')
}

main().catch(console.error)
