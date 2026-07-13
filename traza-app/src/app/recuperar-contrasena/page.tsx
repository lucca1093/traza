'use client'

import { useState } from 'react'
import Link from 'next/link'
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

export default function RecuperarContrasenaPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo =
      (process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app') +
      '/nueva-contrasena'

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (err) {
      setError('No pudimos enviar el email. Verificá la dirección ingresada.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
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
          {!enviado ? (
            <>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A', letterSpacing: '-0.02em' }}
              >
                Recuperar contraseña
              </h1>
              <p className="text-sm mb-7" style={{ color: '#64748B' }}>
                Ingresá tu email y te enviamos un link para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="traza-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
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
                  {loading ? 'Enviando…' : 'Enviar link de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#EDEFFD' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3350D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0F172A' }}
              >
                Revisá tu email
              </h2>
              <p className="text-sm" style={{ color: '#64748B', lineHeight: 1.6 }}>
                Si <strong>{email}</strong> tiene una cuenta en TRAZA, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-xs mt-4" style={{ color: '#94A3B8' }}>
                ¿No llegó? Revisá la carpeta de spam.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#94A3B8' }}>
          <Link href="/login" style={{ color: '#3350D0', fontWeight: 600, textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
