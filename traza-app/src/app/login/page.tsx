'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Target, CheckSquare, Award } from 'lucide-react'

/* Z-mark — logo de traza */
function TrazaLogoFull({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1C2B90" />
      <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white" />
      <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    await supabase.auth.signOut()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }}>

      {/* ── Panel izquierdo — branding ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Fondo decorativo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'radial-gradient(ellipse at 20% 20%, rgba(51,80,208,0.15) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 80%, rgba(28,43,144,0.20) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
        {/* Grid decorativo sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <TrazaLogoFull size={40} />
          <span
            className="text-white font-extrabold text-2xl tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.025em' }}
          >
            traza
          </span>
        </div>

        {/* Tagline + features */}
        <div className="space-y-8 relative">
          <div>
            <h1
              className="text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.025em' }}
            >
              Desempeño profesional
              <br />
              <span style={{ color: '#8899EE' }}>verificable.</span>
            </h1>
            <p className="text-base mt-4 leading-relaxed" style={{ color: '#475569' }}>
              Registrá objetivos, validá resultados y construí un
              historial profesional basado en evidencia real.
            </p>
          </div>

          {/* Feature chips */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Target size={18} strokeWidth={1.75} />, label: 'Objetivos', sub: 'Trazables' },
              { icon: <CheckSquare size={18} strokeWidth={1.75} />, label: 'Validación', sub: 'Verificable' },
              { icon: <Award size={18} strokeWidth={1.75} />, label: 'Credencial', sub: 'Tu historial' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex justify-center mb-2" style={{ color: '#8899EE' }}>
                  {item.icon}
                </div>
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#334155' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative" style={{ color: '#1E293B' }}>
          traza © 2026 · Performance Intelligence Platform
        </p>
      </div>

      {/* ── Panel derecho — formulario ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <TrazaLogoFull size={32} />
            <span
              className="font-extrabold text-xl"
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                color: '#0F172A',
                letterSpacing: '-0.02em',
              }}
            >
              traza
            </span>
          </div>

          {/* Card del form */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)',
            }}
          >
            <h2
              className="text-2xl font-bold tracking-tight mb-1"
              style={{
                color: '#0F172A',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                letterSpacing: '-0.025em',
              }}
            >
              Bienvenido
            </h2>
            <p className="text-sm mb-7" style={{ color: '#64748B' }}>
              Ingresá con tu cuenta de empresa
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="traza-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="traza-input"
                />
              </div>

              <div>
                <label className="traza-label">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="traza-input"
                />
              </div>

              {error && (
                <div
                  className="text-sm rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: '#FFF1F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Ingresar
              </Button>

              <div className="text-center">
                <a
                  href="/recuperar-contrasena"
                  className="text-xs"
                  style={{ color: '#94A3B8', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3350D0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#94A3B8' }}>
            ¿Necesitás una cuenta?{' '}
            <a href="/registro" className="font-semibold" style={{ color: '#3350D0' }}>
              Registrarse
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
