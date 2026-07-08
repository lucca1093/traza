'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function VerificarContent() {
  const params   = useSearchParams()
  const estado   = params.get('estado')
  const nombre   = params.get('nombre') ?? ''

  const configs: Record<string, { icon: React.ReactNode; title: string; msg: string; color: string; bg: string }> = {
    ok: {
      icon:  <CheckCircle2 size={28} style={{ color: '#16a34a' }} />,
      title: '¡Verificación exitosa!',
      msg:   nombre
        ? `Confirmaste que sos el supervisor de ${nombre} en TRAZA. Sus validaciones ahora tienen mayor peso en su Índice de desempeño.`
        : 'Confirmaste el vínculo laboral exitosamente.',
      color: '#16a34a',
      bg:    '#f0fdf4',
    },
    ya_verificado: {
      icon:  <CheckCircle2 size={28} style={{ color: '#3350D0' }} />,
      title: 'Ya estaba verificado',
      msg:   'Este vínculo laboral ya había sido confirmado anteriormente.',
      color: '#3350D0',
      bg:    '#EDEFFD',
    },
    invalido: {
      icon:  <XCircle size={28} style={{ color: '#dc2626' }} />,
      title: 'Link inválido',
      msg:   'Este link de verificación no existe o ya expiró. Si crees que es un error, pedile a la persona que te reenvíe la solicitud.',
      color: '#dc2626',
      bg:    '#fef2f2',
    },
    error: {
      icon:  <AlertCircle size={28} style={{ color: '#d97706' }} />,
      title: 'Error inesperado',
      msg:   'Hubo un problema procesando tu verificación. Intentá de nuevo en unos minutos.',
      color: '#d97706',
      bg:    '#fffbeb',
    },
  }

  const cfg = configs[estado ?? ''] ?? configs['error']

  return (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ backgroundColor: '#F1F5F9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#1C2B90' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">traza</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: cfg.bg }}>
            {cfg.icon}
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">{cfg.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{cfg.msg}</p>

          {estado === 'ok' && (
            <div className="mt-5 rounded-xl p-3 text-left"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #86efac' }}>
              <p className="text-xs text-green-700 leading-relaxed">
                TRAZA usa esta verificación para proteger la integridad del historial profesional.
                Gracias por confirmar.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          ¿Querés usar TRAZA?{' '}
          <a href="/registro" className="font-medium" style={{ color: '#3350D0' }}>
            Crear una cuenta
          </a>
        </p>
      </div>
    </div>
  )
}

export default function VerificarSupervisorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>}>
      <VerificarContent />
    </Suspense>
  )
}
