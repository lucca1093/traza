'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ShieldCheck, ChevronRight, Eye, EyeOff,
  Building2, User, ArrowLeft, Sparkles, Users, Mail,
} from 'lucide-react'
import Link from 'next/link'

// ── Tipos ────────────────────────────────────────────────────────────────────

type Step = 'tipo' | 'empresa_check' | 'invitacion' | 'form' | 'listo'

function generarTrazaId(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums   = '23456789'
  const parte1 = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  const parte2 = Array.from({ length: 4 }, () => nums[Math.floor(Math.random() * nums.length)]).join('')
  return `TRZ-${parte1}-${parte2}`
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function RegistroPage() {
  const router = useRouter()

  const [step,     setStep]     = useState<Step>('tipo')
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [cargo,    setCargo]    = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [trazaId,  setTrazaId]  = useState('')

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre: nombre.trim(), apellido: apellido.trim() } },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email.'
          : authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Error creando la cuenta. Intentá de nuevo.')
        setLoading(false)
        return
      }

      const nuevoTrazaId = generarTrazaId()
      await supabase.from('personas').insert({
        user_id:            authData.user.id,
        nombre:             nombre.trim(),
        apellido:           apellido.trim(),
        cargo:              cargo.trim() || null,
        tipo_cuenta:        'individual',
        empleo_activo:      true,
        traza_id:           nuevoTrazaId,
        credencial_publica: true,
      })

      // Crear fila en profiles para poder acceder al dashboard
      await supabase.from('profiles').upsert({
        id:          authData.user.id,
        nombre:      nombre.trim(),
        apellido:    apellido.trim(),
        cargo:       cargo.trim() || null,
        rol:         'individuo',
        empresa_id:  null,
      }, { onConflict: 'id' })

      setTrazaId(nuevoTrazaId)
      setStep('listo')
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla: Listo ────────────────────────────────────────────────────────

  if (step === 'listo') {
    return (
      <Shell>
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#EDEFFD' }}>
            <ShieldCheck size={26} style={{ color: '#3350D0' }} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">¡Tu cuenta está lista!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Tu TRAZA ID es único y te pertenece para siempre,
            independientemente de dónde trabajes.
          </p>
          <div className="rounded-xl border-2 px-4 py-3 mb-6"
            style={{ borderColor: '#BBC5F7', backgroundColor: '#EDEFFD' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#3350D0' }}>Tu TRAZA ID</p>
            <p className="text-xl font-black font-mono tracking-widest" style={{ color: '#1C2B90' }}>
              {trazaId}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6677CC' }}>traza.app/p/{trazaId}</p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ backgroundColor: '#3350D0' }}>
            Ir a mi espacio
            <ChevronRight size={15} />
          </button>
        </div>
      </Shell>
    )
  }

  // ── Pantalla: Formulario ───────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <Shell>
        <Progreso paso={3} />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <button onClick={() => setStep('empresa_check')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
            <ArrowLeft size={13} /> Volver
          </button>

          <h1 className="text-xl font-black text-gray-900 mb-1">Creá tu historial verificado</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Tu TRAZA ID es tuyo y te sigue en cada trabajo, para siempre.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Nombre *</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="María"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#EDEFFD' } as React.CSSProperties} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Apellido *</label>
                <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                  placeholder="González"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Cargo actual <span className="font-normal text-gray-400">(opcional)</span></label>
              <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                placeholder="Ejecutiva de Cuentas, Analista, etc."
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>

            <div>
              <label className="text-xs text-gray-500">Email personal *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vos@gmail.com"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2" />
              <p className="text-xs text-gray-400 mt-1">Usá tu email personal, no el del trabajo.</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Contraseña *</label>
              <div className="relative mt-1">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#3350D0' }}>
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta TRAZA'}
              {!loading && <ChevronRight size={15} />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2.5">
            <ShieldCheck size={14} style={{ color: '#3350D0' }} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Tu TRAZA ID es permanente y te pertenece. Si tu empresa se suma a TRAZA
              en el futuro, tu historial se integra automáticamente.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#3350D0' }}>
            Iniciá sesión
          </Link>
        </p>
      </Shell>
    )
  }

  // ── Pantalla: ¿Tu empresa usa TRAZA? ──────────────────────────────────────

  if (step === 'empresa_check') {
    return (
      <Shell>
        <Progreso paso={2} />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <button onClick={() => setStep('tipo')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
            <ArrowLeft size={13} /> Volver
          </button>

          <h1 className="text-xl font-black text-gray-900 mb-1">¿Tu empresa usa TRAZA?</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Esto define cómo vas a usar la plataforma.
          </p>

          <div className="space-y-3">
            {/* SÍ */}
            <button onClick={() => setStep('invitacion')}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all group"
              style={{}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EDEFFD' }}>
                  <Building2 size={18} style={{ color: '#3350D0' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Sí, mi empresa ya usa TRAZA</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Me uniré con el link de invitación de mi empresa.
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>

            {/* NO */}
            <button onClick={() => setStep('form')}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#f0fdf4' }}>
                  <User size={18} style={{ color: '#16a34a' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">No / Quiero mi cuenta personal</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Me registro de forma independiente y llevo mi historial conmigo.
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
              <Sparkles size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#6677CC' }} />
              En cualquier caso, tu TRAZA ID es tuyo para siempre. Podés cambiar de empresa
              sin perder tu historial.
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Pantalla: Invitación de empresa ───────────────────────────────────────

  if (step === 'invitacion') {
    return (
      <Shell>
        <Progreso paso={2} />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <button onClick={() => setStep('empresa_check')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
            <ArrowLeft size={13} /> Volver
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#EDEFFD' }}>
              <Mail size={24} style={{ color: '#3350D0' }} />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">Necesitás un link de invitación</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tu empresa te tiene que enviar un link de invitación desde la plataforma TRAZA.
              Pedíselo al área de <strong>RR.HH.</strong> o al administrador de TRAZA de tu organización.
            </p>
          </div>

          <div className="rounded-xl p-4 mb-5 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Users size={12} style={{ color: '#3350D0' }} />
              ¿Qué es el link de invitación?
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Es un link único que te envía tu empresa para unirte a su espacio en TRAZA.
              Tiene el formato: <span className="font-mono text-gray-700">traza.app/registro/unirse/...</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-center text-gray-400">¿Tenés el link?</p>
            <button onClick={() => router.push('/registro/unirse')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
              style={{ backgroundColor: '#3350D0' }}>
              Usar mi link de invitación
              <ChevronRight size={15} />
            </button>
            <button onClick={() => setStep('form')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Registrarme igual como independiente
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Pantalla: Tipo (step 1 / default) ─────────────────────────────────────

  return (
    <Shell>
      <Progreso paso={1} />
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-xl font-black text-gray-900 mb-1">¿Cómo querés usar TRAZA?</h1>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Elegí la opción que mejor describe tu situación.
        </p>

        <div className="space-y-3">

          {/* Profesional */}
          <button onClick={() => setStep('empresa_check')}
            className="w-full text-left p-4 rounded-xl border-2 transition-all group"
            style={{ borderColor: '#3350D0', backgroundColor: '#EDEFFD' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                <User size={20} style={{ color: '#3350D0' }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">Soy profesional</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Quiero gestionar mis objetivos y llevar mi historial de empresa en empresa.
                </p>
              </div>
              <ChevronRight size={16} style={{ color: '#3350D0' }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 pl-14">
              {['Credencial pública', 'Validaciones externas', 'Historial portátil'].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(51,80,208,0.1)', color: '#3350D0' }}>
                  {t}
                </span>
              ))}
            </div>
          </button>

          {/* Empresa */}
          <button onClick={() => router.push('/registro/empresa')}
            className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#f1f5f9' }}>
                <Building2 size={20} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">Represento una empresa</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Quiero sumar a mi equipo y medir el desempeño de toda mi organización.
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 pl-14">
              {['Gestión de equipo', 'Ciclos de evaluación', 'Analytics por área'].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                  {t}
                </span>
              ))}
            </div>
          </button>

        </div>

        {/* Freemium note */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
            <Sparkles size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#BBC5F7' }} />
            La cuenta de profesional es <strong className="text-gray-600">gratuita</strong>.
            Si tu empresa se suma en el futuro, tu historial se vincula automáticamente.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-5">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: '#3350D0' }}>
          Iniciá sesión
        </Link>
      </p>
    </Shell>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ backgroundColor: '#f1f5f9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#1C2B90' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">traza</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function Progreso({ paso }: { paso: number }) {
  const pasos = ['Tipo de cuenta', 'Situación laboral', 'Tus datos']
  return (
    <div className="flex items-center gap-2 mb-5 justify-center">
      {pasos.map((label, i) => {
        const num = i + 1
        const activo = num === paso
        const completo = num < paso
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: completo ? '#16a34a' : activo ? '#3350D0' : '#e5e7eb',
                  color: completo || activo ? 'white' : '#9ca3af',
                }}>
                {completo ? '✓' : num}
              </div>
              <span className="text-xs hidden sm:block"
                style={{ color: activo ? '#1C2B90' : '#9ca3af', fontWeight: activo ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div className="w-6 h-px" style={{ backgroundColor: '#e5e7eb' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
