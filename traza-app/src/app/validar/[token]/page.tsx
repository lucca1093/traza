import { createAdminClient } from '@/lib/supabase-server'
import ValidarForm from './ValidarForm'
import { ShieldCheck, FileText, Link2, Paperclip, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatFecha(dt: string) {
  return new Date(dt).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default async function ValidarTokenPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  // Buscar el token con el objetivo y la persona
  const { data: tokenData } = await admin
    .from('tokens_validacion')
    .select(`
      *,
      objetivo:objetivos(
        id, titulo, descripcion, categoria, estado, fecha_limite,
        persona:personas(nombre, apellido, cargo, area, empresa:empresas(nombre))
      )
    `)
    .eq('token', params.token)
    .single()

  // Token inválido
  if (!tokenData) {
    return <PaginaError mensaje="Este link de validación no existe." />
  }

  // Token ya usado
  if (tokenData.usado) {
    return <PaginaError mensaje="Este link ya fue utilizado. Cada link de validación es de un solo uso." />
  }

  // Token expirado
  if (new Date(tokenData.expira_en) < new Date()) {
    return <PaginaError mensaje="Este link expiró. Pedile al profesional que genere uno nuevo." />
  }

  const objetivo = (tokenData as any).objetivo
  const persona  = objetivo?.persona
  const empresa  = persona?.empresa?.nombre ?? null

  // Avances del objetivo (evidencias)
  const { data: avances } = await admin
    .from('objetivo_avances')
    .select('*')
    .eq('objetivo_id', objetivo.id)
    .order('creado_en', { ascending: true })

  const diasRestantes = Math.max(0, Math.round(
    (new Date(tokenData.expira_en).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'rgba(10,22,40,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-2xl mx-auto px-5 h-13 flex items-center gap-3 py-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F4C81' }}>
            <span className="text-white text-xs font-black">T</span>
          </div>
          <span className="text-white font-black tracking-tight text-sm">TRAZA</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
            Solicitud de validación
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Clock size={10} />
            Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Introducción */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Solicitud de validación profesional</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>{persona?.nombre} {persona?.apellido}</strong>
            {persona?.cargo ? `, ${persona.cargo}` : ''}
            {empresa ? ` en ${empresa}` : ''}, te está pidiendo que valides uno de sus objetivos de trabajo.
          </p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Tu evaluación quedará registrada en su credencial TRAZA con tu nombre y cargo. No necesitás tener cuenta — tu identidad y rol son suficientes.
          </p>
        </div>

        {/* Objetivo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-start gap-3 mb-4">
            <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Objetivo a validar</p>
              <p className="font-semibold text-gray-900">{objetivo?.titulo}</p>
              {objetivo?.descripcion && (
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{objetivo.descripcion}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {objetivo?.categoria && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{objetivo.categoria}</span>
                )}
                {objetivo?.fecha_limite && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    Fecha límite: {formatFecha(objetivo.fecha_limite)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Evidencias */}
          {avances && avances.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Evidencias cargadas ({avances.length})
              </p>
              <div className="space-y-2">
                {avances.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2.5 text-sm">
                    {a.tipo === 'link'
                      ? <Link2 size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      : a.tipo === 'archivo'
                        ? <Paperclip size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        : <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      {a.tipo === 'link' && a.contenido ? (
                        <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate block">{a.contenido}</a>
                      ) : (
                        <p className="text-gray-700">{a.contenido}</p>
                      )}
                      {a.creado_en && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatFecha(a.creado_en)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulario de validación */}
        <ValidarForm token={params.token} objetivoTitulo={objetivo?.titulo ?? ''} />

      </div>
    </div>
  )
}

function PaginaError({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-gray-100">
          <ShieldCheck size={24} className="text-gray-300" />
        </div>
        <p className="font-bold text-gray-700 mb-2">Link no disponible</p>
        <p className="text-sm text-gray-400 leading-relaxed">{mensaje}</p>
        <p className="text-xs text-gray-300 mt-6 font-mono">TRAZA · Performance Intelligence</p>
      </div>
    </div>
  )
}
