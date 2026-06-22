import { createClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, getValidacionStyle, formatFecha } from '@/lib/traza'
import { Trophy, CheckCircle2, Star } from 'lucide-react'
import type { Objetivo } from '@/types'

export default async function PerfilPublicoPage({ params }: { params: { trazaId: string } }) {
  const supabase = createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('traza_id', params.trazaId)
    .single()

  if (!persona) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-200 mb-2">404</p>
          <p className="text-gray-500">Perfil TRAZA no encontrado.</p>
        </div>
      </div>
    )
  }

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('*')
    .eq('persona_id', persona.id)
    .order('fecha_limite', { ascending: false })

  const objs = (objetivos ?? []) as Objetivo[]
  const completados = objs.filter(o => o.estado === 'Completado')
  const validados   = completados.filter(o => o.validacion)
  const indice      = calcularIndiceTraza(objs)

  const autoEvalLabel = (v: string | null) => {
    if (v === 'Satisfecho') return { label: 'Satisfecho', color: '#16a34a', bg: '#dcfce7' }
    if (v === 'Parcialmente satisfecho') return { label: 'Parcial', color: '#d97706', bg: '#fef3c7' }
    if (v === 'Insatisfecho') return { label: 'Insatisfecho', color: '#dc2626', bg: '#fee2e2' }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#0F4C81' }} className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-white font-bold text-xl">TRAZA</span>
            <span className="text-blue-300 text-sm">· Perfil verificado</span>
          </div>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {persona.nombre[0]}{persona.apellido[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{persona.nombre} {persona.apellido}</h1>
              <p className="text-blue-200 mt-0.5">{persona.cargo ?? ''}{persona.area ? ` · ${persona.area}` : ''}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-mono bg-white/10 text-blue-200 px-2.5 py-1 rounded-lg tracking-widest">
                  {persona.traza_id}
                </span>
                <span className="text-xs text-blue-300">ID verificado</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-5xl font-bold text-white">{indice.score}</p>
              <p className="text-blue-300 text-sm">/100 Índice Traza</p>
              <p className="text-blue-200 text-xs mt-1">{indice.badge}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{objs.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">Objetivos totales</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{completados.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">Completados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: '#0F4C81' }}>{indice.cumplimiento}%</p>
            <p className="text-sm text-gray-500 mt-0.5">Cumplimiento</p>
          </div>
        </div>

        {/* Objetivos validados */}
        {validados.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900">Objetivos completados y validados</h2>
              <span className="ml-auto text-xs text-gray-400">{validados.length} objetivos</span>
            </div>
            <div className="divide-y divide-gray-50">
              {validados.map(obj => {
                const ae = autoEvalLabel((obj as any).autoevaluacion)
                return (
                  <div key={obj.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{obj.titulo}</p>
                        {obj.descripcion && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{obj.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatFecha(obj.fecha_limite)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={getValidacionStyle(obj.validacion)}>
                          {obj.validacion}
                        </span>
                        {ae && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                            style={{ backgroundColor: ae.bg, color: ae.color }}>
                            <Star size={10} />
                            {ae.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {obj.comentario_supervisor && (
                      <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                        "{obj.comentario_supervisor}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Este perfil fue generado por{' '}
            <span className="font-semibold text-gray-600">TRAZA</span>
            {' '}— plataforma de gestión de desempeño verificado.
          </p>
        </div>
      </div>
    </div>
  )
}
