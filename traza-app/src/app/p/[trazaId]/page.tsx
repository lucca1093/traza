import { createClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, generarPerfilNarrativo } from '@/lib/traza'
import { ShieldCheck, TrendingUp, Star } from 'lucide-react'
import type { Objetivo } from '@/types'

export default async function CredencialTrazaPage({ params }: { params: { trazaId: string } }) {
  const supabase = createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*, empresa:empresas(nombre)')
    .eq('traza_id', params.trazaId)
    .single()

  if (!persona) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-200 mb-3">404</p>
          <p className="text-gray-500 text-sm">Credencial TRAZA no encontrada.</p>
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
  const indice = calcularIndiceTraza(objs)
  const { score, badge, cumplimiento, total, completados, positivos, parciales, negativos } = indice

  const empresaNombre = (persona as any).empresa?.nombre ?? null

  const narrativa = generarPerfilNarrativo({
    nombre: persona.nombre,
    apellido: persona.apellido,
    cargo: persona.cargo,
    area: persona.area,
    empresa: empresaNombre,
    objetivos: objs,
  })

  const scoreColor = score >= 85 ? '#16a34a' : score >= 65 ? '#0F4C81' : score >= 40 ? '#d97706' : '#9ca3af'
  const validados = objs.filter(o => !!o.validacion)
  const totalValidados = validados.length

  const ahora = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#0F4C81' }} className="px-6 py-10">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg tracking-tight">TRAZA</span>
              <span className="text-blue-300 text-xs">· Credencial verificada</span>
            </div>
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver a TRAZA
            </a>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <span className="text-white text-2xl font-bold">
                {persona.nombre[0]}{persona.apellido[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">
                {persona.nombre} {persona.apellido}
              </h1>
              <p className="text-blue-200 mt-1 text-sm">
                {persona.cargo ?? ''}
                {persona.area ? ` · ${persona.area}` : ''}
              </p>
              {empresaNombre && (
                <p className="text-blue-300 text-xs mt-1">{empresaNombre}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <ShieldCheck size={13} className="text-blue-300" />
                <span className="text-xs font-mono text-blue-200 tracking-widest">
                  {persona.traza_id}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="inline-flex flex-col items-center rounded-2xl px-5 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-blue-200 text-xs">/100</span>
                <span className="text-blue-100 text-xs font-medium mt-1">{badge}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* Narrativa */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
            <h2 className="font-semibold text-gray-900 text-sm">Perfil profesional</h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">{narrativa}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold" style={{ color: scoreColor }}>{score}</p>
            <p className="text-xs text-gray-400 mt-1">Índice Traza</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{cumplimiento}%</p>
            <p className="text-xs text-gray-400 mt-1">Cumplimiento</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">{completados}</p>
            <p className="text-xs text-gray-400 mt-1">Completados</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400 mt-1">Objetivos totales</p>
          </div>
        </div>

        {/* Distribución de validaciones */}
        {totalValidados > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} style={{ color: '#0F4C81' }} strokeWidth={1.75} />
              <h2 className="font-semibold text-gray-900 text-sm">Validaciones del supervisor</h2>
              <span className="ml-auto text-xs text-gray-400">{totalValidados} validado{totalValidados > 1 ? 's' : ''}</span>
            </div>

            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
              {positivos > 0 && (
                <div style={{ width: `${(positivos / totalValidados) * 100}%`, backgroundColor: '#1d4ed8', borderRadius: '9999px' }} />
              )}
              {parciales > 0 && (
                <div style={{ width: `${(parciales / totalValidados) * 100}%`, backgroundColor: '#6d28d9' }} />
              )}
              {negativos > 0 && (
                <div style={{ width: `${(negativos / totalValidados) * 100}%`, backgroundColor: '#c2410c', borderRadius: '9999px' }} />
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {positivos > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#1d4ed8' }} />
                  <span className="text-xs text-gray-600">De acuerdo <span className="font-semibold">{positivos}</span></span>
                </div>
              )}
              {parciales > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#6d28d9' }} />
                  <span className="text-xs text-gray-600">Parcialmente <span className="font-semibold">{parciales}</span></span>
                </div>
              )}
              {negativos > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#c2410c' }} />
                  <span className="text-xs text-gray-600">En desacuerdo <span className="font-semibold">{negativos}</span></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-gray-300" />
            <p className="text-xs text-gray-400">
              Credencial verificada por <span className="font-semibold text-gray-500">TRAZA</span>
            </p>
          </div>
          <p className="text-xs text-gray-300">Actualizada el {ahora}</p>
        </div>

      </div>
    </div>
  )
}
