import { createAdminClient } from '@/lib/supabase-server'
import UnirseForm from './UnirseForm'
import { ShieldCheck, Building2, Clock, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatFecha(dt: string) {
  return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function UnirseTokenPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient()

  const { data: inv } = await admin
    .from('invitaciones')
    .select('*, empresa:empresas(id, nombre, rubro)')
    .eq('token', params.token)
    .single()

  if (!inv) {
    return <PaginaError mensaje="Este link de invitación no existe o ya no es válido." />
  }

  if (inv.usado) {
    return <PaginaError mensaje="Este link ya fue utilizado." sub="Pedile al administrador de tu empresa que genere un nuevo link." />
  }

  if (new Date(inv.expira_en) < new Date()) {
    return <PaginaError mensaje="Este link expiró." sub="Pedile al administrador que genere un nuevo link de invitación." />
  }

  const empresa = (inv as any).empresa
  const diasRestantes = Math.max(0, Math.round(
    (new Date(inv.expira_en).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f1f5f9' }}>

      {/* Nav */}
      <nav className="border-b sticky top-0 z-10" style={{ backgroundColor: 'rgba(10,22,40,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-lg mx-auto px-5 h-13 flex items-center gap-3 py-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3350D0' }}>
            <span className="text-white text-xs font-black">T</span>
          </div>
          <span className="text-white font-black tracking-tight text-sm">TRAZA</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
            Invitación de equipo
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Clock size={10} />
            Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-4">

          {/* Card empresa */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users size={13} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Invitación de equipo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)' }}>
                {empresa?.nombre?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-black text-gray-900 text-base leading-tight">{empresa?.nombre}</p>
                {empresa?.rubro && (
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{empresa.rubro}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-sm text-gray-600 leading-relaxed">
                Fuiste invitado a unirte al equipo de <strong>{empresa?.nombre}</strong> en traza.
                Creá tu cuenta para empezar a registrar tus objetivos y avances.
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                <ShieldCheck size={11} />
                Tu cuenta y historial son tuyos, independientemente de la empresa.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <UnirseForm token={params.token} empresaNombre={empresa?.nombre ?? ''} empresaId={empresa?.id ?? ''} emailSugerido={inv.email ?? ''} />

        </div>
      </div>
    </div>
  )
}

function PaginaError({ mensaje, sub }: { mensaje: string; sub?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-gray-100">
          <ShieldCheck size={24} className="text-gray-300" />
        </div>
        <p className="font-bold text-gray-700 mb-2">{mensaje}</p>
        {sub && <p className="text-sm text-gray-400 leading-relaxed">{sub}</p>}
        <p className="text-xs text-gray-300 mt-8 font-mono">TRAZA · Performance Intelligence</p>
      </div>
    </div>
  )
}
