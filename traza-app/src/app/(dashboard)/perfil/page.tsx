'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TraceIndexBar from '@/components/ui/TraceIndexBar'
import { calcularIndiceTraza, getValidacionStyle, getEstadoClasses, formatFecha } from '@/lib/traza'
import { CheckCircle2, Award, MessageSquare, ChevronDown, ChevronRight, Link2, Paperclip, Eye, EyeOff, Globe, Lock, Info, X, ExternalLink, Building2, ShieldCheck, ShieldAlert, Send, Loader2, FileDown } from 'lucide-react'
import type { Objetivo, Persona, Profile } from '@/types'

export default function PerfilPage() {
  const [loading, setLoading]       = useState(true)
  const [personas, setPersonas]     = useState<Persona[]>([])
  const [selected, setSelected]     = useState<string>('')
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [narrativa, setNarrativa]   = useState<string>('')
  const [loadingIA, setLoadingIA]   = useState(false)
  const [disponible,       setDisponible]       = useState(false)
  const [savingDisp,       setSavingDisp]       = useState(false)
  const [credencialPublica, setCredencialPublica] = useState(true)
  const [savingCred,       setSavingCred]       = useState(false)
  const [showInfo, setShowInfo]     = useState(false)
  // Empresa actual (para independientes — feature 4.3)
  const [showEmpresaForm,   setShowEmpresaForm]   = useState(false)
  const [empNombre,         setEmpNombre]         = useState('')
  const [empDominio,        setEmpDominio]        = useState('')
  const [supNombre,         setSupNombre]         = useState('')
  const [supEmail,          setSupEmail]          = useState('')
  const [savingEmpresa,     setSavingEmpresa]     = useState(false)
  const [empresaGuardada,   setEmpresaGuardada]   = useState(false)
  const [onboardingMode,    setOnboardingMode]    = useState(false)
  const [data, setData]             = useState<{
    persona: Persona | null
    objetivos: Objetivo[]
    avances: any[]
    validacionesExternas: any[]
  }>({ persona: null, objetivos: [], avances: [], validacionesExternas: [] })

  useEffect(() => {
    // Detectar modo onboarding desde URL sin useSearchParams (evita Suspense)
    const params = new URLSearchParams(window.location.search)
    if (params.get('onboarding') === '1' || params.get('setup') === '1') setOnboardingMode(true)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      setProfile(p)

      // Independiente = no tiene profile en tabla profiles, o no tiene empresa_id
      const esIndependiente = !p || !p.empresa_id

      if (esIndependiente || p?.rol === 'empleado') {
        // Solo ve su propio perfil
        const { data: persona } = await supabase.from('personas').select('*').eq('user_id', user!.id).eq('empleo_activo', true).single()
        if (persona) {
          setSelected(persona.id)
          setDisponible((persona as any).disponible_para_busqueda ?? false)
          setCredencialPublica((persona as any).credencial_publica ?? true)
          await fetchPersonaData(persona.id)
        }
      } else {
        let psQuery = supabase.from('personas').select('*').eq('empleo_activo', true).order('apellido')
        if (p?.rol !== 'super_admin' && p?.empresa_id) {
          psQuery = psQuery.eq('empresa_id', p.empresa_id)
        }
        const { data: ps } = await psQuery
        setPersonas(ps ?? [])
        if (ps && ps.length > 0) {
          setSelected(ps[0].id)
          await fetchPersonaData(ps[0].id)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function fetchPersonaData(personaId: string) {
    const [{ data: persona }, { data: obs }] = await Promise.all([
      supabase.from('personas').select('*').eq('id', personaId).single(),
      supabase.from('objetivos').select('*').eq('persona_id', personaId).order('created_at', { ascending: false }),
    ])
    const objs = (obs ?? []) as Objetivo[]
    // Traer avances y validaciones externas para calcular índice correctamente
    let avances: any[] = []
    let validacionesExternas: any[] = []
    if (objs.length > 0) {
      const objIds = objs.map(o => o.id)
      const [{ data: av }, { data: valExt }] = await Promise.all([
        supabase.from('objetivo_avances').select('*').in('objetivo_id', objIds),
        supabase.from('validaciones_externas').select('*').in('objetivo_id', objIds).eq('confirmado', true),
      ])
      avances = av ?? []
      validacionesExternas = valExt ?? []
    }
    setData({ persona: persona ?? null, objetivos: objs, avances, validacionesExternas })
    // Precargar datos de empresa actual si existen
    if (persona) {
      if ((persona as any).empresa_actual_nombre) setEmpNombre((persona as any).empresa_actual_nombre)
      if ((persona as any).empresa_actual_dominio) setEmpDominio((persona as any).empresa_actual_dominio)
      if ((persona as any).supervisor_nombre) setSupNombre((persona as any).supervisor_nombre)
      if ((persona as any).supervisor_email) setSupEmail((persona as any).supervisor_email)
      // Auto-abrir formulario si viene del onboarding o setup y aún no declaró empresa
      const params = new URLSearchParams(window.location.search)
      if ((params.get('onboarding') === '1' || params.get('setup') === '1') && !(persona as any).empresa_actual_nombre) {
        setShowEmpresaForm(true)
        setTimeout(() => {
          document.getElementById('empresa-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 400)
      }
    }
  }

  async function handleSelect(personaId: string) {
    setSelected(personaId)
    setNarrativa('')
    await fetchPersonaData(personaId)
  }

  async function generarNarrativaIA() {
    if (!data.persona) return
    setLoadingIA(true)
    const indice = calcularIndiceTraza(data.objetivos, data.avances)
    try {
      const res = await fetch('/api/narrativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:      data.persona.nombre,
          apellido:    data.persona.apellido,
          cargo:       data.persona.cargo,
          area:        data.persona.area,
          score:       indice.score,
          moduloA:     indice.moduloA,
          moduloB:     indice.moduloB,
          moduloC:     indice.moduloC,
          autonomo:    indice.moduloC,
          cumplimiento: indice.cumplimiento,
          total:       indice.total,
          completados: indice.completados,
          positivos:   indice.positivos,
        }),
      })
      const json = await res.json()
      setNarrativa(json.narrativa ?? '')
    } catch {
      setNarrativa('No se pudo generar la narrativa.')
    }
    setLoadingIA(false)
  }

  async function toggleCredencialPublica() {
    if (!data.persona || savingCred) return
    setSavingCred(true)
    const nuevoVal = !credencialPublica
    await supabase.from('personas').update({ credencial_publica: nuevoVal }).eq('id', data.persona.id)
    setCredencialPublica(nuevoVal)
    // Si desactiva la credencial, también desactiva la visibilidad en empleadores
    if (!nuevoVal && disponible) {
      await supabase.from('personas').update({ disponible_para_busqueda: false }).eq('id', data.persona.id)
      setDisponible(false)
    }
    setSavingCred(false)
  }

  async function toggleDisponible() {
    if (!data.persona || savingDisp || !credencialPublica) return
    setSavingDisp(true)
    const nuevoVal = !disponible
    await supabase.from('personas').update({ disponible_para_busqueda: nuevoVal }).eq('id', data.persona.id)
    setDisponible(nuevoVal)
    setSavingDisp(false)
  }

  async function guardarEmpresa() {
    if (!data.persona || !empNombre.trim() || !supEmail.trim()) return
    setSavingEmpresa(true)
    try {
      const res = await fetch('/api/declarar-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id:       data.persona.id,
          empresa_nombre:   empNombre.trim(),
          empresa_dominio:  empDominio.trim() || null,
          supervisor_nombre: supNombre.trim() || null,
          supervisor_email: supEmail.trim(),
        }),
      })
      if (res.ok) {
        setEmpresaGuardada(true)
        setShowEmpresaForm(false)
        // Actualizar estado local para que el checklist del dashboard se actualice
        await fetchPersonaData(data.persona!.id)
      }
    } catch { /* silenciar */ }
    setSavingEmpresa(false)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  const { persona, objetivos } = data
  const supVerificado = (persona as any)?.supervisor_verificado ?? true
  const esInd = profile?.rol === 'individuo' || !profile?.empresa_id
  const indice = calcularIndiceTraza(data.objetivos, data.avances, data.validacionesExternas, supVerificado, esInd)

  const scoreColor = indice.score >= 85 ? '#16a34a' : indice.score >= 65 ? '#3350D0' : indice.score >= 40 ? '#d97706' : '#9ca3af'
  const scoreBg    = indice.score >= 85 ? '#dcfce7' : indice.score >= 65 ? '#EDEFFD' : indice.score >= 40 ? '#fef3c7' : '#F1F5F9'
  const ultimasFeedbacks = objetivos.filter(o => o.comentario_supervisor?.trim()).slice(0, 5)
  const logros = objetivos.filter(o => o.estado === 'Completado').slice(0, 5)

  // Usuario sin fila en personas (ej: cuenta creada antes de la migración)
  if (!persona) {
    return (
      <div className="space-y-8">
        <div className="traza-page-header">
          <div>
            <h1 className="traza-page-title">Perfil Profesional</h1>
            <p className="traza-page-sub">Historial de desempeño basado en objetivos y validaciones.</p>
          </div>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EDEFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#3350D0' }}>
              {(profile?.nombre?.[0] ?? '?')}{(profile?.apellido?.[0] ?? '')}
            </span>
          </div>
          <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 16, marginBottom: 8 }}>
            {profile?.nombre ?? ''} {profile?.apellido ?? ''}
          </p>
          <p style={{ color: '#64748B', fontSize: 14, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Tu perfil profesional se construye a medida que cargás objetivos. Empezá desde <strong>Mi Trabajo</strong>.
          </p>
          <a href="/mi-trabajo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1C2B90,#3350D0)', color: '#fff', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Ir a Mi Trabajo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div id="demo-perfil-header" className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Perfil Profesional</h1>
          <p className="traza-page-sub">Historial de desempeño basado en objetivos y validaciones.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón descargar informe */}
          <button
            onClick={() => window.open('/imprimir', '_blank')}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:opacity-80"
            style={{ borderColor: '#3350D0', color: '#3350D0', background: '#EDEFFD' }}
            title="Descargar informe profesional en PDF"
          >
            <FileDown size={15} />
            Descargar informe
          </button>

          {profile?.rol !== 'empleado' && personas.length > 0 && (
            <select
              className="traza-input w-auto"
              value={selected}
              onChange={e => handleSelect(e.target.value)}
            >
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {persona && (
        <>
          {/* Cabecera del perfil */}
          <div className="traza-card p-6">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-traza-100 flex items-center justify-center flex-shrink-0">
                <span className="text-traza-700 text-2xl font-bold">
                  {persona.nombre[0]}{persona.apellido[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{persona.nombre} {persona.apellido}</h2>
                <p className="text-gray-600 mt-0.5">{persona.cargo ?? '—'}</p>
                <p className="text-gray-400 text-sm">{persona.area ?? '—'}</p>
              </div>
              {(persona as any).traza_id && (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2 bg-traza-50 border border-traza-200 rounded-xl px-3 py-2">
                    <span className="text-xs text-traza-500 font-medium">ID TRAZA</span>
                    <span className="text-sm font-bold text-traza-700 tracking-widest">{(persona as any).traza_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/p/${(persona as any).traza_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-traza-700 transition-colors"
                    >
                      Ver credencial traza →
                    </a>
                    </div>
                </div>
              )}
            </div>

            {/* Narrativa IA */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              {narrativa ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Análisis TRAZA · IA</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{narrativa}</p>
                  <button
                    onClick={generarNarrativaIA}
                    className="text-xs text-gray-400 hover:text-traza-700 transition-colors mt-1"
                  >
                    Regenerar →
                  </button>
                </div>
              ) : (
                <button
                  onClick={generarNarrativaIA}
                  disabled={loadingIA}
                  className="flex items-center gap-2 text-sm font-medium text-traza-700 hover:text-traza-900 transition-colors disabled:opacity-50"
                >
                  {loadingIA ? (
                    <>
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-traza-300 border-t-traza-700 rounded-full" />
                      Generando análisis...
                    </>
                  ) : (
                    <>✦ Generar análisis con IA</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Índice TRAZA */}
          <div className="traza-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-gray-900">Índice TRAZA · {esInd ? 'actual' : 'empresa actual'}</h3>
                <button
                  onClick={() => setShowInfo(true)}
                  className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  title="¿Cómo se calcula?"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: scoreBg, color: scoreColor }}>
                {indice.badge}
              </span>
            </div>

            {/* Score principal */}
            <div className="flex items-end gap-3 mb-5">
              <span className="text-5xl font-bold leading-none" style={{ color: scoreColor }}>{indice.score}</span>
              <div className="pb-1">
                <span className="text-sm text-gray-400">/100</span>
                <p className="text-xs text-gray-400 mt-0.5">{esInd ? 'Actual' : 'Empresa actual'}</p>
              </div>
            </div>

            {/* Barras */}
            <div className="space-y-3">
              {[
                { label: 'Validación de Superiores', pct: '35%', val: indice.moduloA,      color: '#3350D0' },
                { label: 'Cumplimiento',             pct: '25%', val: indice.moduloB,      color: '#3350D0' },
                { label: 'Regularidad',              pct: '20%', val: indice.moduloC,      color: '#3350D0' },
                { label: 'Alineación',               pct: '10%', val: indice.alineacion,   color: '#0891b2' },
                { label: 'Proactividad',             pct: '10%', val: indice.proactividad, color: '#d97706' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {m.label} <span className="text-gray-400">{m.pct}</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{m.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${m.val}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid de detalles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logros */}
            <div className="traza-card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <Award size={16} strokeWidth={1.75} className="text-traza-700" />
                Logros destacados
              </h3>
              {logros.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay objetivos completados.</p>
              ) : (
                <div className="space-y-2">
                  {logros.map(o => (
                    <div key={o.id} className="flex items-start gap-3 py-2">
                      <CheckCircle2 size={16} strokeWidth={1.75} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.titulo}</p>
                        <p className="text-xs text-gray-400">{formatFecha(o.fecha_limite)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimos feedbacks */}
            <div className="traza-card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <MessageSquare size={16} strokeWidth={1.75} className="text-traza-700" />
                Feedback del supervisor
              </h3>
              {ultimasFeedbacks.length === 0 ? (
                <p className="text-gray-400 text-sm">Todavía no hay feedback registrado.</p>
              ) : (
                <div className="space-y-4">
                  {ultimasFeedbacks.map(o => (
                    <div key={o.id} className="border-l-2 border-traza-200 pl-3">
                      <p className="text-xs font-medium text-gray-900">{o.titulo}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={getValidacionStyle(o.validacion)}>
                        {o.validacion}
                      </span>
                      {o.comentario_supervisor?.trim() && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{o.comentario_supervisor}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historial completo */}
          <div className="traza-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Historial de objetivos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tocá un objetivo para ver sus avances y feedback</p>
            </div>
            <div className="divide-y divide-gray-100">
              {objetivos.map(o => (
                <ObjetivoHistorialRow key={o.id} obj={o} />
              ))}
            </div>
          </div>

          {/* Mi empresa actual — solo para independientes */}
          {(profile?.rol === 'individuo' || (profile?.rol === 'empleado' && !profile?.empresa_id)) && (
            <div id="empresa-section" className="traza-card divide-y divide-gray-100">

              {/* Banner onboarding: solo si viene del onboarding y empresa no guardada */}
              {onboardingMode && !empNombre && !empresaGuardada && (
                <div
                  className="px-6 py-4 flex items-start gap-3"
                  style={{ backgroundColor: '#EDEFFD', borderBottom: '1px solid #BBC5F7' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#3350D0' }}
                  >
                    1
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1C2B90' }}>Primer paso: completá esta sección</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4B5CA8' }}>
                      Declarar tu empresa y supervisor le da contexto y peso a tu historial desde el primer día.
                    </p>
                  </div>
                </div>
              )}

              {/* Banner éxito post-guardado */}
              {empresaGuardada && (
                <div
                  className="px-6 py-4 flex items-start gap-3"
                  style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}
                >
                  <CheckCircle2 size={18} style={{ color: '#16a34a' }} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-800">¡Paso 1 completo!</p>
                    <p className="text-xs mt-0.5 text-green-700">
                      Se envió el email de verificación a tu supervisor.{' '}
                      {onboardingMode && 'Ahora cargá tu primer objetivo.'}
                    </p>
                  </div>
                  {onboardingMode && (
                    <a
                      href="/mi-trabajo"
                      className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity"
                      style={{ color: '#16a34a' }}
                    >
                      Ir a mis objetivos <ChevronRight size={12} />
                    </a>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mi empresa actual</p>
                  {!showEmpresaForm && (
                    <button
                      onClick={() => setShowEmpresaForm(true)}
                      className="text-xs font-medium transition-colors"
                      style={{ color: '#3350D0' }}
                    >
                      {empNombre ? 'Editar' : 'Agregar'}
                    </button>
                  )}
                </div>

                {/* Estado actual */}
                {!showEmpresaForm && (
                  empNombre ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
                          <Building2 size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{empNombre}</p>
                          {empDominio && <p className="text-xs text-gray-400">{empDominio}</p>}
                        </div>
                      </div>
                      {supEmail && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                          {(data.persona as any)?.supervisor_verificado ? (
                            <ShieldCheck size={15} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <ShieldAlert size={15} className="text-amber-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {supNombre || 'Supervisor'} · {supEmail}
                            </p>
                            <p className="text-xs mt-0.5" style={{
                              color: (data.persona as any)?.supervisor_verificado ? '#16a34a' : '#d97706'
                            }}>
                              {(data.persona as any)?.supervisor_verificado
                                ? 'Verificado — sus validaciones tienen peso completo'
                                : 'Pendiente de verificación — se envió email al supervisor'}
                            </p>
                          </div>
                        </div>
                      )}
                      {empresaGuardada && (
                        <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
                          ✓ Se envió email de verificación al supervisor.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Declarar tu empresa actual y tu supervisor permite que sus validaciones tengan
                        mayor peso en tu Índice Traza.
                      </p>
                    </div>
                  )
                )}

                {/* Formulario */}
                {showEmpresaForm && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Empresa *</label>
                      <input
                        type="text"
                        value={empNombre}
                        onChange={e => setEmpNombre(e.target.value)}
                        placeholder="Acme S.A."
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Dominio corporativo <span className="text-gray-400">(opcional)</span></label>
                      <input
                        type="text"
                        value={empDominio}
                        onChange={e => setEmpDominio(e.target.value)}
                        placeholder="acme.com"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Supervisor / Responsable</p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={supNombre}
                          onChange={e => setSupNombre(e.target.value)}
                          placeholder="Nombre del supervisor"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                        />
                        <input
                          type="email"
                          value={supEmail}
                          onChange={e => setSupEmail(e.target.value)}
                          placeholder="supervisor@empresa.com *"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        Le enviaremos un email para que confirme que sos su colaborador. Esto aumenta el peso de sus validaciones.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowEmpresaForm(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={guardarEmpresa}
                        disabled={savingEmpresa || !empNombre.trim() || !supEmail.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#3350D0' }}
                      >
                        {savingEmpresa ? (
                          <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                        ) : (
                          <><Send size={14} /> Guardar y enviar</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacidad y visibilidad — solo para el propio empleado */}
          {profile?.rol === 'empleado' && (
            <div className="traza-card divide-y divide-gray-100">

              {/* Toggle 1: Credencial pública */}
              <div className="p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Privacidad de tu credencial</p>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${credencialPublica ? 'bg-traza-100' : 'bg-gray-100'}`}>
                      {credencialPublica
                        ? <Globe size={16} className="text-traza-700" />
                        : <Lock size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Credencial pública activa</p>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
                        {credencialPublica
                          ? 'Tu credencial verificada es accesible por URL. Es tuya: funciona aunque cambies de empresa.'
                          : 'Tu credencial está privada. Nadie puede verla aunque tenga el link.'}
                      </p>
                      {credencialPublica && (persona as any).traza_id && (
                        <a href={`/p/${(persona as any).traza_id}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-traza-600 hover:underline mt-1.5 inline-flex items-center gap-1">
                          traza.app/p/{(persona as any).traza_id} →
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={toggleCredencialPublica} disabled={savingCred}
                    className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${credencialPublica ? 'bg-traza-700' : 'bg-gray-200'} disabled:opacity-60`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${credencialPublica ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Toggle 2: Visible en empleadores */}
              <div className={`p-6 transition-opacity ${credencialPublica ? '' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${disponible ? 'bg-traza-100' : 'bg-gray-100'}`}>
                      {disponible
                        ? <Eye size={16} className="text-traza-700" />
                        : <EyeOff size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Aparecer en traza Empleadores
                        {!credencialPublica && <span className="ml-2 text-xs font-normal text-gray-400">(requiere credencial activa)</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
                        {disponible
                          ? 'Tu nombre, cargo y score son visibles para empresas que buscan talento verificado.'
                          : 'Activá esto para que empleadores puedan encontrarte. Solo se muestra tu score, no tu historial completo.'}
                      </p>
                      {disponible && (persona as any).traza_id && (
                        <a href="/empleadores" target="_blank" rel="noopener noreferrer"
                          className="text-xs text-traza-600 hover:underline mt-1.5 inline-block">
                          Ver el portal de empleadores →
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={toggleDisponible} disabled={savingDisp || !credencialPublica}
                    className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${disponible && credencialPublica ? 'bg-traza-700' : 'bg-gray-200'} disabled:opacity-60`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${disponible && credencialPublica ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      )}
      {/* Modal info Índice TRAZA */}
      {showInfo && (() => {
        const hoy = new Date()
        // Módulo A — para empresa: validaciones de supervisor; para independientes: autoevaluaciones
        const conAutoeval = data.objetivos.filter(o => (o as any).autoevaluacion)
        const autoevalPos = conAutoeval.filter(o => ['De acuerdo', 'Muy bien', 'Superado', 'Bien'].includes((o as any).autoevaluacion)).length
        const conValidacion = data.objetivos.filter(o => o.validacion)
        const positivos = conValidacion.filter(o => o.validacion === 'De acuerdo').length
        const parciales = conValidacion.filter(o => o.validacion === 'Parcialmente de acuerdo').length
        const negativos = conValidacion.filter(o => o.validacion === 'En desacuerdo').length
        // Módulo B — cumplimiento
        const vencidos = data.objetivos.filter(o => !(o as any).es_continuo && o.fecha_limite && new Date(o.fecha_limite) < hoy)
        const completadosVencidos = vencidos.filter(o => o.estado === 'Completado').length
        // Módulo C — regularidad
        const semanas = new Set(data.avances.map(a => {
          const d = new Date(a.creado_en)
          const ys = new Date(d.getFullYear(), 0, 1)
          return `${d.getFullYear()}-W${Math.floor((d.getTime() - ys.getTime()) / (7 * 86400000))}`
        }))
        // Módulo D — alineación
        const conAmbos = esInd
          ? conAutoeval.length  // para independientes cualquier autoevaluación cuenta
          : data.objetivos.filter(o => o.validacion && (o as any).autoevaluacion).length
        // Módulo E — proactividad
        const personales = data.objetivos.filter(o => o.tipo === 'Personal').length
        const totalObjs = data.objetivos.length
        const pctPersonales = totalObjs > 0 ? Math.round(personales / totalObjs * 100) : 0

        const valColor = (v: number) => v >= 75 ? '#16a34a' : v >= 50 ? '#d97706' : '#dc2626'

        const dims = [
          {
            letra: 'A',
            nombre: esInd ? 'Autoevaluación' : 'Validación de superiores',
            peso: '35%',
            valor: indice.moduloA,
            dato: esInd
              ? (conAutoeval.length === 0
                  ? 'Todavía no autoevaluaste ningún objetivo — completá uno y puntuate vos mismo'
                  : `${conAutoeval.length} de ${totalObjs} objetivo${totalObjs !== 1 ? 's' : ''} con autoevaluación · ${autoevalPos} con calificación positiva`)
              : (conValidacion.length === 0
                  ? 'Todavía no tenés objetivos validados por tu manager'
                  : `${positivos} positiva${positivos !== 1 ? 's' : ''}${parciales ? ` · ${parciales} parcial${parciales !== 1 ? 'es' : ''}` : ''}${negativos ? ` · ${negativos} negativa${negativos !== 1 ? 's' : ''}` : ''} sobre ${conValidacion.length} objetivo${conValidacion.length !== 1 ? 's' : ''} evaluado${conValidacion.length !== 1 ? 's' : ''}`),
            motivo: esInd
              ? 'Pesa 35% del total. Como trabajás de forma independiente, tu autoevaluación es el principal indicador de calidad — por eso tiene el mayor peso del índice.'
              : 'Pesa 35% del total — es la dimensión más importante porque la validación de tu manager es la evidencia más objetiva de que tus resultados tienen impacto real.',
          },
          {
            letra: 'B',
            nombre: 'Cumplimiento',
            peso: '25%',
            valor: indice.moduloB,
            dato: vencidos.length === 0
              ? (data.objetivos.filter(o => o.fecha_limite).length === 0
                  ? 'Todavía no tenés objetivos con fecha de vencimiento asignada'
                  : 'Todos tus objetivos están dentro del plazo — ninguno venció sin completar')
              : `Completaste ${completadosVencidos} de ${vencidos.length} objetivo${vencidos.length !== 1 ? 's' : ''} que ya vencieron${vencidos.length - completadosVencidos > 0 ? ` · ${vencidos.length - completadosVencidos} sin completar` : ' · todo en fecha'}`,
            motivo: 'Pesa 25% del total. Si tenés fechas asignadas y ninguna venció, el módulo es 100. Si algún objetivo vence sin completarse, baja proporcionalmente. Sin fechas asignadas, queda en 75 como valor neutro.',
          },
          {
            letra: 'C',
            nombre: 'Regularidad',
            peso: '20%',
            valor: indice.moduloC,
            dato: data.avances.length === 0
              ? 'Todavía no registraste ningún avance — subí el primero en Mi Trabajo'
              : `${semanas.size} semana${semanas.size !== 1 ? 's' : ''} activa${semanas.size !== 1 ? 's' : ''} · ${data.avances.length} avance${data.avances.length !== 1 ? 's' : ''} registrado${data.avances.length !== 1 ? 's' : ''}`,
            motivo: 'Pesa 20% del total. La constancia semanal demuestra que gestionás tu trabajo de forma activa durante el período, no solo al cierre. Más semanas con avances = mayor puntaje.',
          },
          {
            letra: 'D',
            nombre: 'Alineación',
            peso: '10%',
            valor: indice.alineacion,
            dato: esInd
              ? `75/100 fijo — este módulo mide la diferencia entre tu autoevaluación y la de tu supervisor. Como no tenés supervisor, el sistema te asigna 75 por defecto y no cambia. Tu autoevaluación impacta en el Módulo A, no aquí.`
              : (conAmbos === 0
                  ? 'Sin datos todavía — completá la autoevaluación en objetivos que ya tengan validación del manager'
                  : `${conAmbos} objetivo${conAmbos !== 1 ? 's' : ''} con tu autoevaluación y la validación del manager — cuanto más coinciden, mayor es el puntaje`),
            motivo: esInd
              ? 'Pesa 10%. Solo se puede mover si sumás validaciones externas de terceros que comparen con tu autoevaluación. Sin eso, queda en 75.'
              : 'Pesa 10%. Mide si tu percepción de tu trabajo coincide con la de tu manager. Alta alineación indica comunicación fluida y expectativas bien calibradas.',
          },
          {
            letra: 'E',
            nombre: 'Proactividad',
            peso: '10%',
            valor: indice.proactividad,
            dato: totalObjs === 0
              ? 'Sin objetivos cargados todavía'
              : personales === 0
                ? `Todos tus ${totalObjs} objetivos fueron asignados — cargá al menos uno propio para sumar puntos aquí`
                : pctPersonales >= 40
                  ? `${personales} de ${totalObjs} objetivo${totalObjs !== 1 ? 's' : ''} son de iniciativa propia (${pctPersonales}%) — superás el umbral del 40%, módulo al máximo`
                  : `${personales} de ${totalObjs} objetivo${totalObjs !== 1 ? 's' : ''} son de iniciativa propia (${pctPersonales}%) — alcanzando el 40% llegás a puntaje máximo en este módulo`,
            motivo: 'Pesa 10%. Mide qué proporción de tus objetivos los elegiste vos mismo vs. los que te asignaron. Con 40% o más de objetivos propios, este módulo llega a 100.',
          },
        ]

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowInfo(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <h3 className="font-bold text-gray-900">¿Cómo se calcula el Índice?</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Score de 0 a 100 · actualizado automáticamente</p>
                </div>
                <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Intro */}
              <div className="px-6 py-3" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                <p className="text-xs text-gray-500 leading-relaxed">
                  El Índice Traza combina 5 dimensiones independientes, cada una con un peso distinto según su relevancia para evaluar desempeño profesional real. Tu score cambia cada vez que completás objetivos, registrás avances o recibís validaciones.
                </p>
              </div>

              {/* Dimensiones */}
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {dims.map(d => (
                  <div key={d.letra} className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ backgroundColor: '#3350D0' }}>
                        {d.letra}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">{d.nombre}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-gray-400">{d.peso}</span>
                            <span className="text-sm font-bold tabular-nums" style={{ color: valColor(d.valor) }}>{d.valor}/100</span>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.valor}%`, backgroundColor: valColor(d.valor) }} />
                        </div>
                      </div>
                    </div>
                    {/* Dato concreto */}
                    <p className="text-xs font-medium text-gray-700 mb-1 ml-9">{d.dato}</p>
                    {/* Por qué pesa así */}
                    <p className="text-xs text-gray-400 leading-relaxed ml-9">{d.motivo}</p>
                  </div>
                ))}
              </div>

              {/* Footer: niveles */}
              <div className="px-6 py-3" style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                <p className="text-xs text-gray-500">
                  Niveles: <span className="font-semibold text-green-700">Élite</span> (85+) ·{' '}
                  <span className="font-semibold text-blue-700">Avanzado</span> (65–84) ·{' '}
                  <span className="font-semibold text-amber-700">En desarrollo</span> (40–64) ·{' '}
                  <span className="font-semibold text-gray-500">Inicial</span> (&lt;40)
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// -------- Fila expandible con avances + feedback --------
function ObjetivoHistorialRow({ obj }: { obj: Objetivo }) {
  const [open, setOpen]       = useState(false)
  const [avances, setAvances] = useState<any[]>([])

  useEffect(() => {
    if (open && avances.length === 0) {
      supabase
        .from('objetivo_avances')
        .select('*')
        .eq('objetivo_id', obj.id)
        .order('creado_en', { ascending: true })
        .then(({ data }) => setAvances(data ?? []))
    }
  }, [open])

  function formatDT(dt: string) {
    return new Date(dt).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const tieneDetalle = avances.length > 0 || obj.validacion || obj.comentario_supervisor || (obj as any).autoevaluacion || (obj as any).comentario_empleado

  return (
    <div>
      {/* Fila resumen */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-300 flex-shrink-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{obj.titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatFecha(obj.fecha_limite)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Solo mostramos el resultado más relevante, sin apilar chips */}
          {obj.validacion ? (
            <span className="text-xs font-medium text-gray-400">
              {obj.validacion === 'De acuerdo' ? 'Validado' : obj.validacion === 'Parcialmente de acuerdo' ? 'Parcial' : 'En desacuerdo'}
            </span>
          ) : (obj as any).autoevaluacion ? (
            <span className="text-xs font-medium text-gray-400">{(obj as any).autoevaluacion}</span>
          ) : (
            <span className="text-xs text-gray-300">{obj.estado}</span>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {open && (
        <div className="px-6 pb-4 ml-6 space-y-4 border-t border-gray-50">

          {/* Validaciones — discretas, en una línea */}
          {((obj as any).autoevaluacion || obj.validacion || (obj as any).validacion_admin) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {(obj as any).autoevaluacion && (
                <span className="text-xs text-gray-400">Vos: <span className="text-gray-600 font-medium">{(obj as any).autoevaluacion}</span></span>
              )}
              {obj.validacion && (
                <span className="text-xs text-gray-400">Supervisor: <span className="text-gray-600 font-medium">{obj.validacion}</span></span>
              )}
              {(obj as any).validacion_admin && (
                <span className="text-xs text-gray-400">Admin: <span className="text-gray-600 font-medium">{(obj as any).validacion_admin}</span></span>
              )}
            </div>
          )}

          {/* Comentarios */}
          {(obj.comentario_supervisor?.trim() || (obj as any).comentario_empleado || (obj as any).comentario_admin) && (
            <div className="space-y-2 mt-2">
              {(obj as any).comentario_empleado && (
                <p className="text-xs text-gray-400 italic">Vos: "{(obj as any).comentario_empleado}"</p>
              )}
              {obj.comentario_supervisor?.trim() && (
                <p className="text-xs text-gray-400 italic">Supervisor: "{obj.comentario_supervisor}"</p>
              )}
              {(obj as any).comentario_admin && (
                <p className="text-xs text-gray-400 italic">Admin: "{(obj as any).comentario_admin}"</p>
              )}
            </div>
          )}

          {/* Avances */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avances registrados</p>
            {avances.length === 0 ? (
              <p className="text-xs text-gray-400">Sin avances registrados.</p>
            ) : (
              <div className="space-y-2.5">
                {avances.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-2">
                    {/* Contenido del avance */}
                    <div className="flex gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        {a.tipo === 'comentario' && <MessageSquare size={13} className="text-gray-400" />}
                        {a.tipo === 'link'       && <Link2 size={13} className="text-traza-500" />}
                        {a.tipo === 'archivo'    && <Paperclip size={13} className="text-orange-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {(a.tipo === 'link' || a.tipo === 'archivo') ? (
                          <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                            className="text-traza-700 hover:underline break-all text-xs">{a.contenido}</a>
                        ) : (
                          <p className="text-sm text-gray-700">{a.contenido}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{formatDT(a.creado_en)}</p>
                          {/* Badge estado revisión */}
                          {a.estado_revision === 'aprobado' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">✓ Aprobado</span>
                          )}
                          {a.estado_revision === 'visto' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Visto</span>
                          )}
                          {a.estado_revision === 'sin_revisar' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Sin revisar</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Respuesta del supervisor */}
                    {a.respuesta_supervisor && (
                      <div className="ml-5 pl-3 border-l-2 border-traza-200">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Supervisor respondió:</p>
                        <p className="text-xs text-gray-600 italic">"{a.respuesta_supervisor}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!obj.validacion && !obj.comentario_supervisor && avances.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">Este objetivo todavía no tiene avances ni feedback.</p>
          )}
        </div>
      )}
    </div>
  )
}
