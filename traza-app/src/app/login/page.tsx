'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Target, CheckSquare, Award } from 'lucide-react'

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
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding oscuro */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: '#16213E' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#0F4C81' }}
          >
            <span className="text-white font-bold text-lg tracking-tight">T</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">TRAZA</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Desempeño profesional
            <br />
            <span style={{ color: '#60A5FA' }}>verificable.</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#64748B' }}>
            Registrá objetivos, validá resultados y construí un historial
            profesional basado en evidencia real.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              { icon: <Target size={18} strokeWidth={1.75} />, label: 'Objetivos', sub: 'Trazables' },
              { icon: <CheckSquare size={18} strokeWidth={1.75} />, label: 'Validación', sub: 'Verificable' },
              { icon: <Award size={18} strokeWidth={1.75} />, label: 'Credencial', sub: 'Tu historial' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: '#1E3352' }}
              >
                <div className="flex justify-center mb-2" style={{ color: '#60A5FA' }}>{item.icon}</div>
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm" style={{ color: '#334155' }}>
          TRAZA © 2026 · Performance Intelligence Platform
        </p>
      </div>

      {/* Panel derecho — form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#F5F4F0' }}>
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0D1B2A' }}>
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-xl" style={{ color: '#0D1B2A' }}>TRAZA</span>
          </div>

          <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EDEAE4', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#111827' }}>Bienvenido</h2>
            <p className="text-sm mb-8" style={{ color: '#6B7280' }}>Ingresá con tu cuenta de empresa</p>

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
                <div className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Ingresar
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
