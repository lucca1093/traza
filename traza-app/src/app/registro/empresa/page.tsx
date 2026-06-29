'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Building2, Users, Check,
  Eye, EyeOff, Copy, CheckCheck, ArrowRight, Sparkles,
} from 'lucide-react'

// ─── Datos de industrias ───────────────────────────────────────────────────
const RUBROS = [
  { id: 'tecnologia',    label: 'Tecnología',      emoji: '💻' },
  { id: 'finanzas',      label: 'Finanzas',        emoji: '🏦' },
  { id: 'salud',         label: 'Salud',           emoji: '🏥' },
  { id: 'retail',        label: 'Retail',          emoji: '🛒' },
  { id: 'manufactura',   label: 'Manufactura',     emoji: '🏭' },
  { id: 'construccion',  label: 'Construcción',    emoji: '🏗️' },
  { id: 'educacion',     label: 'Educación',       emoji: '📚' },
  { id: 'logistica',     label: 'Logística',       emoji: '🚚' },
  { id: 'gastronomia',   label: 'Gastronomía',     emoji: '🍽️' },
  { id: 'consultoria',   label: 'Consultoría',     emoji: '⚖️' },
  { id: 'creatividad',   label: 'Creatividad',     emoji: '🎨' },
  { id: 'otro',          label: 'Otro',            emoji: '✦' },
]

const TAMANOS = [
  { id: '1-5',   label: '1–5',    sub: 'Equipo pequeño' },
  { id: '6-20',  label: '6–20',   sub: 'En crecimiento' },
  { id: '21-100', label: '21–100', sub: 'Empresa mediana' },
  { id: '+100',  label: '+100',   sub: 'Gran empresa' },
]

