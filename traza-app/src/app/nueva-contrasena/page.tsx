'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function TrazaLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1C2B90" />
      <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white" />
      <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white" />
    </svg>
  )
}

export default function NuevaContrasenaPage() {
  const router = useRouter()
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [listo,     setListo]     = useState(false)
  const [error,     setError]     = useState('')
  const [sessionOk, setSessionOk] = useState(false)

  // Supabase envía el token de recuperación en el hash de la URL.
  // onAuthStateChange lo intercepta automáticamente y emite PASSWORD_RECOVERY.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionOk(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError('No se pudo actualizar la contraseña. El link puede haber expirado.')
      setLoading(false)
      return
    }

    setListo(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <TrazaLogo />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 800, fontSize: 22, color: '#1C2B90', letterSpacing: '-0.02em',
          }}>
            TRAZA
          </span>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}
        >
          {listo ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A' }}
              >
                Contraseña actualizada
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Tu contraseña se actualizó correctamente. Redirigiendo al inicio de sesión…
              </p>
            </div>
          ) : !sessionOk ? (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#FFF1F2' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A' }}
              >
                Link inválido o expirado
              </h2>
              <p className="text-sm mb-6" style={{ color: '#64748B', lineHeight: 1.6 }}>
                Este link de recuperación no es válido o ya fue utilizado. Solicitá uno nuevo.
              </p>
              <a
                href="/recuperar-contrasena"
                className="text-sm font-semibold"
                style={{ color: '#3350D0' }}
              >
                Solicitar nuevo link
              </a>
            </div>
          ) : (
            <>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A', letterSpacing: '-0.02em' }}
              >
                Nueva contraseña
              </h1>
              <p className="text-sm mb-7" style={{ color: '#64748B' }}>
                Elegí una contraseña segura de al menos 8 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="traza-label">Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="traza-input"
                  />
                </div>

                <div>
                  <label className="traza-label">Repetir contraseña</label>
                  <input
                    type="password"
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    placeholder="Repetí la contraseña"
                    required
                    className="traza-input"
                  />
                </div>

                {error && (
                  <div
                    className="text-sm rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{ backgroundColor: '#3350D0', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
