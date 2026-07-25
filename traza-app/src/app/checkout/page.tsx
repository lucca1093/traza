'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check, Shield, Lock } from 'lucide-react'

const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const D       = "'Plus Jakarta Sans', system-ui, sans-serif"

// Precios en ARS (se muestran en la UI; el backend los toma de env vars)
const PLAN_INFO = {
  pro: {
    name: 'Plan Pro',
    monthly: { label: 'Mensual', ars: 15000, ahorro: null },
    annual:  { label: 'Anual',   ars: 11250, ahorro: 25 },
    features: [
      'Hasta 100 usuarios',
      'Objetivos ilimitados',
      'Dashboard de equipo en tiempo real',
      'Análisis con IA (30 créditos/mes)',
      'Reportes automáticos y exportación',
      'Reuniones 1:1 con registro de acuerdos',
      'Soporte prioritario en español',
    ],
  },
}

function CheckoutForm() {
  const params = useSearchParams()
  const plan   = (params.get('plan')   ?? 'pro') as keyof typeof PLAN_INFO
  const period = (params.get('period') ?? 'annual') as 'monthly' | 'annual'

  const info      = PLAN_INFO[plan]
  const periodoInfo = info[period]
  const [seats,   setSeats]   = useState(5)
  const [email,   setEmail]   = useState('')
  const [empresa, setEmpresa] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const totalMensual = periodoInfo.ars * seats
  const totalFinal   = period === 'annual' ? totalMensual * 12 : totalMensual

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period, empresa, email, seats }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Error al iniciar el pago')
        setLoading(false)
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#1C2B90" />
            <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white" />
            <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white" />
          </svg>
          <span style={{ fontFamily: D, fontSize: 20, fontWeight: 900, color: BRAND, letterSpacing: '-0.025em' }}>traza</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
          <Lock size={13} />
          Pago seguro con MercadoPago
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 1000, margin: '0 auto', padding: '48px 24px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignItems: 'start', boxSizing: 'border-box' }}>

        {/* Left — form */}
        <div>
          <h1 style={{ fontFamily: D, fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 6 }}>
            Contratá {info.name}
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32 }}>
            Completá los datos y pagá con MercadoPago. Tu cuenta se activa automáticamente.
          </p>

          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre de la empresa</label>
              <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
                placeholder="Ej: Grupo Meridian S.A." required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email del administrador</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vos@empresa.com" required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Cantidad de usuarios</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setSeats(s => Math.max(1, s - 1))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 18, cursor: 'pointer' }}>−</button>
                <span style={{ fontFamily: D, fontSize: 22, fontWeight: 800, color: '#0F172A', minWidth: 32, textAlign: 'center' }}>{seats}</span>
                <button type="button" onClick={() => setSeats(s => Math.min(100, s + 1))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 18, cursor: 'pointer' }}>+</button>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>usuarios (máx. 100)</span>
              </div>
            </div>

            {/* Period toggle */}
            <div style={{ display: 'flex', gap: 10 }}>
              {(['annual', 'monthly'] as const).map(p => (
                <a key={p} href={`/checkout?plan=${plan}&period=${p}`}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${period === p ? PRIMARY : '#E2E8F0'}`, background: period === p ? '#EDEFFD' : 'white', textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: period === p ? PRIMARY : '#374151' }}>
                    {info[p].label}
                    {info[p].ahorro && <span style={{ color: '#16a34a', marginLeft: 6, fontSize: 11 }}>-{info[p].ahorro}%</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    ${info[p].ars.toLocaleString('es-AR')} ARS/usuario/mes
                  </div>
                </a>
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? '#94A3B8' : `linear-gradient(135deg,${BRAND},${PRIMARY})`, color: 'white', border: 'none', borderRadius: 12, padding: '15px 24px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Redirigiendo a MercadoPago…' : <>Pagar ${totalFinal.toLocaleString('es-AR')} ARS <ArrowRight size={16} /></>}
            </button>

            <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
              Serás redirigido a MercadoPago. Podés pagar con tarjeta, transferencia o efectivo.
            </p>
          </form>
        </div>

        {/* Right — resumen */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 28, position: 'sticky', top: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.08em', marginBottom: 4 }}>RESUMEN</p>
          <p style={{ fontFamily: D, fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{info.name}</p>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
            Facturación {period === 'annual' ? 'anual' : 'mensual'}
          </p>

          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
              <span>{seats} usuario{seats !== 1 ? 's' : ''} × ${periodoInfo.ars.toLocaleString('es-AR')}/mes</span>
              <span>${totalMensual.toLocaleString('es-AR')}/mes</span>
            </div>
            {period === 'annual' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                <span>Descuento anual (-25%)</span>
                <span>-${(seats * 15000 * 12 * 0.25).toLocaleString('es-AR')}/año</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: D, fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>
            <span>Total {period === 'annual' ? 'anual' : 'mensual'}</span>
            <span>${totalFinal.toLocaleString('es-AR')} ARS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {info.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} color="#94A3B8" />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Cancelación sin penalidad en cualquier momento</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense><CheckoutForm /></Suspense>
}
