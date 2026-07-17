'use client'

import { useState } from 'react'
import Link from 'next/link'
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

export default function RecuperarContrasenaPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    })

    setLoading(false)
    if (error) {
      setError('No pudimos procesar tu solicitud. Verificá el email e intentá de nuevo.')
      return
    }
    setSent(true)
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

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Recuperar contraseña
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              Ingresá tu email y te mandamos un link para crear una contraseña nueva.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
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
                disabled={loading || !email}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: loading || !email ? '#94A3B8' : '#1C2B90', cursor: loading || !email ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Enviando…' : 'Mandar link de recuperación'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              <Link href="/login" className="font-semibold" style={{ color: '#3350D0' }}>← Volver al login</Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#dcfce7' }}>
              <span style={{ fontSize: 32 }}>✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Revisá tu email
            </h1>
            <p className="text-slate-500 text-sm mb-2">
              Te mandamos un link a <strong className="text-slate-700">{email}</strong>
            </p>
            <p className="text-slate-400 text-sm mb-8">
              El link expira en 1 hora. Si no lo ves, revisá la carpeta de spam.
            </p>
            <Link href="/login" className="text-sm font-semibold" style={{ color: '#3350D0' }}>← Volver al login</Link>
          </div>
        )}

      </div>
    </div>
  )
}
