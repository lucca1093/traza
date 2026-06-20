'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

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
      {/* Panel izquierdo - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-traza-700 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-bold text-2xl">TRAZA</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Desempeño profesional
            <br />
            <span className="text-traza-300">verificable.</span>
          </h1>
          <p className="text-traza-200 text-lg leading-relaxed">
            Registrá objetivos, validá resultados y construí un historial
            profesional basado en evidencia real.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: '🎯', label: 'Objetivos', sub: 'Trazables' },
              { icon: '✅', label: 'Validación', sub: 'Verificable' },
              { icon: '🏆', label: 'Talent Card', sub: 'Tu historial' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-traza-300 text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-traza-400 text-sm">
          TRAZA © 2026 · Performance Intelligence Platform
        </p>
      </div>

      {/* Panel derecho - login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-traza-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-xl text-traza-700">TRAZA</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
            <p className="text-gray-500 mb-8">Ingresá con tu cuenta de empresa</p>

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
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
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
