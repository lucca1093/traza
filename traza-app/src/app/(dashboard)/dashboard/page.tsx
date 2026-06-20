import { createClient } from '@/lib/supabase-server'
import MetricCard from '@/components/ui/MetricCard'
import { calcularIndiceTraza, getEstadoClasses, formatFecha } from '@/lib/traza'
import type { Objetivo } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  if (!profile) return null

  // Métricas generales de la empresa
  const { count: totalPersonas } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('*')

  const objs = (objetivos ?? []) as Objetivo[]
  const totalObjetivos   = objs.length
  const completados      = objs.filter(o => o.estado === 'Completado').length
  const cumplimiento     = totalObjetivos > 0 ? Math.round(completados / totalObjetivos * 100) : 0

  // Últimos objetivos (recientes)
  const { data: recientes } = await supabase
    .from('objetivos')
    .select('*, persona:personas(nombre, apellido)')
    .order('created_at', { ascending: false })
    .limit(5)

  const esAdmin = ['admin', 'super_admin', 'supervisor'].includes(profile.rol)

  // Si es empleado, calcular su propio índice
  let indicePersonal = null
  if (profile.rol === 'empleado') {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (persona) {
      const { data: misObjetivos } = await supabase
        .from('objetivos')
        .select('*')
        .eq('persona_id', persona.id)
      indicePersonal = calcularIndiceTraza((misObjetivos ?? []) as Objetivo[])
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Buen día, {profile.nombre} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Métricas */}
      {esAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon="👥" label="Colaboradores" value={totalPersonas ?? 0} />
          <MetricCard icon="🎯" label="Objetivos totales" value={totalObjetivos} />
          <MetricCard icon="✅" label="Completados" value={completados} />
          <MetricCard icon="📈" label="Cumplimiento" value={`${cumplimiento}%`} highlight />
        </div>
      ) : indicePersonal ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon="🎯" label="Mis objetivos" value={indicePersonal.total} />
          <MetricCard icon="✅" label="Completados" value={indicePersonal.completados} />
          <MetricCard icon="📈" label="Cumplimiento" value={`${indicePersonal.cumplimiento}%`} />
          <MetricCard icon="🏆" label="Índice Traza" value={`${indicePersonal.score}/100`} highlight />
        </div>
      ) : null}

      {/* Últimos objetivos */}
      {esAdmin && recientes && recientes.length > 0 && (
        <div className="traza-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Actividad reciente</h2>
          <div className="space-y-3">
            {recientes.map((obj: any) => (
              <div key={obj.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {obj.persona ? `${obj.persona.nombre} ${obj.persona.apellido}` : '—'}
                    {obj.fecha_limite && ` · Vence ${formatFecha(obj.fecha_limite)}`}
                  </p>
                </div>
                <span className={`ml-3 text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>
                  {obj.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick tips para empleados */}
      {profile.rol === 'empleado' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🎯', title: 'Mi Trabajo', desc: 'Actualizá tus objetivos y cargá evidencias.' },
            { icon: '📋', title: 'Perfil', desc: 'Revisá tu historial profesional.' },
            { icon: '🏆', title: 'Talent Card', desc: 'Tu credencial de desempeño.' },
          ].map(item => (
            <div key={item.title} className="traza-card p-5">
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
