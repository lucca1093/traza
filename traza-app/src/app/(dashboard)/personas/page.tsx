'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Mail, UserCheck, UserX, ShieldCheck, ChevronDown } from 'lucide-react'

const ROL_LABEL: Record<string, string> = {
  empleado:    'Empleado',
  supervisor:  'Supervisor',
  admin:       'Admin',
  super_admin: 'Super Admin',
}

const ROL_COLOR: Record<string, string> = {
  empleado:    '#64748B',
  supervisor:  '#3350D0',
  admin:       '#7C3AED',
  super_admin: '#B91C1C',
}

export default function PersonasPage() {
  const [personas,    setPersonas]    = useState<any[]>([])
  const [profiles,    setProfiles]    = useState<Record<string, string>>({}) // user_id → rol
  const [myRol,       setMyRol]       = useState('')
  const [myEmpresaId, setMyEmpresaId] = useState('')
  const [loading,     setLoading]     = useState(true)

  // Formulario invitación
  const [showInvite,    setShowInvite]    = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError,   setInviteError]   = useState<string | null>(null)
  const [invite, setInvite] = useState({
    email: '', nombre: '', apellido: '', cargo: '', area: '', rol: 'empleado',
  })

  // Acciones inline
  const [accionando, setAccionando] = useState<string | null>(null)
  const [tab, setTab] = useState<'activos' | 'bajas'>('activos')

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('empresa_id, rol').eq('id', user!.id).single()
    const empresaId = profile?.empresa_id ?? ''
    setMyEmpresaId(empresaId)
    setMyRol(profile?.rol ?? 'empleado')

    // Personas de la empresa (todas, activas e inactivas)
    const { data: ps } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('apellido')

    setPersonas(ps ?? [])

    // Roles actuales de los que tienen acceso
    const conAcceso = (ps ?? []).filter(p => p.user_id).map(p => p.user_id)
    if (conAcceso.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, rol')
        .in('id', conAcceso)
      const map: Record<string, string> = {}
      ;(profs ?? []).forEach(p => { map[p.id] = p.rol })
      setProfiles(map)
    }

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError(null)

    const res  = await fetch('/api/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(invite),
    })
    const data = await res.json()

    if (!res.ok) { setInviteError(data.error ?? 'Error al enviar la invitación'); setInviteLoading(false); return }

    setInviteSuccess(true)
    setInvite({ email: '', nombre: '', apellido: '', cargo: '', area: '', rol: 'empleado' })
    setTimeout(() => { setInviteSuccess(false); setShowInvite(false) }, 3000)
    await fetchData()
    setInviteLoading(false)
  }

  async function accion(personaId: string, action: string, nuevoRol?: string) {
    setAccionando(personaId + action)
    const res = await fetch('/api/admin/persona', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, persona_id: personaId, nuevo_rol: nuevoRol }),
    })
    if (res.ok) await fetchData()
    else {
      const d = await res.json()
      alert(d.error ?? 'Error')
    }
    setAccionando(null)
  }

  const activos = personas.filter(p => p.empleo_activo !== false)
  const inactivos = personas.filter(p => p.empleo_activo === false)
  const lista = tab === 'activos' ? activos : inactivos

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>

  const esAdmin = ['admin', 'super_admin'].includes(myRol)

  return (
    <div className="space-y-6">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi Equipo</h1>
          <p className="traza-page-sub">Gestioná roles y accesos de tu empresa.</p>
        </div>
        {esAdmin && (
          <Button onClick={() => setShowInvite(!showInvite)}>
            <Mail size={15} strokeWidth={1.75} className="mr-2" />
            {showInvite ? 'Cancelar' : 'Invitar persona'}
          </Button>
        )}
      </div>

      {/* Formulario invitación */}
      {showInvite && esAdmin && (
        <div className="traza-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Invitar nueva persona</h2>
          <p className="text-sm text-gray-500 mb-5">Le va a llegar un email con un link para crear su contraseña.</p>
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="traza-label">Email *</label>
              <input type="email" className="traza-input" value={invite.email}
                onChange={e => setInvite(f => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.com" required />
            </div>
            <div>
              <label className="traza-label">Nombre *</label>
              <input className="traza-input" value={invite.nombre}
                onChange={e => setInvite(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" required />
            </div>
            <div>
              <label className="traza-label">Apellido *</label>
              <input className="traza-input" value={invite.apellido}
                onChange={e => setInvite(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" required />
            </div>
            <div>
              <label className="traza-label">Cargo</label>
              <input className="traza-input" value={invite.cargo}
                onChange={e => setInvite(f => ({ ...f, cargo: e.target.value }))} placeholder="Analista, Gerente..." />
            </div>
            <div>
              <label className="traza-label">Área</label>
              <input className="traza-input" value={invite.area}
                onChange={e => setInvite(f => ({ ...f, area: e.target.value }))} placeholder="RRHH, Tecnología..." />
            </div>
            <div>
              <label className="traza-label">Rol inicial</label>
              <select className="traza-input" value={invite.rol}
                onChange={e => setInvite(f => ({ ...f, rol: e.target.value }))}>
                <option value="empleado">Empleado</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" loading={inviteLoading}>Enviar invitación</Button>
              {inviteSuccess && <p className="text-green-600 text-sm">Invitación enviada</p>}
              {inviteError   && <p className="text-red-600   text-sm">{inviteError}</p>}
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activos.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Activos</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activos.filter(p => p.user_id).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Con acceso</p>
        </div>
        <div className="traza-card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: inactivos.length > 0 ? '#EF4444' : '#CBD5E1' }}>{inactivos.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Dados de baja</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="traza-tabs w-fit">
        <button onClick={() => setTab('activos')} className={`traza-tab ${tab === 'activos' ? 'active' : ''}`}>
          Activos <span className="ml-1 text-xs text-gray-400">({activos.length})</span>
        </button>
        <button onClick={() => setTab('bajas')} className={`traza-tab ${tab === 'bajas' ? 'active' : ''}`}>
          Dados de baja <span className="ml-1 text-xs text-gray-400">({inactivos.length})</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="traza-card overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {tab === 'activos' ? 'No hay personas activas.' : 'No hay personas dadas de baja.'}
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 text-left">Persona</th>
                <th className="px-5 py-3 text-left">Cargo / Área</th>
                <th className="px-5 py-3 text-left">Acceso</th>
                {esAdmin && <th className="px-5 py-3 text-left">Rol</th>}
                {esAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map(p => {
                const rolActual = p.user_id ? (profiles[p.user_id] ?? 'empleado') : null
                const bajando   = accionando === p.id + 'dar_de_baja'
                const reactivando = accionando === p.id + 'reactivar'

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors"
                    style={{ opacity: p.empleo_activo === false ? 0.6 : 1 }}>

                    {/* Persona */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-traza-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-traza-700 text-xs font-bold">
                            {p.nombre?.[0]}{p.apellido?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.nombre} {p.apellido}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cargo / Área */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{p.cargo ?? '—'}</p>
                      {p.area && <p className="text-xs text-gray-400">{p.area}</p>}
                    </td>

                    {/* Acceso */}
                    <td className="px-5 py-4">
                      {p.user_id
                        ? <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5 w-fit">
                            <UserCheck size={11} /> Con acceso
                          </span>
                        : <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">
                            Sin acceso
                          </span>
                      }
                    </td>

                    {/* Rol (editable si tiene acceso) */}
                    {esAdmin && (
                      <td className="px-5 py-4">
                        {rolActual ? (
                          <div className="relative inline-block">
                            <select
                              value={rolActual}
                              onChange={e => accion(p.id, 'cambiar_rol', e.target.value)}
                              disabled={!!accionando || rolActual === 'super_admin'}
                              className="appearance-none text-xs font-semibold pl-2 pr-6 py-1 rounded-md border cursor-pointer focus:outline-none disabled:cursor-default"
                              style={{
                                color:           ROL_COLOR[rolActual] ?? '#64748B',
                                borderColor:     '#E2E8F0',
                                backgroundColor: 'white',
                              }}
                            >
                              <option value="empleado">Empleado</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="admin">Admin</option>
                              {rolActual === 'super_admin' && <option value="super_admin">Super Admin</option>}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    )}

                    {/* Acciones */}
                    {esAdmin && (
                      <td className="px-5 py-4 text-right">
                        {p.empleo_activo === false ? (
                          <button
                            onClick={() => accion(p.id, 'reactivar')}
                            disabled={!!accionando}
                            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 transition-colors ml-auto disabled:opacity-40"
                          >
                            <UserCheck size={13} />
                            {reactivando ? 'Reactivando...' : 'Reactivar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!confirm(`¿Dar de baja a ${p.nombre} ${p.apellido}? Va a perder acceso al sistema.`)) return
                              accion(p.id, 'dar_de_baja')
                            }}
                            disabled={!!accionando}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-auto disabled:opacity-40"
                          >
                            <UserX size={13} />
                            {bajando ? 'Procesando...' : 'Dar de baja'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
