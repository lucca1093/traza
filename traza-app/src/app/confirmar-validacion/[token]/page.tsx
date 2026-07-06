import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Props {
  params: { token: string }
  searchParams: { estado?: string }
}

export default function ConfirmarValidacionPage({ searchParams }: Props) {
  const estado = searchParams.estado ?? 'ok'

  const config = {
    ok: {
      icon: <CheckCircle2 size={48} className="text-green-500" />,
      titulo: '¡Validación confirmada!',
      descripcion: 'Tu validación quedó registrada y verificada. Gracias por tomarte el tiempo.',
    },
    ya_confirmado: {
      icon: <CheckCircle2 size={48} className="text-blue-400" />,
      titulo: 'Ya confirmada',
      descripcion: 'Esta validación ya fue confirmada anteriormente. No hace falta hacer nada más.',
    },
    invalido: {
      icon: <XCircle size={48} className="text-red-400" />,
      titulo: 'Link inválido',
      descripcion: 'No encontramos una validación asociada a este link. Puede haber expirado o ya no estar disponible.',
    },
    error: {
      icon: <AlertCircle size={48} className="text-amber-400" />,
      titulo: 'Algo salió mal',
      descripcion: 'Hubo un error procesando la confirmación. Intentá de nuevo más tarde.',
    },
  }[estado] ?? {
    icon: <AlertCircle size={48} className="text-gray-400" />,
    titulo: 'Estado desconocido',
    descripcion: '',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full px-8 py-12 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1C2B90' }}>
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="font-semibold text-gray-800 tracking-wide">traza</span>
        </div>

        <div className="flex justify-center mb-5">{config.icon}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{config.titulo}</h1>
        <p className="text-gray-500 text-sm leading-relaxed">{config.descripcion}</p>

        <p className="text-xs text-gray-300 mt-10">Traza · Performance Intelligence</p>
      </div>
    </div>
  )
}
