'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Mail } from 'lucide-react'
import type { Persona, Empresa } from '@/types'

export default function PersonasPage() {
  const [personas, setPersonas]   = useState<Persona[]>([])
  const [empresas, setEmpresas]   = useState<Empresa[]>([])
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [myEmpresaId, setMyEmpresaId] = useState<string>('')

  // Formulario persona
  const [form, setForm] = useState({
    empresa_id: '',
    nombre: '',
    apellido: '',
    cargo: '',
    area: '',
  })

  // Formulario invitación
  const [showInvite, setShowInvite]     = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)
  const [invite, setInvite] = useState({
    email: '',
    nombre: '',
    apellido: '',
    cargo: '',
    area: '',
    rol: 'empleado',
  })

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('empresa_id, rol').eq('id', user!.id).single()
    const miEmpresaId = profile?.empresa_id ?? ''
    setMyEmpresaId(miEmpresaId)

    const [{ data: ps }, { data: es }] = await Promise.all([
      supabase.from('personas').select('*').order('apellido'),
      supabase.from('empresas').select('*').order('nombre'),
    ])
    if (ps) setPersonas(ps)
    if (es) setEmpresas(es)
    setForm(f => ({ ...f, empresa_id: miEmpresaId || es?.[0]?.id || '' }))
  }

  useEffect(() => { fetchData() }, [])

  function resetForm() {
    setForm({ empresa_id: empresas[0]?.id ?? '', nombre: '', apellido: '', cargo: '', area: '' })
    setEditId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) return
    setLoading(true)
    setError(null)

    const empresaId = myEmpresaId || form.empresa_id
    const payload = {
      empresa_id: empresaId,
      nombre:     form.nombre.trim(),
      apellido:   form.apellido.trim(),
      cargo:      form.cargo.trim() || null,
      area:       form.area.trim() || null,
    }

    let err = null
    if (editId) {
      const { error: e } = await supabase.from('personas').update(payload).eq('id', editId)
      err = e
    } else {
      const { error: e } = await supabase.from('personas').insert(payload)
      err = e
    }

    if (err) { setError(`Error: ${err.message}`); setLoading(false); return }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    resetForm()
    await fetchData()
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(false)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite),
    })

    const data = await res.json()

    if (!res.ok) {
      setInviteError(data.error ?? 'Error al enviar la invitación')
      setInviteLoading(false)
      return
    }

    setInviteSuccess(true)
    setInvite({ email: '', nombre: '', apellido: '', cargo: '', area: '', rol: 'empleado' })
    setTimeout(() => { setInviteSuccess(false); setShowInvite(false) }, 3000)
    await fetchData()
    setInviteLoading(false)
  }

  function handleEdit(p: Persona) {
    setForm({ empresa_id: p.empresa_id, nombre: p.nombre, apellido: p.apellido, cargo: p.cargo ?? '', area: p.area ?? '' })
    setEditId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta persona?')) return
    await supabase.from('personas').delete().eq('id', id)
    fetchData()
  }

  if (empresas.length === 0) {
    return (
      <div className="traza-card p-12 text-center text-gray-400">
        <p>Primero creá una empresa en la sección <strong>Empresas</strong>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-500 mt-1">Administrá los colaboradores de cada empresa.</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>
          <Mail size={15} strokeWidth={1.75} className="mr-2" />
          {showInvite ? 'Cancelar' : 'Invitar usuario'}
        </Button>
      </div>

      {/* Formulario invitación */}
      {showInvite && (
        <div className="traza-card p-6 border-traza-200">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Invitar nuevo usuario</h2>
          <p className="text-sm text-gray-500 mb-5">Le llegará un email con link para crear su contraseña.</p>
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="traza-label">Email *</label>
              <input
                type="email"
                className="traza-input"
                value={invite.email}
                onChange={e => setInvite(f => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            <div>
              <label className="traza-label">Nombre *</label>
              <input className="traza-input" value={invite.nombre} onChange={e => setInvite(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" required />
            </div>
            <div>
              <label className="traza-label">Apellido *</label>
              <input className="traza-input" value={invite.apellido} onChange={e => setInvite(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" required />
            </div>
            <div>
              <label className="traza-label">Cargo</label>
              <input className="traza-input" value={invite.cargo} onChange={e => setInvite(f => ({ ...f, cargo: e.target.value }))} placeholder="Analista, Gerente..." />
            </div>
            <div>
              <label className="traza-label">Área</label>
              <input className="traza-input" value={invite.area} onChange={e => setInvite(f => ({ ...f, area: e.target.value }))} placeholder="RRHH, Tecnología..." />
            </div>
            <div>
              <label className="traza-label">Rol *</label>
              <select className="traza-input" value={invite.rol} onChange={e => setInvite(f => ({ ...f, rol: e.target.value }))}>
                <option value="empleado">Empleado</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
              <Button type="submit" loading={inviteLoading}>Enviar invitación</Button>
              {inviteSuccess && <p className="text-green-600 text-sm">Invitación enviada correctamente</p>}
              {inviteError && <p className="text-red-600 text-sm">{inviteError}</p>}
            </div>
          </form>
        </div>
      )}

      {/* Formulario persona */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {editId ? 'Editar persona' : 'Nueva persona (sin acceso al sistema)'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="traza-label">Empresa *</label>
            <select className="traza-input" value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))} required>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="traza-label">Nombre *</label>
            <input className="traza-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" required />
          </div>
          <div>
            <label className="traza-label">Apellido *</label>
            <input className="traza-input" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" required />
          </div>
          <div>
            <label className="traza-label">Cargo</label>
            <input className="traza-input" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Gerente, Analista..." />
          </div>
          <div>
            <label className="traza-label">Área</label>
            <input className="traza-input" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="RRHH, Tecnología..." />
          </div>
          <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
            <Button type="submit" loading={loading}>{editId ? 'Guardar cambios' : 'Guardar persona'}</Button>
            {editId && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>}
            {success && <p className="text-green-600 text-sm">Guardado correctamente</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Colaboradores registrados ({personas.length})</h2>
        </div>
        {personas.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>Todavía no hay personas registradas.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Cargo</th>
                <th className="px-6 py-3 text-left">Área</th>
                <th className="px-6 py-3 text-left">Acceso</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.nombre} {p.apellido}</td>
                  <td className="px-6 py-4 text-gray-500">{p.cargo ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{p.area ?? '—'}</td>
                  <td className="px-6 py-4">
                    {p.user_id
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Con acceso</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sin acceso</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-xs text-traza-700 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
