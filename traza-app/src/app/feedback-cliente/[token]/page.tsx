'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle2, AlertCircle } from 'lucide-react'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={36}
            fill={(hover || value) >= n ? '#F59E0B' : 'none'}
            stroke={(hover || value) >= n ? '#F59E0B' : '#CBD5E1'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

const ETIQUETAS: Record<number, string> = {
  1: 'No cumplió mis expectativas',
  2: 'Parcialmente satisfecho',
  3: 'Bueno, cumplió lo esperado',
  4: 'Muy bueno, superó expectativas',
  5: 'Excelente, trabajo destacado',
}

function FeedbackContent() {
  const params = useParams()
  const token  = params.token as string

  const [loading,    setLoading]    = useState(true)
  const [info,       setInfo]       = useState<{ nombre_cliente: string; objetivo: any; confirmado: boolean } | null>(null)
  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando,   setEnviando]   = useState(false)
  const [enviado,    setEnviado]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/feedback-cliente?token=${token}`)
        const json = await res.json()
        if (json.feedback) setInfo(json.feedback)
        else setError('Link inválido o expirado.')
      } catch {
        setError('No se pudo cargar la información.')
      }
      setLoading(false)
    }
    load()
  }, [token])

  async function handleEnviar() {
    if (!puntuacion) return
    setEnviando(true)
    try {
      const res = await fetch('/api/feedback-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'responder', token, puntuacion, comentario }),
      })
      const json = await res.json()
      if (json.ok) setEnviado(true)
      else setError(json.error ?? 'Error al enviar.')
    } catch {
      setError('Error de red. Intentá de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ backgroundColor: '#F1F5F9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1C2B90' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">traza</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {loading && (
            <div className="py-10 text-center">
              <div className="w-6 h-6 border-2 border-traza-300 border-t-traza-700 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-6">
              <AlertCircle size={28} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {!loading && !error && info?.confirmado && (
            <div className="text-center py-6">
              <CheckCircle2 size={28} className="mx-auto mb-3 text-green-500" />
              <h2 className="font-bold text-gray-900 mb-2">Ya enviaste tu opinión</h2>
              <p className="text-sm text-gray-400">Gracias por tu feedback.</p>
            </div>
          )}

          {!loading && !error && !info?.confirmado && !enviado && info && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hola{info.nombre_cliente ? `, ${info.nombre_cliente}` : ''}.</p>
                <h1 className="text-xl font-black text-gray-900 leading-tight mb-3">¿Qué tal fue el trabajo?</h1>
                <div className="rounded-xl p-3 text-sm text-gray-600 font-medium"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {(info.objetivo as any)?.titulo ?? 'Objetivo'}
                </div>
              </div>

              <div className="space-y-2">
                <StarRating value={puntuacion} onChange={setPuntuacion} />
                {puntuacion > 0 && (
                  <p className="text-center text-xs font-medium" style={{ color: '#F59E0B' }}>
                    {ETIQUETAS[puntuacion]}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Comentario (opcional)</label>
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="¿Querés agregar algo más?"
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

              <button
                onClick={handleEnviar}
                disabled={!puntuacion || enviando}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all"
                style={{ background: !puntuacion || enviando ? '#CBD5E1' : 'linear-gradient(135deg, #1C2B90, #3350D0)' }}
              >
                {enviando ? 'Enviando...' : 'Enviar mi opinión'}
              </button>
            </div>
          )}

          {enviado && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#EDEFFD' }}>
                <CheckCircle2 size={26} style={{ color: '#3350D0' }} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">¡Gracias!</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Tu opinión fue registrada y ayuda a construir un historial profesional verificado.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Powered by{' '}
          <a href="https://traza.app" className="font-semibold" style={{ color: '#3350D0' }}>traza.app</a>
        </p>
      </div>
    </div>
  )
}

export default function FeedbackClientePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>}>
      <FeedbackContent />
    </Suspense>
  )
}
