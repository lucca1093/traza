import { createAdminClient } from '@/lib/supabase-server'
import ValidarForm from './ValidarForm'
import { ShieldCheck, FileText, Link2, Paperclip, Clock, MessageSquare, Calendar, Tag, BarChart2, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatFecha(dt: string, short = false) {
  return new Date(dt).toLocaleDateString('es-AR', short
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'long', year: 'numeric' }
  )
}

function formatHora(dt: string) {
  return new Date(dt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function Iniciales({ nombre, apellido }: { nombre: string; apellido: string }) {
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
      style={{ background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)' }}>
      {nombre[0]}{apellido[0]}
    </div>
  )
}

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  Resultado:    { bg: '#EDEFFD', text: '#3350D0', label: 'Resultado' },
  Eficiencia:   { bg: '#dcfce7', text: '#15803d', label: 'Eficiencia' },
  Aprendizaje:  { bg: '#fef9c3', text: '#a16207', label: 'Aprendizaje' },
  Hábito:       { bg: '#f3e8ff', text: '#7e22ce', label: 'Hábito' },
}

const PRIORIDAD_COLORS: Record<string, { bg: string; text: string }> = {
  Alta:  { bg: '#fee2e2', text: '#b91c1c' },
  Media: { bg: '#fef9c3', text: '#a16207' },
  Baja:  { bg: '#f0fdf4', text: '#15803d' },
}

export default async function ValidarTokenPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: tokenData } = await admin
    .from('tokens_validacion')
    .select(`
      *,
      objetivo:objetivos(
        id, titulo, descripcion, categoria, estado, prioridad, tipo,
        fecha_limite, es_continuo, progreso,
        persona:personas(nombre, apellido, cargo, area, empresa:empresas(nombre, rubro))
      )
    `)
    .eq('token', params.token)
    .single()

  if (!tokenData) return <PaginaError mensaje="Este link de validación no existe." />
  if (tokenData.usado)  return <PaginaError mensaje="Este link ya fue utilizado. Cada link de validación es de un solo uso." />
  if (new Date(tokenData.expira_en) < new Date()) {
    return <PaginaError mensaje="Este link expiró. Pedile al profesional que genere uno nuevo." />
  }

  const objetivo = (tokenData as any).objetivo
  const persona  = objetivo?.persona
  const empresa  = persona?.empresa?.nombre ?? null
  const rubro    = persona?.empresa?.rubro   ?? null

  // Avances — usamos objetivo_id directo del token (más confiable que del join)
  const objetivoId = (tokenData as any).objetivo_id ?? objetivo?.id
  const { data: avances, error: avancesError } = await admin
    .from('objetivo_avances')
    .select('*')
    .eq('objetivo_id', objetivoId)
    .order('creado_en', { ascending: true })

  console.log('[validar] objetivoId:', objetivoId, 'avances:', avances?.length, 'error:', avancesError?.message)

  const diasRestantes = Math.max(0, Math.round(
    (new Date(tokenData.expira_en).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  const catStyle  = CATEGORIA_COLORS[objetivo?.categoria] ?? { bg: '#f3f4f6', text: '#374151', label: objetivo?.categoria }
  const priStyle  = PRIORIDAD_COLORS[objetivo?.prioridad] ?? { bg: '#f3f4f6', text: '#374151' }

  const comentarios = avances?.filter((a: any) => a.tipo === 'comentario') ?? []
  const evidencias  = avances?.filter((a: any) => a.tipo === 'link' || a.tipo === 'archivo') ?? []
  const totalAvances = avances?.length ?? 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'rgba(10,22,40,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-2xl mx-auto px-5 flex items-center gap-3 py-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3350D0' }}>
            <span className="text-white text-xs font-black">T</span>
          </div>
          <span className="text-white font-black tracking-tight text-sm">traza</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
            Validación profesional
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-xs"
            style={{ color: diasRestantes <= 1 ? '#fca5a5' : 'rgba(255,255,255,0.35)' }}>
            <Clock size={10} />
            {diasRestantes === 0 ? 'Vence hoy' : `Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* ── Card 1: Quién pide la validación ── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={13} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Solicitud de validación</span>
            </div>
            <div className="flex items-start gap-3">
              <Iniciales nombre={persona?.nombre ?? 'U'} apellido={persona?.apellido ?? 'U'} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-base leading-tight">
                  {persona?.nombre} {persona?.apellido}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {persona?.cargo ?? 'Profesional'}
                  {persona?.area ? ` · ${persona.area}` : ''}
                  {empresa ? ` · ${empresa}` : ''}
                </p>
                {rubro && (
                  <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{rubro}</span>
                )}
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 border-t border-gray-50 pt-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Te está pidiendo que valides el cumplimiento de uno de sus objetivos de trabajo.
              Tu evaluación quedará registrada en su credencial TRAZA con tu nombre y cargo.
            </p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <ShieldCheck size={11} />
              No necesitás tener cuenta en TRAZA para validar.
            </p>
          </div>
        </div>

        {/* ── Card 2: El objetivo ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText size={11} />
              Objetivo a validar
            </p>

            <h2 className="text-lg font-black text-gray-900 leading-tight mb-2">
              {objetivo?.titulo}
            </h2>

            {objetivo?.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {objetivo.descripcion}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {objetivo?.categoria && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
                  {catStyle.label}
                </span>
              )}
              {objetivo?.prioridad && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: priStyle.bg, color: priStyle.text }}>
                  Prioridad {objetivo.prioridad.toLowerCase()}
                </span>
              )}
              {objetivo?.estado && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                  {objetivo.estado}
                </span>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="px-5 pb-4 border-t border-gray-50 pt-3 flex flex-wrap gap-4">
            {objetivo?.fecha_limite && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={11} className="text-gray-400" />
                Fecha límite: <span className="font-medium text-gray-700">{formatFecha(objetivo.fecha_limite)}</span>
              </div>
            )}
            {objetivo?.es_continuo && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Tag size={11} className="text-gray-400" />
                Objetivo continuo
              </div>
            )}
            {totalAvances > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <BarChart2 size={11} className="text-gray-400" />
                {totalAvances} registro{totalAvances !== 1 ? 's' : ''} de avance
              </div>
            )}
          </div>
        </div>

        {/* ── Card 3: Evidencias y timeline ── */}
        {avances && avances.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={11} />
                Historial de avances y evidencias
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Todo lo registrado por {persona?.nombre} para este objetivo.
              </p>
            </div>

            <div className="px-5 pb-5">
              <div className="relative">
                {/* línea vertical */}
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-100" />

                <div className="space-y-1">
                  {avances.map((a: any, idx: number) => (
                    <div key={a.id} className="relative pl-10">
                      {/* dot */}
                      <div className="absolute left-2 top-3 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center"
                        style={{
                          backgroundColor:
                            a.tipo === 'link'      ? '#3b82f6' :
                            a.tipo === 'archivo'   ? '#8b5cf6' : '#9ca3af'
                        }}>
                      </div>

                      <div className="pt-1.5 pb-4">
                        {/* Header de la entrada */}
                        <div className="flex items-center gap-2 mb-1">
                          {a.tipo === 'comentario' && <MessageSquare size={11} className="text-gray-400" />}
                          {a.tipo === 'link'       && <Link2 size={11} className="text-blue-500" />}
                          {a.tipo === 'archivo'    && <Paperclip size={11} className="text-purple-500" />}
                          <span className="text-xs text-gray-400">
                            {a.tipo === 'comentario' ? 'Comentario' : a.tipo === 'link' ? 'Enlace' : 'Archivo'}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {formatFecha(a.creado_en, true)} {formatHora(a.creado_en)}
                          </span>
                          {a.estado_revision === 'aprobado' && (
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">✓ Aprobado</span>
                          )}
                        </div>

                        {/* Contenido */}
                        {a.tipo === 'link' ? (
                          <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline break-all">
                            <Link2 size={12} />
                            {a.contenido}
                          </a>
                        ) : a.tipo === 'archivo' ? (
                          <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-xl">
                            <Paperclip size={12} />
                            <span className="break-all">{a.contenido}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 px-3 py-2.5 rounded-xl">
                            {a.contenido}
                          </p>
                        )}

                        {/* Respuesta del referente directo */}
                        {a.respuesta_supervisor && (
                          <div className="mt-2 ml-2 pl-3 border-l-2 border-blue-200">
                            <p className="text-xs font-semibold text-blue-600 mb-0.5">Respuesta del referente directo</p>
                            <p className="text-sm text-gray-600 italic leading-relaxed">
                              "{a.respuesta_supervisor}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sin avances */}
        {(!avances || avances.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Sin avances registrados</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {persona?.nombre} no cargó avances todavía. Podés igualmente validar el objetivo basándote en lo que conocés de su trabajo.
              </p>
              {avancesError && (
                <p className="text-xs text-red-600 mt-1 font-mono">[debug] {avancesError.message} · id: {objetivoId}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Formulario ── */}
        <ValidarForm token={params.token} objetivoTitulo={objetivo?.titulo ?? ''} personaNombre={`${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim()} />

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-6 leading-relaxed">
          Este link es de uso único y vence el {formatFecha(tokenData.expira_en)}.<br />
          Tu identidad quedará visible en la credencial pública del profesional.
        </p>
      </div>
    </div>
  )
}

function PaginaError({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-gray-100">
          <ShieldCheck size={24} className="text-gray-300" />
        </div>
        <p className="font-bold text-gray-700 mb-2">Link no disponible</p>
        <p className="text-sm text-gray-400 leading-relaxed">{mensaje}</p>
        <p className="text-xs text-gray-300 mt-8 font-mono">traza · Performance Intelligence</p>
      </div>
    </div>
  )
}
