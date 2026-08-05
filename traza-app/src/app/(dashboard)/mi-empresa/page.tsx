'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Building2, Users, Target, Upload, X, CheckCircle2, ImageIcon, CreditCard, AlertTriangle } from 'lucide-react'

const TAMANOS = [
  { value: '1-10',    label: '1–10 personas' },
  { value: '11-50',   label: '11–50 personas' },
  { value: '51-200',  label: '51–200 personas' },
  { value: '201-500', label: '201–500 personas' },
  { value: '500+',    label: 'Más de 500' },
]

export default function MiEmpresaPage() {
  const [empresa,    setEmpresa]    = useState<any>(null)
  const [empresaId,  setEmpresaId]  = useState('')
  const [stats,      setStats]      = useState({ activos: 0, total: 0, objetivos: 0 })
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [logoUrl,    setLogoUrl]    = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError,  setLogoError]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      const eId = profile.empresa_id
      setEmpresaId(eId)

      const { data: emp } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', eId)
        .single()

      if (emp) {
        setEmpresa(emp)
        setLogoUrl(emp.logo_url ?? null)
        setForm({ nombre: emp.nombre ?? '', rubro: emp.rubro ?? '', tamano: emp.tamano ?? '' })
      }

      const { count: total } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', eId)

      const { count: activos } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', eId)
        .eq('empleo_activo', true)

      const { count: objetivos } = await supabase
        .from('objetivos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', eId)

      setStats({ total: total ?? 0, activos: activos ?? 0, objetivos: objetivos ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !empresaId) return

    setLogoError(null)

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('El archivo no puede superar los 2 MB.')
      return
    }

    setLogoUploading(true)
    const ext      = file.name.split('.').pop()
    const path     = `${empresaId}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setLogoError('Error al subir la imagen. Intentá de nuevo.')
      setLogoUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}` // cache-bust

    await supabase.from('empresas').update({ logo_url: publicUrl }).eq('id', empresaId)
    setLogoUrl(publicUrl)
    setLogoUploading(false)
  }

  async function handleRemoveLogo() {
    if (!empresaId || !logoUrl) return
    await supabase.from('empresas').update({ logo_url: null }).eq('id', empresaId)
    setLogoUrl(null)
  }

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
          <p className="traza-page-sub">Editá los datos y el logo de tu organización en Traza.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="traza-card p-4 text-center">
          <Users size={15} className="text-traza-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
          <p className="text-xs text-gray-400 mt-0.5">Personas activas</p>
        </div>
        <div className="traza-card p-4 text-center">
          <Building2 size={15} className="text-traza-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total historial</p>
        </div>
        <div className="traza-card p-4 text-center">
          <Target size={15} className="text-traza-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">{stats.objetivos}</p>
          <p className="text-xs text-gray-400 mt-0.5">Objetivos creados</p>
        </div>
      </div>

      {/* Logo */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Logo de la empresa</h2>
        <p className="text-sm text-gray-400 mb-5">PNG, JPG o WebP · máximo 2 MB</p>

        <div className="flex items-center gap-5">
          {/* Preview */}
          <div
            className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ borderColor: logoUrl ? 'transparent' : '#E2E8F0', backgroundColor: logoUrl ? 'transparent' : '#F8FAFC' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo empresa" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={24} className="text-gray-300" />
            )}
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {logoUploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={12} /> Quitar logo
              </button>
            )}
            {logoError && <p className="text-xs text-red-500">{logoError}</p>}
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Datos de la empresa</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="traza-label">Nombre *</label>
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
                <CheckCircle2 size={15} /> Guardado
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Plan y plazas */}
      <div className="traza-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={16} className="text-traza-500" />
          <h2 className="text-base font-semibold text-gray-900">Plan y plazas</h2>
        </div>

        {/* Plan badge */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-gray-500">Plan actual</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: '#EEF2FF', color: '#3350D0' }}>
            {empresa.plan ?? 'Starter'}
          </span>
        </div>

        {/* Barra de plazas */}
        {(() => {
          const max   = empresa.max_plazas ?? 10
          const usado = stats.activos
          const pct   = Math.min(100, Math.round((usado / max) * 100))
          const critico = pct >= 90
          const advertencia = pct >= 70 && !critico
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Plazas utilizadas</span>
                <span className="font-semibold" style={{ color: critico ? '#dc2626' : '#0F172A' }}>
                  {usado} <span className="font-normal text-gray-400">/ {max}</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: critico ? '#dc2626' : advertencia ? '#d97706' : '#3350D0',
                  }}
                />
              </div>
              {critico && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                  <AlertTriangle size={12} />
                  Llegaste al límite de tu plan. Para agregar más personas, hacé un upgrade.
                </div>
              )}
              {advertencia && (
                <p className="text-xs text-amber-600 mt-1">
                  Estás usando el {pct}% de tus plazas. Considerá hacer un upgrade pronto.
                </p>
              )}
            </div>
          )
        })()}

        {/* Límites del plan */}
        <div className="mt-5 pt-4 border-t border-gray-50 space-y-2 text-sm">
          {[
            { label: 'Personas activas', val: `hasta ${empresa.max_plazas ?? 10}` },
            { label: 'Supervisores', val: 'ilimitados' },
            { label: 'Exportación PDF', val: 'incluida' },
            { label: 'Análisis con IA', val: (empresa.plan ?? 'starter') === 'starter' ? '30/mes por usuario' : 'ilimitado' },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-gray-400">{row.label}</span>
              <span className="font-medium text-gray-700">{row.val}</span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}
            onClick={() => alert('Próximamente: gestión de plan desde el portal de billing.')}
          >
            Gestionar plan →
          </button>
        </div>
      </div>

      {/* Info de cuenta */}
      <div className="traza-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información de cuenta</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Empresa creada el</span>
            <span className="font-medium text-gray-900">
              {new Date(empresa.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">ID interno</span>
            <span className="font-mono text-xs text-gray-400">{empresa.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
