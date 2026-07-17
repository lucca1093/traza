'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function TrazaLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [ready,     setReady]     = useState(false)

  // Supabase maneja el token automáticamente al cargar la página desde el link del email
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('No pudimos actualizar la contraseña. El link puede haber expirado.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-full max-w-md">

        <div className="flex items-center gap-3 mb-10">
          <TrazaLogo />
          <div>
            <p className="font-extrabold text-slate-900 leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              traza
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Performance Intelligence</p>
          </div>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#dcfce7' }}>
              <span style={{ fontSize: 32 }}>✅</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              ¡Contraseña actualizada!
            </h1>
            <p className="text-slate-500 text-sm">Redirigiendo al dashboard…</p>
          </div>
        ) : !ready ? (
          <div className="text-center">
            <p className="text-slate-500 text-sm">Verificando link…</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Nueva contraseña
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              Elegí una contraseña nueva para tu cuenta de traza.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E2E8F0', backgroundColor: '#fff', color: '#0F172A' }}
                  onFocus={e => (e.target.style.borderColor = '#3350D0')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Repetir contraseña</label>
                <input
                  type="password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Repetí la contraseña"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#E2E8F0', backgroundColor: '#fff', color: '#0F172A' }}
                  onFocus={e => (e.target.style.borderColor = '#3350D0')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password || !password2}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: loading || !password || !password2 ? '#94A3B8' : '#1C2B90', cursor: loading || !password || !password2 ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