// ─── Componente de barra de progreso ──────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = ['Tu empresa', 'Tu cuenta', 'Tu equipo']
  return (
    <div className="w-full max-w-sm mx-auto mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'text-white' : 'bg-gray-200 text-gray-400'
            }`} style={i === step ? { backgroundColor: '#0F4C81' } : {}}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              i === step ? 'text-gray-900' : i < step ? 'text-green-600' : 'text-gray-400'
            }`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(step / 2) * 100}%`, backgroundColor: '#0F4C81' }} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function RegistroEmpresaPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Paso 1 — Empresa
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [rubro,         setRubro]         = useState('')
  const [tamano,        setTamano]        = useState('')

  // Paso 2 — Admin
  const [nombre,    setNombre]    = useState('')
  const [apellido,  setApellido]  = useState('')
  const [cargo,     setCargo]     = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)

  // Estado global
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [inviteUrl,   setInviteUrl]   = useState('')
  const [copiado,     setCopiado]     = useState(false)
  const [empresaId,   setEmpresaId]   = useState('')

  // ── Paso 1 → 2 ────────────────────────────────────────────────────────
  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!empresaNombre.trim()) { setError('Ingresá el nombre de tu empresa.'); return }
    if (!rubro)                 { setError('Seleccioná el rubro.'); return }
    if (!tamano)                { setError('Seleccioná el tamaño del equipo.'); return }
    setError('')
    setStep(1)
  }

  // ── Paso 2: registrar empresa + admin ─────────────────────────────────
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      setError('Completá todos los campos.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    try {
      // 1. Crear el usuario en Supabase Auth desde el cliente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre: nombre.trim(), apellido: apellido.trim() } },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email.'
          : authError.message)
        return
      }

      if (!authData.user?.id) {
        setError('No se pudo crear la cuenta. El email puede estar en uso — intentá con otro email o esperá unos minutos.')
        return
      }

      // 2. Crear empresa + profile + invite token en el servidor
      const res = await fetch('/api/registro-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaNombre, rubro, tamano,
          nombre, apellido, cargo,
          userId: authData.user.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al registrar.'); return }

      setInviteUrl(data.inviteUrl)
      setEmpresaId(data.empresaId)

      // Sign in explícito (por si email confirmation lo saltea)
      await supabase.auth.signInWithPassword({ email: email.trim(), password })

      setStep(2)
      // Guardar en sessionStorage para el onboarding
      sessionStorage.setItem('traza_onboarding', JSON.stringify({
        empresaNombre,
        empresaId: data.empresaId,
        adminNombre: nombre.trim(),
        inviteUrl: data.inviteUrl,
      }))
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function irAlOnboarding() {
    router.push('/onboarding')
  }

  // ── Iniciales de la empresa ────────────────────────────────────────────
  const iniciales = empresaNombre.trim()
    ? empresaNombre.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : '?'

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f1f5f9' }}>

      {/* Nav */}
      <nav className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0F4C81' }}>
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-black text-gray-900 tracking-tight">TRAZA</span>
          </div>
          <Link href="/empleadores" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">

          <ProgressBar step={step} />

          {/* ══ PASO 0: Empresa ══════════════════════════════════════════ */}
          {step === 0 && (
            <form onSubmit={handleStep1}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

                {/* Preview de empresa */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #0F4C81, #1e6fb5)' }}>
                    {iniciales}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-tight">
                      {empresaNombre.trim() || 'Tu empresa'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rubro ? RUBROS.find(r => r.id === rubro)?.label : 'Seleccioná el rubro'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nombre de la empresa *
                    </label>
                    <input type="text" value={empresaNombre} onChange={e => setEmpresaNombre(e.target.value)}
                      placeholder="Ej: Grupo Meridian S.A."
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>

                  {/* Rubro */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Rubro *
                    </label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {RUBROS.map(r => (
                        <button key={r.id} type="button" onClick={() => setRubro(r.id)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-center transition-all ${
                            rubro === r.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}>
                          <span className="text-lg leading-none">{r.emoji}</span>
                          <span className={`text-xs font-medium leading-tight ${rubro === r.id ? 'text-blue-700' : 'text-gray-600'}`}>
                            {r.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tamaño */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tamaño del equipo *
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {TAMANOS.map(t => (
                        <button key={t.id} type="button" onClick={() => setTamano(t.id)}
                          className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all ${
                            tamano === t.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}>
                          <span className={`text-lg font-black leading-tight ${tamano === t.id ? 'text-blue-700' : 'text-gray-800'}`}>
                            {t.label}
                          </span>
                          <span className="text-xs text-gray-400 mt-0.5">{t.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

                <button type="submit"
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ backgroundColor: '#0F4C81' }}>
                  Siguiente
                  <ChevronRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* ══ PASO 1: Admin ════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleStep2}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

                <div className="mb-5">
                  <p className="font-black text-gray-900 text-base">Creá tu cuenta de admin</p>
                  <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">
                    Esta cuenta administrará <strong className="text-gray-700">{empresaNombre}</strong> en TRAZA.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Nombre *</label>
                      <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                        placeholder="María"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Apellido *</label>
                      <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                        placeholder="González"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Cargo</label>
                    <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                      placeholder="CEO, RRHH, Gerente de Operaciones..."
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="maria@tuempresa.com"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Contraseña *</label>
                    <div className="relative mt-1">
                      <input type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => { setStep(0); setError('') }}
                    className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                    <ChevronLeft size={14} />
                    Atrás
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all"
                    style={{ backgroundColor: '#0F4C81' }}>
                    {loading ? 'Creando empresa...' : 'Crear empresa'}
                    {!loading && <ChevronRight size={15} />}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  Al registrarte aceptás que tus datos se usen para gestionar el rendimiento de tu equipo en TRAZA.
                </p>
              </div>
            </form>
          )}

          {/* ══ PASO 2: Invitar equipo ═══════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Éxito */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #0F4C81, #1e6fb5)' }}>
                  <Sparkles size={22} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  ¡{empresaNombre} está en TRAZA!
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tu empresa está lista. Ahora invitá a tu equipo para empezar a medir el desempeño.
                </p>
              </div>

              {/* Link de invitación */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-blue-600" />
                  <p className="text-sm font-semibold text-gray-900">Link de invitación para tu equipo</p>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  Compartí este link con los miembros de tu equipo. Cada persona que lo use quedará vinculada a <strong>{empresaNombre}</strong>.
                  El link es válido por 30 días y puede usarse múltiples veces.
                </p>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-blue-200 bg-blue-50">
                  <p className="flex-1 text-xs font-mono text-blue-700 truncate">{inviteUrl}</p>
                  <button onClick={copiarLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: copiado ? '#16a34a' : '#0F4C81', color: 'white' }}>
                    {copiado ? <><CheckCheck size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  Podés generar nuevos links desde el panel de administración.
                </p>
              </div>

              {/* CTA principal */}
              <button onClick={irAlOnboarding}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ backgroundColor: '#0F4C81' }}>
                Ir a mi panel
                <ArrowRight size={15} />
              </button>

              <p className="text-center text-xs text-gray-400">
                Podés invitar más personas desde el panel en cualquier momento.
              </p>
            </div>
          )}

          {/* Link de login */}
          {step < 2 && (
            <p className="text-center text-sm text-gray-400 mt-5">
              ¿Ya tenés empresa en TRAZA?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Iniciá sesión</Link>
            </p>
          )}

        </div>
      </div>
    </div>
  )
}
