'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'

const OPCIONES = [
  {
    valor: 'De acuerdo',
    label: 'De acuerdo',
    desc: 'El objetivo fue cumplido de manera satisfactoria.',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    valor: 'Parcialmente de acuerdo',
    label: 'Parcialmente de acuerdo',
    desc: 'Se cumplió en parte, con algunos puntos a mejorar.',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    valor: 'En desacuerdo',
    label: 'En desacuerdo',
    desc: 'No se alcanzó el nivel esperado.',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
]

export default function ValidarForm({ token, objetivoTitulo, personaNombre }: { token: string; objetivoTitulo: string; personaNombre?: string }) {
  const [calificacion, setCalificacion] = useState<string>('')
  const [nombre,       setNombre]       = useState('')
  const [email,        setEmail]        = useState('')
  const [cargo,        setCargo]        = useState('')
  const [empresa,      setEmpresa]      = useState('')
  const [comentario,   setComentario]   = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const [enviado,      setEnviado]      = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !calificacion) {
      setError('Completá tu nombre y elegí una calificación.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch(`/api/validar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, cargo, empresa, calificacion, comentario }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar la validación.')
        return
      }
      setEnviado(true)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    const opcion = OPCIONES.find(o => o.valor === calificacion)!
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: opcion.bg }}>
          <CheckCircle2 size={26} style={{ color: opcion.color }} />
        </div>
        <p className="font-bold text-gray-900 mb-2">Validación enviada</p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Tu evaluación quedó registrada en la credencial TRAZA de <strong>{personaNombre ?? objetivoTitulo}</strong>.
          Gracias por tomarte el tiempo.
        </p>
        <div className="mt-6 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: opcion.bg, color: opcion.color }}>
          Tu calificación: {calificacion}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Tu evaluación</p>
        <p className="text-xs text-gray-400">¿Cómo calificás el cumplimiento de este objetivo?</p>
      </div>

      {/* Opciones de calificación */}
      <div className="space-y-2">
        {OPCIONES.map(op => (
          <button key={op.valor} type="button" onClick={() => setCalificacion(op.valor)}
            className="w-full text-left p-3.5 rounded-xl border-2 transition-all"
            style={calificacion === op.valor
              ? { borderColor: op.color, backgroundColor: op.bg }
              : { borderColor: '#e5e7eb', backgroundColor: 'white' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: calificacion === op.valor ? op.color : '#374151' }}>
                  {op.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{op.desc}</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ml-3"
                style={{ borderColor: calificacion === op.valor ? op.color : '#d1d5db',
                  backgroundColor: calificacion === op.valor ? op.color : 'white' }}>
                {calificacion === op.valor && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Comentario */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Comentario <span className="font-normal normal-case">(opcional)</span>
        </label>
        <textarea value={comentario} onChange={e => setComentario(e.target.value)}
          rows={3} placeholder="Podés agregar contexto, observaciones o recomendaciones..."
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tu identificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Nombre completo *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ricardo González"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ricardo@empresa.com"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Cargo / Rol</label>
            <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
              placeholder="Gerente de Sucursal"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Empresa / Organización</label>
            <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
              placeholder="Banco Premier"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <button type="submit" disabled={enviando || !calificacion || !nombre.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
        style={{ backgroundColor: '#0F4C81' }}>
        {enviando ? 'Enviando...' : 'Enviar validación'}
        {!enviando && <ChevronRight size={15} />}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Tu identidad quedará visible en la credencial pública del profesional.
        Este link es de uso único y vence a los 7 días.
      </p>
    </form>
  )
}
