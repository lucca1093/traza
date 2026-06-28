'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function generarTrazaId(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums   = '23456789'
  const parte1 = Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  const parte2 = Array.from({ length: 4 }, () => nums[Math.floor(Math.random() * nums.length)]).join('')
  return `TRZ-${parte1}-${parte2}`
}

export default function RegistroPage() {
  const router = useRouter()

  const [step,     setStep]     = useState<'datos' | 'listo'>('datos')
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [cargo,    setCargo]    = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [trazaId,  setTrazaId]  = useState('')

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
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nombre: nombre.trim(), apellido: apellido.trim() }
        }
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

      // 2. Crear persona individual (sin empresa)
      const nuevoTrazaId = generarTrazaId()
      const { error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id:         authData.user.id,
          nombre:          nombre.trim(),
          apellido:        apellido.trim(),
          cargo:           cargo.trim() || null,
          tipo_cuenta:     'individual',
          empleo_activo:   true,
          traza_id:        nuevoTrazaId,
          credencial_publica: true,
        })

      if (personaError) {
        console.error('Error creando persona:', personaError)
        // No bloqueamos — la persona se puede crear después
      }

      setTrazaId(nuevoTrazaId)
      setStep('listo')
    } catch (err) {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'listo') {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#dbeafe' }}>
              <ShieldCheck size={26} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">¡Tu cuenta está lista!</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Tu TRAZA ID es único y te pertenece para siempre. Guardalo.
            </p>
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 mb-6">
              <p className="text-xs text-blue-400 mb-1">Tu TRAZA ID</p>
              <p className="text-xl font-black text-blue-700 font-mono tracking-widest">{trazaId}</p>
              <p className="text-xs text-blue-400 mt-1">traza.app/p/{trazaId}</p>
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
              style={{ backgroundColor: '#0F4C81' }}>
              Ir a mi espacio
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0F4C81' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">TRAZA</span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-xl font-black text-gray-900 mb-1">Creá tu historial verificado</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Sin empresa, sin invitación. Tu TRAZA ID es tuyo y te sigue en cada trabajo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
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
              <label className="text-xs text-gray-500">Cargo actual</label>
              <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                placeholder="Product Manager, Analista, etc."
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>

            <div>
              <label className="text-xs text-gray-500">Email personal *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vos@gmail.com"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
              <p className="text-xs text-gray-400 mt-1">Usá tu email personal, no el del trabajo.</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Contraseña *</label>
              <div className="relative mt-1">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
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
              style={{ backgroundColor: '#0F4C81' }}>
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta TRAZA'}
              {!loading && <ChevronRight size={15} />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Tu TRAZA ID es permanente y te pertenece a vos. Si en el futuro tu empresa usa TRAZA,
                tu historial se integra automáticamente.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Iniciá sesión</Link>
        </p>

      </div>
    </div>
  )
}
