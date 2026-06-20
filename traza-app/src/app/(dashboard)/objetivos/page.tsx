'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { getEstadoClasses, getPrioridadClasses, getValidacionClasses, formatFecha } from '@/lib/traza'
import type { Objetivo, Persona, Profile } from '@/types'

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<any[]>([])
  const [personas, setPersonas]   = useState<Persona[]>([])
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)

  const [form, setForm] = useState({
    persona_id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    fecha_limite: '',
    estado: 'Pendiente',
    tipo: 'Asignado',
    evidencia_url: '',
  })

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
    setProfile(p)

    const [{ data: obs }, { data: pers }] = await Promise.all([
      supabase.from('objetivos').select('*, persona:personas(nombre, apellido, area)').order('fecha_limite', { ascending: true, nullsFirst: false }),
      supabase.from('personas').select('*').order('apellido'),
    ])

    setObjetivos(obs ?? [])
    setPersonas(pers ?? [])
    if (pers && pers.length > 0 && !form.persona_id) {
      setForm(f => ({ ...f, persona_id: pers[0].id }))
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).single()

    const payload = {
      empresa_id:   prof!.empresa_id,
      persona_id:   form.persona_id || null,
      creado_por:   user!.id,
      titulo:       form.titulo,
      descripcion:  form.descripcion || null,
      prioridad:    form.prioridad,
      fecha_limite: form.fecha_limite || null,
      estado:       form.estado,
      tipo:         profile?.rol === 'supervisor' ? 'Asignado' : form.tipo,
      evidencia_url: form.evidencia_url || null,
    }

    if (editId) {
      await supabase.from('objetivos').update(payload).eq('id', editId)
    } else {
      await supabase.from('objetivos').insert(payload)
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    resetForm()
    fetchData()
    setLoading(false)
  }

  function resetForm() {
    setForm({ persona_id: personas[0]?.id ?? '', titulo: '', descripcion: '', prioridad: 'Media', fecha_limite: '', estado: 'Pendiente', tipo: 'Asignado', evidencia_url: '' })
    setEditId(null)
  }

  function handleEdit(obj: any) {
    setForm({
      persona_id:   obj.persona_id ?? '',
      titulo:       obj.titulo,
      descripcion:  obj.descripcion ?? '',
      prioridad:    obj.prioridad,
      fecha_limite: obj.fecha_limite ?? '',
      estado:       obj.estado,
      tipo:         obj.tipo,
      evidencia_url: obj.evidencia_url ?? '',
    })
    setEditId(obj.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    fetchData()
  }

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Gestión de Objetivos</h1>
        <p className="text-gray-500 mt-1">Creá y administrá los objetivos del equipo.</p>
      </div>

      {/* Formulario */}
      <div className="traza-card p-6">
        <h2 className="font-semibold text-gray-900 mb-5">{editId ? 'Editar objetivo' : 'Nuevo objetivo'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="traza-label">Colaborador</label>
            <select className="traza-input" value={form.persona_id} onChange={e => f('persona_id', e.target.value)}>
              {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="traza-label">Título *</label>
            <input className="traza-input" value={form.titulo} onChange={e => f('titulo', e.target.value)} placeholder="Título del objetivo" required />
          </div>
          <div className="md:col-span-2">
            <label className="traza-label">Descripción</label>
            <textarea className="traza-input min-h-[80px] resize-none" value={form.descripcion} onChange={e => f('descripcion', e.target.value)} placeholder="Descripción del objetivo..." />
          </div>
          <div>
            <label className="traza-label">Prioridad</label>
            <select className="traza-input" value={form.prioridad} onChange={e => f('prioridad', e.target.value)}>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
          </div>
          <div>
            <label className="traza-label">Fecha límite</label>
            <input type="date" className="traza-input" value={form.fecha_limite} onChange={e => f('fecha_limite', e.target.value)} />
          </div>
          <div>
            <label className="traza-label">Estado</label>
            <select className="traza-input" value={form.estado} onChange={e => f('estado', e.target.value)}>
              <option>Pendiente</option><option>En progreso</option><option>Completado</option>
            </select>
          </div>
          {profile?.rol !== 'supervisor' && (
            <div>
              <label className="traza-label">Tipo</label>
              <select className="traza-input" value={form.tipo} onChange={e => f('tipo', e.target.value)}>
                <option>Asignado</option><option>Personal</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="traza-label">Link de evidencia</label>
            <input className="traza-input" value={form.evidencia_url} onChange={e => f('evidencia_url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={loading}>{editId ? 'Guardar cambios' : 'Guardar objetivo'}</Button>
            {editId && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>}
            {success && <p className="text-green-600 text-sm">✅ Guardado correctamente</p>}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Objetivos ({objetivos.length})</h2>
        </div>
        {objetivos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay objetivos todavía.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Colaborador</th>
                <th className="px-6 py-3 text-left">Objetivo</th>
                <th className="px-6 py-3 text-left">Prioridad</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Vence</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {objetivos.map((obj: any) => (
                <tr key={obj.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {obj.persona ? `${obj.persona.nombre} ${obj.persona.apellido}` : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">{obj.titulo}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPrioridadClasses(obj.prioridad)}`}>{obj.prioridad}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoClasses(obj.estado)}`}>{obj.estado}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatFecha(obj.fecha_limite)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(obj)} className="text-xs text-traza-700 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(obj.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
