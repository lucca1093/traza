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

function addDias(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

// Fechas distribuidas esta semana y la próxima
const FECHAS = [
  addDias(1),   // mañana
  addDias(2),
  addDias(3),
  addDias(4),
  addDias(5),
  addDias(7),   // próxima semana
  addDias(8),
  addDias(9),
  addDias(10),
  addDias(11),
  addDias(12),
  addDias(14),
]

async function main() {
  // Buscar Grupo Meridian
  const { data: empresas } = await supabase
    .from('empresas').select('id, nombre').ilike('nombre', '%meridian%')
  if (!empresas?.length) { console.error('❌ No se encontró Grupo Meridian.'); return }
  const empresa = empresas[0]
  console.log(`🏢 Empresa: ${empresa.nombre}`)

  const { data: objetivos, error } = await supabase
    .from('objetivos')
    .select('id, titulo, fecha_limite, estado')
    .eq('empresa_id', empresa.id)
    .not('fecha_limite', 'is', null)
    .neq('estado', 'Completado')
    .order('created_at')

  if (error) { console.error('❌', error.message); return }
  if (!objetivos?.length) { console.log('No hay objetivos con fecha.'); return }

  console.log(`📋 ${objetivos.length} objetivos encontrados. Actualizando fechas...\n`)

  for (let i = 0; i < objetivos.length; i++) {
    const nueva = FECHAS[i % FECHAS.length]
    const { error: err } = await supabase
      .from('objetivos')
      .update({ fecha_limite: nueva })
      .eq('id', objetivos[i].id)

    if (err) {
      console.log(`❌ ${objetivos[i].titulo} → ${err.message}`)
    } else {
      console.log(`✅ ${objetivos[i].titulo} → ${nueva}`)
    }
  }

  console.log('\n🚀 Listo.')
}

main().catch(console.error)
