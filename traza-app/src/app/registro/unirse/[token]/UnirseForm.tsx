'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function UnirseForm({
  token, empresaNombre, empresaId, emailSugerido,
}: {
  token: string
  empresaNombre: string
  empresaId: string
  emailSugerido: string
}) {
  const router = useRouter()
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [cargo,    setCargo]    = useState('')
  const [email,    setEmail]    = useState(emailSugerido)
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [listo,    setListo]    = useState(false)

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
      // 1. Crear usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre: nombre.trim(), apellido: apellido.trim() } },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email. Intentá con otro o iniciá sesión.'
          : authError.message)
        return
      }

      if (!authData.user) {
        setError('Error creando la cuenta.')
        return
      }

      // 2. Marcar invitación como usada + crear profile vía API
      const res = await fetch('/api/usar-invitacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userId:   authData.user.id,
          empresaId,
          nombre:   nombre.trim(),
          apellido: apellido.trim(),
          cargo:    cargo.trim() || null,
          email:    email.trim(),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        console.error('Error vinculando invitación:', d.error)
        // No bloqueamos el flujo — el usuario fue creado
      }

      setListo(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (listo) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-green-50">
          <CheckCircle2 size={26} className="text-green-500" />
        </div>
        <p className="font-black text-gray-900 text-lg mb-1">¡Bienvenido al equipo!</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Tu cuenta fue creada y quedaste vinculado a <strong className="text-gray-700">{empresaNombre}</strong>.
          Redirigiendo...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="font-black text-gray-900 mb-1">Creá tu cuenta</p>
      <p className="text-xs text-gray-400 mb-5 leading-relaxed">
        Tu cuenta TRAZA te pertenece a vos — si en el futuro cambiás de empresa, tu historial te acompaña.
      </p>

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
          <label className="text-xs text-gray-500">Cargo en la empresa</label>
          <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
            placeholder="Analista, Diseñador, Desarrollador..."
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>

        <div>
          <label className="text-xs text-gray-500">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="vos@empresa.com"
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

      <button type="submit" disabled={loading}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all"
        style={{ backgroundColor: '#0F4C81' }}>
        {loading ? 'Creando cuenta...' : `Unirme a ${empresaNombre}`}
        {!loading && <ChevronRight size={15} />}
      </button>
    </form>
  )
}
