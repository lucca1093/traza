'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const BRAND   = '#1C2B90'
const PRIMARY = '#3350D0'
const D       = "'Plus Jakarta Sans', system-ui, sans-serif"

function PagoExitosoContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        {/* Ícono */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={36} color="#16a34a" />
        </div>

        <h1 style={{ fontFamily: D, fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 10 }}>
          ¡Pago confirmado!
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>
          Tu suscripción a TRAZA Pro está activa. En los próximos minutos vas a recibir un email con los datos de acceso para configurar tu equipo.
        </p>

        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 20px', marginBottom: 32, textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, letterSpacing: '0.08em', marginBottom: 8 }}>PRÓXIMOS PASOS</p>
          {[
            'Revisá tu email — te mandamos los datos de acceso',
            'Creá tu cuenta de administrador',
            'Invitá a tu equipo desde el panel de administración',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: PRIMARY, color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: '#374151' }}>{step}</span>
            </div>
          ))}
        </div>

        <Link href="/registro/empresa"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: `linear-gradient(135deg,${BRAND},${PRIMARY})`, color: 'white', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Crear mi cuenta ahora <ArrowRight size={15} />
        </Link>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 16 }}>
          ¿Problemas? Escribinos a <a href="mailto:hola@traza.ar" style={{ color: PRIMARY }}>hola@traza.ar</a>
        </p>
      </div>
    </div>
  )
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  )
}
