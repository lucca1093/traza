import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 · Página no encontrada · TRAZA',
}

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12">
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#1C2B90" />
          <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white" />
          <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white" />
        </svg>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontWeight: 800, fontSize: 20, color: '#0F172A', letterSpacing: '-0.02em',
        }}>
          TRAZA
        </span>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl px-10 py-12 text-center"
        style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}
      >
        {/* Número 404 */}
        <div className="mb-6">
          <span
            className="text-8xl font-black select-none"
            style={{
              background: 'linear-gradient(135deg, #1C2B90, #3350D0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </span>
        </div>

        {/* Ícono decorativo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3350D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <h1
          className="text-2xl font-black mb-3"
          style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}
        >
          Página no encontrada
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#64748B' }}>
          Esta dirección no existe o fue movida.<br />
          Tu historial profesional sigue intacto.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}
          >
            Ir al dashboard
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ color: '#64748B', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs" style={{ color: '#CBD5E1' }}>
        TRAZA · Tu historial profesional, verificado
      </p>
    </div>
  )
}
