import { createClient } from '@/lib/supabase-server'
import MetricCard from '@/components/ui/MetricCard'
import { calcularIndiceTraza, getEstadoClasses, getValidacionStyle, formatFecha } from '@/lib/traza'
import { AlertTriangle, Clock, MessageSquare, Link2, Paperclip, CheckCircle2, TrendingUp } from 'lucide-react'
import type { Objetivo } from '@/types'
import Link from 'next/link'

function diasRestantes(fecha: string) {
  const hoy  = new Date(); hoy.setHours(0,0,0,0)
  const fin  = new Date(fecha); fin.setHours(0,0,0,0)
  return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  if (!profile) return null

  const esAdmin = ['admin', 'super_admin', 'supervisor'].includes(profile.rol)

  /* ── ADMIN / SUPERVISOR ── */
  if (esAdmin) {
    const { count: totalPersonas } = await supabase
      .from('personas').select('*', { count: 'exact', head: true })

    const { data: objetivos } = await supabase.from('objetivos').select('*')
    const objs        = (objetivos ?? []) as Objetivo[]
    const totalObjs   = objs.length
    const completados = objs.filter(o => o.estado === 'Completado').length
    const cumplimiento = totalObjs > 0 ? Math.round(completados / totalObjs * 100) : 0
    const pendValidar  = objs.filter(o => o.estado === 'Completado' && !o.validacion).length

    const { data: recientes } = await supabase
      .from('objetivos')
      .select('*, persona:personas(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(6)

    // Avances recientes del equipo
    const { data: avancesEquipo } = await supabase
      .from('objetivo_avances')
      .select('*, objetivo:objetivos(id, titulo, estado, validacion), persona:personas(nombre, apellido)')
      .order('creado_en', { ascending: false })
      .limit(8)

    // Cierres semanales de esta semana
    const lunes = (() => {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      return d.toISOString().split('T')[0]
    })()
    const { data: cierres } = await supabase
      .from('cierres_semanales')
      .select('*, persona:personas(nombre, apellido)')
      .eq('semana', lunes)
      .order('creado_en', { ascending: false })

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buen día, {profile.nombre}</h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon="Users"       label="Colaboradores"   value={totalPersonas ?? 0} />
          <MetricCard icon="Target"      label="Objetivos activos" value={totalObjs - completados} />
          <MetricCard icon="CheckSquare" label="Completados"     value={completados} />
          <MetricCard icon="TrendingUp"  label="Cumplimiento"    value={`${cumplimiento}%`} highlight />
        </div>

        {pendValidar > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" strokeWidth={1.75} />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{pendValidar} objetivo{pendValidar > 1 ? 's' : ''}</span> completado{pendValidar > 1 ? 's' : ''} esperan tu validación.
              {' '}<Link href="/validacion" className="underline font-medium">Ir a Validación →</Link>
            </p>
          </div>
        )}

        {/* Cierres semanales del equipo */}
        {cierres && cierres.length > 0 && (
          <div className="traza-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Cierres semanales</h2>
              <p className="text-xs text-gray-400 mt-0.5">{cierres.length} colaborador{cierres.length > 1 ? 'es' : ''} completaron el cierre de esta semana</p>
            </div>
            <div className="divide-y divide-gray-50">
              {(cierres as any[]).map((c: any) => (
                <div key={c.id} className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">{c.persona?.nombre} {c.persona?.apellido}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {c.que_avance && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Avanzó</p>
                        <p className="text-sm text-gray-700">{c.que_avance}</p>
                      </div>
                    )}
                    {c.que_obstaculos && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Obstáculos</p>
                        <p className="text-sm text-gray-700">{c.que_obstaculos}</p>
                      </div>
                    )}
                    {c.que_necesito && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Necesita</p>
                        <p className="text-sm text-gray-700">{c.que_necesito}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed unificado de actividad */}
        <div className="traza-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Actividad del equipo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Avances registrados por colaboradores, del más reciente al más antiguo</p>
          </div>
          {avancesEquipo && avancesEquipo.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {avancesEquipo.map((a: any) => (
                <div key={a.id} className="px-6 py-4 flex gap-3">
                  {/* Ícono tipo */}
                  <div className="flex-shrink-0 mt-1">
                    {a.tipo === 'comentario' && <MessageSquare size={15} className="text-gray-400" strokeWidth={1.75} />}
                    {a.tipo === 'link'       && <Link2 size={15} className="text-traza-500" strokeWidth={1.75} />}
                    {a.tipo === 'archivo'    && <Paperclip size={15} className="text-orange-400" strokeWidth={1.75} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Quién + cuándo */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {a.persona?.nombre} {a.persona?.apellido}
                      </p>
                      <span className="text-gray-300">·</span>
                      <p className="text-xs text-gray-400">
                        {new Date(a.creado_en).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Objetivo al que pertenece */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-gray-400">en</span>
                      <Link
                        href={`/objetivos?objetivo=${a.objetivo?.id}`}
                        className="text-xs font-medium text-traza-700 hover:underline truncate"
                      >
                        {a.objetivo?.titulo}
                      </Link>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoClasses(a.objetivo?.estado)}`}>
                        {a.objetivo?.estado}
                      </span>
                    </div>

                    {/* Contenido del avance */}
                    {a.tipo === 'comentario' ? (
                      <p className="text-sm text-gray-600">{a.contenido}</p>
                    ) : (
                      <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-traza-700 hover:underline break-all">{a.contenido}</a>
                    )}

                    {/* Botón validar si el objetivo está completado y sin validar */}
                    {a.objetivo?.estado === 'Completado' && !a.objetivo?.validacion && (
                      <Link
                        href="/validacion"
                        className="inline-flex items-center mt-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Pendiente de validación →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm px-6 py-8">El equipo aún no registró avances.</p>
          )}
        </div>
      </div>
    )
  }

  /* ── EMPLEADO ── */
  const { data: persona } = await supabase
    .from('personas').select('id').eq('user_id', user!.id).single()

  const { data: misObjetivos } = await supabase
    .from('objetivos').select('*').eq('persona_id', persona?.id ?? '')

  const objs = (misObjetivos ?? []) as Objetivo[]
  const indice = calcularIndiceTraza(objs)

  // Próximos vencimientos (próximos 14 días, no completados)
  const hoy14 = new Date(); hoy14.setDate(hoy14.getDate() + 14)
  const proximos = objs
    .filter(o => o.estado !== 'Completado' && o.fecha_limite)
    .filter(o => new Date(o.fecha_limite!) <= hoy14)
    .sort((a, b) => new Date(a.fecha_limite!).getTime() - new Date(b.fecha_limite!).getTime())

  // Feedback del supervisor (objetivos con validación)
  const conFeedback = objs
    .filter(o => o.validacion)
    .sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
    .slice(0, 3)

  // Avances recientes propios
  const { data: misAvances } = await supabase
    .from('objetivo_avances')
    .select('*, objetivo:objetivos(titulo)')
    .eq('persona_id', persona?.id ?? '')
    .order('creado_en', { ascending: false })
    .limit(4)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buen día, {profile.nombre}</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="Target"      label="Mis objetivos"  value={indice.total} />
        <MetricCard icon="CheckSquare" label="Completados"    value={indice.completados} />
        <MetricCard icon="TrendingUp"  label="Cumplimiento"   value={`${indice.cumplimiento}%`} />
        <MetricCard icon="Trophy"      label="Índice Traza"   value={`${indice.score}/100`} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximos vencimientos */}
        <div className="traza-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} strokeWidth={1.75} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Próximos vencimientos</h2>
          </div>
          {proximos.length === 0 ? (
            <p className="text-sm text-gray-400">No tenés objetivos por vencer en los próximos 14 días.</p>
          ) : (
            <div className="space-y-3">
              {proximos.map(obj => {
                const dias = diasRestantes(obj.fecha_limite!)
                const urgente = dias <= 3
                const medio   = dias <= 7
                return (
                  <div key={obj.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {urgente && <AlertTriangle size={11} className="text-red-500" />}
                        <p className={`text-xs font-medium ${urgente ? 'text-red-500' : medio ? 'text-amber-500' : 'text-gray-400'}`}>
                          {dias === 0 ? 'Vence hoy' : dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${dias} día${dias > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <span className={`ml-3 flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>
                      {obj.estado}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Feedback del supervisor */}
        <div className="traza-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} strokeWidth={1.75} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Feedback del supervisor</h2>
          </div>
          {conFeedback.length === 0 ? (
            <p className="text-sm text-gray-400">Todavía no recibiste feedback de tus objetivos.</p>
          ) : (
            <div className="space-y-3">
              {conFeedback.map(obj => (
                <div key={obj.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">{obj.titulo}</p>
                    <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium" style={getValidacionStyle(obj.validacion ?? null)}>
                      {obj.validacion}
                    </span>
                  </div>
                  {obj.comentario_supervisor && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{obj.comentario_supervisor}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mis avances recientes */}
      {misAvances && misAvances.length > 0 && (
        <div className="traza-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Mis avances recientes</h2>
          <div className="space-y-3">
            {misAvances.map((a: any) => (
              <div key={a.id} className="flex gap-2.5 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-shrink-0 mt-0.5">
                  {a.tipo === 'comentario' && <MessageSquare size={14} className="text-gray-400" />}
                  {a.tipo === 'link'       && <Link2 size={14} className="text-traza-500" />}
                  {a.tipo === 'archivo'    && <Paperclip size={14} className="text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{a.objetivo?.titulo}</p>
                  {a.tipo === 'comentario' ? (
                    <p className="text-sm text-gray-700">{a.contenido}</p>
                  ) : (
                    <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-traza-700 hover:underline break-all">{a.contenido}</a>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(a.creado_en).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
