'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CREDS: Record<string, { email: string; password: string }> = {
  profesional: { email: 'demo-pro@traza.app', password: 'TrazaDemo2024!' },
  empleado:    { email: 'demo-emp@traza.app', password: 'TrazaDemo2024!' },
  manager:     { email: 'demo-mgr@traza.app', password: 'TrazaDemo2024!' },
}

const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"
const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'

export default function DemoLoginPage() {
  const router = useRouter()
  const params = useParams()
  const tipo   = params.tipo as string

  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [dots, setDots]     = useState('.')

  // Animación de puntos
  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length < 3 ? d + '.' : '.'), 500)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const creds = CREDS[tipo]
    if (!creds) { router.push('/demo'); return }

    // Guardar rol en sessionStorage ANTES de navegar
    sessionStorage.setItem('demo_role', tipo)
    sessionStorage.setItem('demo_step', '0')

    const login = async () => {
      const supabase = createClient()

      // Cerrar sesión actual si existe
      await supabase.auth.signOut()

      const { error } = await supabase.auth.signInWithPassword(creds)

      if (error) {
        console.error('Demo login error:', error.message)
        setStatus('error')
        return
      }

      // Redirigir al dashboard — DemoTour leerá demo_role de sessionStorage
      router.push('/dashboard')
    }

    login()
  }, [tipo, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#fff', border: '1px solid #FEE2E2', maxWidth: 360 }}
        >
          <p className="text-2xl mb-3">⚠️</p>
          <h2 style={{ fontFamily: DISPLAY, color: '#DC2626', fontWeight: 700, marginBottom: 8 }}>
            No se pudo iniciar el demo
          </h2>
          <p className="text-sm" style={{ color: '#64748B', marginBottom: 20 }}>
            Los usuarios demo no están creados todavía. Ejecutá el SQL en Supabase primero.
          </p>
          <code
            className="block text-xs px-3 py-2 rounded-lg mb-4"
            style={{ backgroundColor: '#F8FAFC', color: '#475569', fontFamily: 'monospace' }}
          >
            supabase/demo_users.sql
          </code>
          <a
            href="/demo"
            style={{ color: PRIMARY, fontSize: 14, fontWeight: 600 }}
          >
            ← Volver al selector
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${BRAND} 0%, ${PRIMARY} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: BRAND }}>TRAZA</span>
      </div>

      {/* Spinner */}
      <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 28 }}>
        <svg viewBox="0 0 64 64" width="64" height="64" style={{ animation: 'spin 1s linear infinite' }}>
          <circle
            cx="32" cy="32" r="28"
            fill="none" stroke="#E2E8F0" strokeWidth="6"
          />
          <circle
            cx="32" cy="32" r="28"
            fill="none" stroke={PRIMARY} strokeWidth="6"
            strokeDasharray="88 88"
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
      </div>

      <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 18, color: '#0F172A', marginBottom: 8 }}>
        Preparando tu demo{dots}
      </p>
      <p style={{ color: '#64748B', fontSize: 14 }}>
        Iniciando sesión como {
          tipo === 'profesional' ? 'Nicolás Romero' :
          tipo === 'empleado'    ? 'Martín Aguirre' :
                                   'Diego Sánchez'
        }
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
