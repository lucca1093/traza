'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatFecha } from '@/lib/traza'
import { Calendar, Plus, ChevronDown, ChevronRight, Target, Trash2, MessageSquare, CheckSquare, ClipboardList, X, AlertCircle, Clock } from 'lucide-react'

function diasDesde(fechaISO: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaISO + 'T12:00:00')
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
}

function labelDias(dias: number): { texto: string; color: string; alerta: boolean } {
  if (dias === 0) return { texto: 'Hoy', color: '#15803d', alerta: false }
  if (dias === 1) return { texto: 'Ayer', color: '#6b7280', alerta: false }
  if (dias < 14)  return { texto: `Hace ${dias} días`, color: '#6b7280', alerta: false }
  if (dias < 30)  return { texto: `Hace ${dias} días`, color: '#b45309', alerta: true }
  return { texto: `Hace ${dias} días`, color: '#b91c1c', alerta: true }
}

export default function ReunionesPage() {
  const [loading, setLoading]         = useState(true)
  const [esIndependiente, setEsIndependiente] = useState(false)
  const [rol, setRol]                 = useState('')
  const [empresaId, setEmpresaId]     = useState('')
  const [miPersonaId, setMiPersonaId] = useState('')
  const [personas, setPersonas]       = useState<any[]>([])
  const [objetivos, setObjetivos]     = useState<any[]>([])
  const [reuniones, setReuniones]     = useState<any[]>([])
  const [filtroEmpleado, setFiltro]   = useState('todos')
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const [form, setForm] = useState({
    empleadoId:      '',
    fecha:           new Date().toISOString().split('T')[0],
    temasTratados:   '',
    notas:           '',
    acuerdos:        '',
    objetivoId:      '',
    proximaReunion:  '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('rol, empresa_id').eq('id', user.id).single()

      const esIndep = !profile || !profile.empresa_id
      setEsIndependiente(esIndep)
      setRol(profile?.rol ?? '')
      setEmpresaId(profile?.empresa_id ?? '')

      if (esIndep) {
        setLoading(false)
        return
      }

      const { data: miPersona } = await supabase
        .from('personas').select('id').eq('user_id', user.id).eq('empleo_activo', true).single()
      if (miPersona) setMiPersonaId(miPersona.id)

      if (['admin', 'super_admin', 'supervisor'].includes(profile?.rol ?? '')) {
        const { data: ps } = await supabase
          .from('personas').select('id, nombre, apellido, cargo, area')
          .eq('empresa_id', profile?.empresa_id)
          .eq('empleo_activo', true).order('apellido')
        setPersonas(ps ?? [])

        const { data: obs } = await supabase
          .from('objetivos').select('id, titulo, persona_id')
          .eq('empresa_id', profile?.empresa_id)
          .order('created_at', { ascending: false })
        setObjetivos(obs ?? [])
      }

      await fetchReuniones(profile?.empresa_id ?? '', profile?.rol ?? '', miPersona?.id ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function fetchReuniones(empId: string, rolActual: string, personaId: string) {
    const params = new URLSearchParams({ empresaId: empId })
    if (rolActual === 'empleado' && personaId) params.set('empleadoId', personaId)
    const res = await fetch(`/api/1on1?${params}`)
    const data = await res.json()
    setReuniones(data.reuniones ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.empleadoId || !form.fecha) return
    setSaving(true)

    await fetch('/api/1on1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId,
        supervisorId:   miPersonaId,
        empleadoId:     form.empleadoId,
        fecha:          form.fecha,
        agenda:         form.temasTratados,
        notas:          form.notas,
        acuerdos:       form.acuerdos,
        objetivoId:     form.objetivoId || null,
        proximaReunion: form.proximaReunion || null,
      }),
    })

    setForm({ empleadoId: '', fecha: new Date().toISOString().split('T')[0], temasTratados: '', notas: '', acuerdos: '', objetivoId: '', proximaReunion: '' })
    setShowForm(false)
    setSaving(false)
    await fetchReuniones(empresaId, rol, miPersonaId)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/1on1?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    await fetchReuniones(empresaId, rol, miPersonaId)
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const reunionesFiltradas = filtroEmpleado === 'todos'
    ? reuniones
    : reuniones.filter(r => r.empleado_id === filtroEmpleado)

  const grupos: Record<string, { empleado: any; reuniones: any[] }> = {}
  reunionesFiltradas.forEach(r => {
    const pid = r.empleado_id
    if (!grupos[pid]) grupos[pid] = { empleado: r.empleado, reuniones: [] }
    grupos[pid].reuniones.push(r)
  })

  const objetivosEmpleado = form.empleadoId
    ? objetivos.filter(o => o.persona_id === form.empleadoId)
    : []

  const esAdmin = ['admin', 'super_admin', 'supervisor'].includes(rol)

  if (loading) return (
    <div className="py-16 text-center text-sm" style={{ color: '#94A3B8' }}>Cargando...</div>
  )

  if (esIndependiente) return (
    <div className="space-y-6">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Reuniones 1:1</h1>
          <p className="traza-page-sub">Conversaciones entre empleados y supervisores.</p>
        </div>
      </div>
      <div style={{ borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '48px 32px', textAlign: 'center' }}>
        <MessageSquare size={40} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
        <p style={{ fontWeight: 600, color: '#1E293B', fontSize: 16, marginBottom: 8 }}>
          Las reuniones 1:1 son una función de equipo
        </p>
        <p style={{ color: '#64748B', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
          Cuando tu empresa adopte Traza, tus conversaciones con tu supervisor aparecerán aquí.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Reuniones 1:1</h1>
          <p className="traza-page-sub">
            {esAdmin
              ? 'Registrá notas de reuniones con tu equipo. El empleado puede ver su historial.'
              : 'Historial de conversaciones con tu supervisor.'}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#3350D0' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2438B0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#3350D0'}
          >
            <Plus size={16} />
            Nueva reunión
          </button>
        )}
      </div>

      {/* Filtro */}
      {esAdmin && personas.length > 0 && (
        <div className="flex items-center gap-3">
          <select
            className="traza-input w-auto"
            value={filtroEmpleado}
            onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todo el equipo</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">{reunionesFiltradas.length} reunión{reunionesFiltradas.length !== 1 ? 'es' : ''}</span>
        </div>
      )}

      {/* Modal nueva reunión */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h2 className="font-bold" style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Nueva reunión 1:1</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#64748B' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="traza-label">Empleado *</label>
                  <select
                    className="traza-input"
                    value={form.empleadoId}
                    onChange={e => setForm(f => ({ ...f, empleadoId: e.target.value, objetivoId: '' }))}
                    required
                  >
                    <option value="">Seleccioná una persona</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="traza-label">Fecha de la reunión *</label>
                  <input
                    type="date"
                    className="traza-input"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {objetivosEmpleado.length > 0 && (
                <div>
                  <label className="traza-label">Vincular a objetivo (opcional)</label>
                  <select
                    className="traza-input"
                    value={form.objetivoId}
                    onChange={e => setForm(f => ({ ...f, objetivoId: e.target.value }))}
                  >
                    <option value="">Sin objetivo vinculado</option>
                    {objetivosEmpleado.map(o => (
                      <option key={o.id} value={o.id}>{o.titulo}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="traza-label flex items-center gap-1.5">
                  <ClipboardList size={13} className="text-gray-400" /> Temas tratados
                </label>
                <textarea
                  className="traza-input resize-none"
                  rows={2}
                  placeholder="¿De qué se habló?"
                  value={form.temasTratados}
                  onChange={e => setForm(f => ({ ...f, temasTratados: e.target.value }))}
                />
              </div>

              <div>
                <label className="traza-label flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-gray-400" /> Notas
                </label>
                <textarea
                  className="traza-input resize-none"
                  rows={3}
                  placeholder="Resumen de lo que se conversó"
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                />
              </div>

              <div>
                <label className="traza-label flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-gray-400" /> Acuerdos
                </label>
                <textarea
                  className="traza-input resize-none"
                  rows={2}
                  placeholder="¿Qué quedó acordado?"
                  value={form.acuerdos}
                  onChange={e => setForm(f => ({ ...f, acuerdos: e.target.value }))}
                />
              </div>

              <div>
                <label className="traza-label flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400" /> Próxima reunión (opcional)
                </label>
                <input
                  type="date"
                  className="traza-input"
                  value={form.proximaReunion}
                  onChange={e => setForm(f => ({ ...f, proximaReunion: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !form.empleadoId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#3350D0' }}
                  onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#2438B0' }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#3350D0'}
                >
                  {saving ? 'Guardando...' : 'Guardar reunión'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#475569', backgroundColor: 'white' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista agrupada por empleado */}
      {Object.keys(grupos).length === 0 ? (
        <div className="traza-card p-12 text-center">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {esAdmin ? 'Todavía no hay reuniones registradas. Creá la primera.' : 'Tu supervisor todavía no registró reuniones 1:1 con vos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(grupos).map(({ empleado, reuniones: rs }) => {
            const ultimaFecha = rs[0]?.fecha // ya vienen ordenadas por fecha desc
            const dias = ultimaFecha ? diasDesde(ultimaFecha) : 999
            const label = ultimaFecha ? labelDias(dias) : null
            const proximaReunion = rs[0]?.proxima_reunion ?? null

            return (
              <div key={empleado?.id} className="traza-card overflow-hidden">
                {/* Header del grupo */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer transition-colors"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  onClick={() => toggleExpanded(empleado?.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)' }}
                    >
                      {empleado?.nombre?.[0]}{empleado?.apellido?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{empleado?.nombre} {empleado?.apellido}</p>
                      <p className="text-xs text-gray-400">{empleado?.cargo}{empleado?.area ? ` · ${empleado.area}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {/* Alerta días sin reunión */}
                    {esAdmin && label && (
                      <div className="flex items-center gap-1.5">
                        {label.alerta && <AlertCircle size={13} style={{ color: label.color }} />}
                        <span className="text-xs font-medium" style={{ color: label.color }}>
                          Última reunión: {label.texto}
                        </span>
                      </div>
                    )}
                    {/* Próxima reunión */}
                    {proximaReunion && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: '#EDEFFD', color: '#1C2B90' }}>
                        <Clock size={10} className="inline mr-1" />
                        Próxima: {formatFecha(proximaReunion)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">{rs.length} reunión{rs.length !== 1 ? 'es' : ''}</span>
                    {expanded.has(empleado?.id)
                      ? <ChevronDown size={16} className="text-gray-400" />
                      : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Reuniones del empleado */}
                {expanded.has(empleado?.id) && (
                  <div className="divide-y divide-gray-50 border-t border-gray-100">
                    {rs.map((r: any) => (
                      <div key={r.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Fecha + objetivo */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                <Calendar size={13} className="text-gray-400" />
                                {formatFecha(r.fecha)}
                              </div>
                              {r.objetivo && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: '#EDEFFD', color: '#1C2B90' }}>
                                  <Target size={10} />
                                  {r.objetivo.titulo}
                                </span>
                              )}
                              {r.proxima_reunion && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
                                  <Clock size={10} />
                                  Próxima: {formatFecha(r.proxima_reunion)}
                                </span>
                              )}
                            </div>

                            {/* Temas tratados */}
                            {r.agenda && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                  <ClipboardList size={11} /> Temas tratados
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">{r.agenda}</p>
                              </div>
                            )}

                            {/* Notas */}
                            {r.notas && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                  <MessageSquare size={11} /> Notas
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">{r.notas}</p>
                              </div>
                            )}

                            {/* Acuerdos */}
                            {r.acuerdos && (
                              <div className="rounded-xl p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#15803d' }}>
                                  <CheckSquare size={11} /> Acuerdos
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: '#166534' }}>{r.acuerdos}</p>
                              </div>
                            )}
                          </div>

                          {esAdmin && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              disabled={deletingId === r.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
                            >
                              <Trash2 size={14} className={deletingId === r.id ? 'text-gray-300' : 'text-gray-300 hover:text-red-400'} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
