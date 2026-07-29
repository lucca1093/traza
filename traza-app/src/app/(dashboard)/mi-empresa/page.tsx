'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Building2, Users, Calendar, CheckCircle2 } from 'lucide-react'

const TAMANOS = [
  { value: '1-10',    label: '1–10 personas' },
  { value: '11-50',   label: '11–50 personas' },
  { value: '51-200',  label: '51–200 personas' },
  { value: '201-500', label: '201–500 personas' },
  { value: '500+',    label: 'Más de 500' },
]

export default function MiEmpresaPage() {
  const [empresa,  setEmpresa]  = useState<any>(null)
  const [stats,    setStats]    = useState({ personas: 0, activos: 0, objetivos: 0 })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  const [form, setForm] = useState({ nombre: '', rubro: '', tamano: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (!profile?.empresa_id) { setLoading(false); return }

      const { data: emp } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', profile.empresa_id)
        .single()

      if (emp) {
        setEmpresa(emp)
        setForm({ nombre: emp.nombre ?? '', rubro: emp.rubro ?? '', tamano: emp.tamano ?? '' })
      }

      // Stats rápidas
      const { count: totalPersonas } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', profile.empresa_id)

      const { count: activos } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', profile.empresa_id)
        .eq('empleo_activo', true)

      const { count: objetivos } = await supabase
        .from('objetivos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', profile.empresa_id)

      setStats({
        personas:  totalPersonas ?? 0,
        activos:   activos       ?? 0,
        objetivos: objetivos     ?? 0,
      })

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!empresa || !form.nombre.trim()) return
    setSaving(true)

    await supabase
      .from('empresas')
      .update({ nombre: form.nombre.trim(), rubro: form.rubro.trim() || null, tamano: form.tamano || null })
      .eq('id', empresa.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>

  if (!empresa) return (
    <div className="py-16 text-center text-sm text-gray-400">
      No se encontró la empresa asociada a tu cuenta.
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi empresa</h1>
          <p className="traza-page-sub">Datos y configuración de tu organización en Traza.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="traza-card p-4 text-center">
          <div className="flex justify-center mb-1.5">
            <Users size={16} className="text-traza-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
          <p className="text-xs text-gray-400 mt-0.5">Personas activas</p>
        </div>
        <div className="traza-card p-4 text-center">
          <div className="flex justify-center mb-1.5">
            <Building2 size={16} className="text-traza-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.personas}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total en el equipo</p>
        </div>
        <div className="traza-card p-4 text-center">
          <div className="flex justify-center mb-1.5">
            <Calendar size={16} className="text-traza-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.objetivos}</p>
          <p className="text-xs text-gray-400 mt-0.5">Objetivos creados</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Datos de la empresa</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="traza-label">Nombre de la empresa *</label>
            <input
              className="traza-input"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre de la organización"
              required
            />
          </div>
          <div>
            <label className="traza-label">Rubro / Industria</label>
            <input
              className="traza-input"
              value={form.rubro}
              onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))}
              placeholder="Tecnología, Retail, Construcción..."
            />
          </div>
          <div>
            <label className="traza-label">Tamaño del equipo</label>
            <select
              className="traza-input"
              value={form.tamano}
              onChange={e => setForm(f => ({ ...f, tamano: e.target.value }))}
            >
              <option value="">— Seleccioná una opción —</option>
              {TAMANOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" loading={saving}>Guardar cambios</Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 size={15} /> Guardado correctamente
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Info de cuenta */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información de la cuenta</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">Empresa registrada el</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(empresa.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">ID de empresa</span>
            <span className="text-xs font-mono text-gray-400">{empresa.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
