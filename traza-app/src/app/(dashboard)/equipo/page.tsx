'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularIndiceTraza, isVencido } from '@/lib/traza'
import { AlertTriangle, CheckCircle2, Clock, Activity, Star, X } from 'lucide-react'
import Link from 'next/link'

interface MiembroEquipo {
  persona: any
  objetivos: any[]
  avances: any[]
  cierreSemanal: any | null
}

function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function scoreRing(score: number): string {
  if (score >= 75) return 'border-green-200 bg-green-50'
  if (score >= 50) return 'border-amber-200 bg-amber-50'
  return 'border-red-200 bg-red-50'
}

function diasDesde(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getLunes(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default function EquipoPage() {
  const [miembros, setMiembros] = useState<MiembroEquipo[]>([])
  const [loading, setLoading]   = useState(true)
  const [ordenPor, setOrdenPor]       = useState<'score' | 'actividad' | 'nombre'>('score')
  const [reconModal, setReconModal]   = useState<any | null>(null)
  const [reconTitulo, setReconTitulo] = useState('')
  const [reconDesc, setReconDesc]     = useState('')
  const [reconSaving, setReconSaving] = useState(false)
  const [reconDone, setReconDone]     = useState(false)

  async function handleReconocer() {
    if (!reconModal || !reconTitulo.trim()) return
    setReconSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('reconocimientos').insert({
      persona_id:      reconModal.id,
      empresa_id:      reconModal.empresa_id,
      otorgado_por_id: user!.id,
      titulo:          reconTitulo.trim(),
      descripcion:     reconDesc.trim() || null,
    })
    setReconSaving(false)
    setReconDone(true)
    setTimeout(() => {
      setReconModal(null); setReconTitulo(''); setReconDesc(''); setReconDone(false)
    }, 2000)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id, rol')
        .eq('id', user.id)
        .single()

      if (!profile?.empresa_id) return

      const empresaId = profile.empresa_id

      // Personas de la empresa
      const { data: personas } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('apellido')

      if (!personas?.length) { setLoading(false); return }

      const personaIds = personas.map((p: any) => p.id)

      // Objetivos de todas las personas
      const { data: todosObjetivos } = await supabase
        .from('objetivos')
        .select('*')
        .in('persona_id', personaIds)

      // Avances de todas las personas (últimos 90 días)
      const hace90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data: todosAvances } = await supabase
        .from('objetivo_avances')
        .select('persona_id, creado_en')
        .eq('empresa_id', empresaId)
        .gte('creado_en', hace90)
        .order('creado_en', { ascending: false })

      // Cierres semanales de esta semana
      const semana = getLunes()
      const { data: cierres } = await supabase
        .from('cierres_semanales')
        .select('*')
        .in('persona_id', personaIds)
        .eq('semana', semana)

      // Armar la estructura por persona
      const resultado: MiembroEquipo[] = personas.map((persona: any) => {
        const objetivos = (todosObjetivos ?? []).filter((o: any) => o.persona_id === persona.id)
        const avances   = (todosAvances ?? []).filter((a: any) => a.persona_id === persona.id)
        const cierre    = (cierres ?? []).find((c: any) => c.persona_id === persona.id) ?? null
        return { persona, objetivos, avances, cierreSemanal: cierre }
      })

      setMiembros(resultado)
      setLoading(false)
    }
    load()
  }, [])

  const ordenados = [...miembros].sort((a, b) => {
    if (ordenPor === 'score') {
      const sa = calcularIndiceTraza(a.objetivos, a.avances).score
      const sb = calcularIndiceTraza(b.objetivos, b.avances).score
      return sb - sa
    }
    if (ordenPor === 'actividad') {
      const ua = a.avances[0]?.creado_en ?? null
      const ub = b.avances[0]?.creado_en ?? null
      if (!ua) return 1
      if (!ub) return -1
      return new Date(ub).getTime() - new Date(ua).getTime()
    }
    return `${a.persona.apellido} ${a.persona.nombre}`.localeCompare(`${b.persona.apellido} ${b.persona.nombre}`)
  })

  if (loading) {
    return <div className="py-16 text-center text-sm" style={{ color: '#94A3B8' }}>Cargando equipo...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi Equipo</h1>
          <p className="traza-page-sub">
            {miembros.length} colaborador{miembros.length !== 1 ? 'es' : ''} · visión consolidada del equipo
          </p>
        </div>

        {/* Ordenar */}
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          {([
            { key: 'score',     label: 'Por score'    },
            { key: 'actividad', label: 'Por actividad' },
            { key: 'nombre',    label: 'Por nombre'   },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setOrdenPor(key)}
              className="text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all"
              style={ordenPor === key
                ? { backgroundColor: 'white', color: '#0F172A', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }
                : { color: '#64748B' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen rápido */}
      {miembros.length > 0 && (() => {
        const sinActividad = miembros.filter(m => {
          const d = diasDesde(m.avances[0]?.creado_en ?? null)
          return d === null || d > 14
        }).length
        const conCierre = miembros.filter(m => m.cierreSemanal).length
        const promedioScore = Math.round(
          miembros.reduce((sum, m) => sum + calcularIndiceTraza(m.objetivos, m.avances).score, 0) / miembros.length
        )

        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="traza-card p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: scoreColor(promedioScore), fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.04em' }}>{promedioScore}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#94A3B8' }}>Score promedio del equipo</p>
            </div>
            <div className="traza-card p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: sinActividad > 0 ? '#D97706' : '#CBD5E1', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.04em' }}>{sinActividad}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#94A3B8' }}>Sin actividad +14 días</p>
            </div>
            <div className="traza-card p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.04em' }}>{conCierre}/{miembros.length}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#94A3B8' }}>Cierre semanal esta semana</p>
            </div>
          </div>
        )
      })()}

      {/* Tabla del equipo */}
      <div className="traza-card overflow-hidden">
        {/* Header columnas */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div className="col-span-3">Colaborador</div>
          <div className="col-span-2 text-center">Índice Traza</div>
          <div className="col-span-2 text-center">Objetivos</div>
          <div className="col-span-1 text-center">Vencidos</div>
          <div className="col-span-2 text-center">Última actividad</div>
          <div className="col-span-1 text-center">Cierre</div>
          <div className="col-span-1 text-center">⭐</div>
        </div>

        {ordenados.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No hay colaboradores en el equipo.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ordenados.map(({ persona, objetivos, avances, cierreSemanal }) => {
              const indice     = calcularIndiceTraza(objetivos, avances)
              const activos    = objetivos.filter((o: any) => o.estado !== 'Completado').length
              const completados = objetivos.filter((o: any) => o.estado === 'Completado').length
              const vencidos   = objetivos.filter((o: any) => isVencido(o.fecha_limite, o.estado)).length
              const ultimaActiv = avances[0]?.creado_en ?? null
              const dias        = diasDesde(ultimaActiv)

              return (
                <Link
                  key={persona.id}
                  href={`/objetivos?persona=${persona.id}`}
                  className="grid grid-cols-12 gap-2 items-center px-5 py-4 transition-colors group"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'}
                >
                  {/* Colaborador */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-traza-700 text-xs font-bold">
                        {persona.nombre?.[0]}{persona.apellido?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {persona.nombre} {persona.apellido}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {persona.cargo ?? ''}{persona.area ? ` · ${persona.area}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 flex justify-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${scoreRing(indice.score)}`}>
                      <span className="text-sm font-bold" style={{ color: scoreColor(indice.score) }}>
                        {indice.score}
                      </span>
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div className="col-span-2 text-center">
                    <p className="text-sm font-semibold text-gray-900">{activos}</p>
                    <p className="text-xs text-gray-400">{completados} completados</p>
                  </div>

                  {/* Vencidos */}
                  <div className="col-span-1 flex justify-center">
                    {vencidos > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                        <AlertTriangle size={12} />
                        {vencidos}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Última actividad */}
                  <div className="col-span-2 flex justify-center">
                    {dias === null ? (
                      <span className="text-xs text-gray-300">Sin avances</span>
                    ) : dias === 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <Activity size={11} /> Hoy
                      </span>
                    ) : dias <= 7 ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} /> Hace {dias}d
                      </span>
                    ) : dias <= 14 ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Clock size={11} /> Hace {dias}d
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                        <AlertTriangle size={11} /> Hace {dias}d
                      </span>
                    )}
                  </div>

                  {/* Cierre semanal */}
                  <div className="col-span-1 flex justify-center">
                    {cierreSemanal ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-200 block" />
                    )}
                  </div>

                  {/* Reconocer */}
                  <div className="col-span-1 flex justify-center" onClick={e => e.preventDefault()}>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setReconModal(persona); setReconTitulo(''); setReconDesc('') }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: '#CBD5E1' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F59E0B'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CBD5E1'}
                      title="Dar reconocimiento"
                    >
                      <Star size={15} />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* ── Modal reconocimiento ───────────────────────── */}
    {reconModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Reconocimiento</p>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                {reconModal.nombre} {reconModal.apellido}
              </h3>
            </div>
            <button onClick={() => setReconModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {reconDone ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-3">⭐</p>
              <p className="font-semibold text-gray-900">¡Reconocimiento enviado!</p>
              <p className="text-sm text-gray-400 mt-1">Aparecerá en Mi Trabajo de {reconModal.nombre}.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Título *</label>
                  <input
                    type="text"
                    value={reconTitulo}
                    onChange={e => setReconTitulo(e.target.value)}
                    placeholder="Ej: Logro del trimestre, Trabajo en equipo..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-traza-400"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Mensaje (opcional)</label>
                  <textarea
                    value={reconDesc}
                    onChange={e => setReconDesc(e.target.value)}
                    placeholder="Describí brevemente el motivo del reconocimiento..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-traza-400 resize-none"
                    maxLength={300}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setReconModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleReconocer}
                  disabled={!reconTitulo.trim() || reconSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}
                >
                  {reconSaving ? 'Guardando...' : '⭐ Dar reconocimiento'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  )
}
