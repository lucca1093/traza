'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, Circle, ChevronRight, Users, Target,
  Building2, Copy, CheckCheck, ArrowRight, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface Step {
  id:      string
  title:   string
  desc:    string
  icon:    React.ReactNode
  done:    boolean
  cta?:   string
  href?:   string
  action?: () => void
}

export default function OnboardingPage() {
  const router = useRouter()
  const [empresaNombre, setEmpresaNombre]   = useState('')
  const [adminNombre,   setAdminNombre]     = useState('')
  const [inviteUrl,     setInviteUrl]       = useState('')
  const [copiado,       setCopiado]         = useState(false)
  const [loading,       setLoading]         = useState(true)
  const [hasTeam,       setHasTeam]         = useState(false)
  const [hasObjetivo,   setHasObjetivo]     = useState(false)
  const [empresaId,     setEmpresaId]       = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Perfil + empresa
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido, empresa_id, empresas(nombre)')
        .eq('id', user.id)
        .single()

      if (!profile?.empresa_id) { router.push('/dashboard'); return }

      const emp = (profile as any).empresas
      setEmpresaNombre(emp?.nombre ?? '')
      setAdminNombre(profile.nombre ?? '')
      setEmpresaId(profile.empresa_id)

      // Buscar si hay equipo (más de 1 persona)
      const { count: teamCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', profile.empresa_id)

      setHasTeam((teamCount ?? 0) > 1)

      // Buscar si hay al menos un objetivo
      const { count: objCount } = await supabase
        .from('objetivos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', profile.empresa_id)

      setHasObjetivo((objCount ?? 0) > 0)

      // Buscar link de invitación vigente
      const { data: inv } = await supabase
        .from('invitaciones')
        .select('token')
        .eq('empresa_id', profile.empresa_id)
        .eq('usado', false)
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (inv?.token) {
        const base = window.location.origin
        setInviteUrl(`${base}/registro/unirse/${inv.token}`)
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function copiarLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function generarNuevoLink() {
    const res = await fetch('/api/crear-invitacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresaId, rol: 'empleado' }),
    })
    const data = await res.json()
    if (data.url) setInviteUrl(data.url)
  }

  const completados = [true, hasTeam, hasObjetivo].filter(Boolean).length
  const pct = Math.round((completados / 3) * 100)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  const steps: Step[] = [
    {
      id:    'empresa',
      title: 'Empresa creada',
      desc:  `${empresaNombre} ya está registrada en TRAZA. Tu cuenta de administrador está activa.`,
      icon:  <Building2 size={18} />,
      done:  true,
    },
    {
      id:     'equipo',
      title:  'Invitá a tu equipo',
      desc:   hasTeam
        ? 'Tu equipo ya tiene miembros. Podés seguir agregando personas en cualquier momento.'
        : 'Compartí el link de invitación para que tu equipo pueda registrarse y empezar a cargar sus objetivos.',
      icon:   <Users size={18} />,
      done:   hasTeam,
      cta:    hasTeam ? 'Ver equipo' : undefined,
      href:   hasTeam ? '/dashboard' : undefined,
    },
    {
      id:    'objetivo',
      title: 'Asigná el primer objetivo',
      desc:  hasObjetivo
        ? 'Ya hay objetivos cargados en tu empresa. El equipo puede empezar a registrar avances.'
        : 'Asigná un objetivo a alguien de tu equipo para empezar a medir el desempeño.',
      icon:  <Target size={18} />,
      done:  hasObjetivo,
      cta:   'Ir a Objetivos',
      href:  '/objetivos',
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>

      {/* Nav */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0F4C81' }}>
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-black text-gray-900 tracking-tight">TRAZA</span>
          </div>
          <Link href="/dashboard"
            className="text-sm font-medium px-4 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Ir al dashboard →
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl"
              style={{ background: 'linear-gradient(135deg, #0F4C81, #1e6fb5)' }}>
              {empresaNombre[0]?.toUpperCase() ?? 'E'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Bienvenido</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">
                Hola, {adminNombre} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{empresaNombre}</strong> ya está en TRAZA. Completá los primeros pasos para activar al máximo el equipo.
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Configuración inicial</span>
              <span className="text-xs font-black" style={{ color: '#0F4C81' }}>{pct}% completo</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0F4C81, #1e6fb5)' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{completados} de 3 pasos completados</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {steps.map((s, idx) => (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
              s.done ? 'border-green-100' : 'border-gray-100'
            }`}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {/* Ícono de estado */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    s.done ? 'bg-green-50 text-green-500' : 'text-white'
                  }`} style={!s.done ? { backgroundColor: '#0F4C81' } : {}}>
                    {s.done ? <CheckCircle2 size={18} /> : s.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${s.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {s.title}
                      </p>
                      {s.done && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">✓ Listo</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                {/* Acción de invitación (paso 2 sin equipo) */}
                {s.id === 'equipo' && !hasTeam && (
                  <div className="mt-4 ml-12">
                    {inviteUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-blue-200 bg-blue-50">
                          <p className="flex-1 text-xs font-mono text-blue-700 truncate">{inviteUrl}</p>
                          <button onClick={copiarLink}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                            style={{ backgroundColor: copiado ? '#16a34a' : '#0F4C81', color: 'white' }}>
                            {copiado ? <><CheckCheck size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">
                          Compartí este link por WhatsApp, Slack, email o como prefieras.
                          Válido por 30 días.
                        </p>
                      </div>
                    ) : (
                      <button onClick={generarNuevoLink}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                        Generar link de invitación
                      </button>
                    )}
                  </div>
                )}

                {/* CTA para objetivos */}
                {s.cta && s.href && (
                  <div className="mt-3 ml-12">
                    <Link href={s.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                      style={{ backgroundColor: s.done ? '#f0fdf4' : '#eff6ff', color: s.done ? '#16a34a' : '#0F4C81' }}>
                      {s.cta}
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-1">¿Todo listo para empezar?</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Podés volver a esta pantalla en cualquier momento desde el menú de tu empresa.
          </p>
          <Link href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all"
            style={{ backgroundColor: '#0F4C81' }}>
            Ir al dashboard
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </div>
  )
}
