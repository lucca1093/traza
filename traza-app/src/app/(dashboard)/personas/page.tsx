'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import type { Persona, Empresa } from '@/types'

export default function PersonasPage() {
  const [personas, setPersonas]   = useState<Persona[]>([])
  const [empresas, setEmpresas]   = useState<Empresa[]>([])
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [myEmpresaId, setMyEmpresaId] = useState<string>('')

  const [form, setForm] = useState({
    empresa_id: '',
    nombre: '',
    apellido: '',
    cargo: '',
    area: '',
  })

  async function fetchData() {
    // Primero obtenemos la empresa del usuario logueado
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
    // Pre-seleccionar siempre la empresa del usuario
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

    // Siempre usar la empresa del usuario logueado (respeta RLS)
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

    if (err) {
      setError(`Error: ${err.message}`)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    resetForm()
    await fetchData()
    setLoading(false)
  }

  function handleEdit(p: Persona) {
    setForm({
      empresa_id: p.empresa_id,
      nombre:     p.nombre,
      apellido:   p.apellido,
      cargo:      p.cargo ?? '',
      area:       p.area ?? '',
    })
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
        <p className="text-4xl mb-2">⚠️</p>
        <p>Primero creá una empresa en la sección <strong>Empresas</strong>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">👥 Personas</h1>
        <p className="text-gray-500 mt-1">Administrá los colaboradores de cada empresa.</p>
      </div>

      {/* Formulario */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {editId ? 'Editar persona' : 'Nueva persona'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="traza-label">Empresa *</label>
            <select
              className="traza-input"
              value={form.empresa_id}
              onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
              required
            >
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
            {success && <p className="text-green-600 text-sm">✅ Guardado correctamente</p>}
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
            <p className="text-4xl mb-2">👥</p>
            <p>Todavía no hay personas registradas.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Cargo</th>
                <th className="px-6 py-3 text-left">Área</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {personas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.nombre} {p.apellido}</td>
                  <td className="px-6 py-4 text-gray-500">{p.cargo ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{p.area ?? '—'}</td>
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
