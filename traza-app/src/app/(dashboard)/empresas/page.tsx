'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import type { Empresa } from '@/types'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [nombre, setNombre]     = useState('')
  const [rubro, setRubro]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  async function fetchEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('nombre')
    if (data) setEmpresas(data)
  }

  useEffect(() => { fetchEmpresas() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setLoading(true)

    const { error } = await supabase.from('empresas').insert({ nombre: nombre.trim(), rubro: rubro.trim() || null })

    if (!error) {
      setNombre('')
      setRubro('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchEmpresas()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <p className="text-gray-500 mt-1">Gestioná las organizaciones en la plataforma.</p>
      </div>

      {/* Formulario */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Nueva empresa</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="traza-label">Nombre *</label>
            <input
              className="traza-input"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre de la empresa"
              required
            />
          </div>
          <div>
            <label className="traza-label">Rubro</label>
            <input
              className="traza-input"
              value={rubro}
              onChange={e => setRubro(e.target.value)}
              placeholder="Tecnología, Retail, Hotelería..."
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={loading}>Guardar empresa</Button>
            {success && <p className="text-green-600 text-sm">Empresa guardada correctamente</p>}
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="traza-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Empresas registradas</h2>
        </div>
        {empresas.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p>Todavía no hay empresas registradas.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Empresa</th>
                <th className="px-6 py-3 text-left">Rubro</th>
                <th className="px-6 py-3 text-left">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empresas.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{emp.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{emp.rubro ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(emp.created_at).toLocaleDateString('es-AR')}
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
