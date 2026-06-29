'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, Users, Target, Building2,
  Copy, CheckCheck, ArrowRight, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [adminNombre,   setAdminNombre]   = useState('')
  const [inviteUrl,     setInviteUrl]     = useState('')
  const [copiado,       setCopiado]       = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [empresaId,     setEmpresaId]     = useState('')

  useEffect(() => {
    async function load() {
      // 1. Intentar leer datos del sessionStorage (recién registrado)
      const cached = sessionStorage.getItem('traza_onboarding')
      if (cached) {
        try {
          const d = JSON.parse(cached)
          setEmpresaNombre(d.empresaNombre ?? '')
          setAdminNombre(d.adminNombre ?? '')
          setInviteUrl(d.inviteUrl ?? '')
          setEmpresaId(d.empresaId ?? '')
          setLoading(false)
          return
        } catch {}
      }

      // 2. Fallback: leer de la DB
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido, empresa_id, rol')
        .eq('id', user.id)
        .single()

      if (!profile?.empresa_id) { router.push('/dashboard'); return }

      // Leer empresa
      const { data: emp } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('id', profile.empresa_id)
        .single()

      setEmpresaNombre(emp?.nombre ?? '')
      setAdminNombre(profile.nombre ?? '')
      setEmpresaId(profile.empresa_id)

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
        setInviteUrl(`${window.location.origin}/registro/unirse/${inv.token}`)
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
    if (data.url) {
      setInviteUrl(data.url)
      // Actualizar cache
      const cached = sessionStorage.getItem('traza_onboarding')
      if (cached) {
        try {
          const d = JSON.parse(cached)
          sessionStorage.setItem('traza_onboarding', JSON.stringify({ ...d, inviteUrl: data.url }))
        } catch {}
      }
    }
  }

  function irAlDashboard() {
    sessionStorage.removeItem('traza_onboarding')
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  const inicialEmpresa = empresaNombre[0]?.toUpperCase() ?? 'E'
  const inicialAdmin   = adminNombre[0]?.toUpperCase() ?? '?'

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
          <button onClick={irAlDashboard}
            className="text-sm font-medium px-4 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Ir al dashboard →
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl"
              style={{ background: 'linear-gradient(135deg, #0F4C81, #1e6fb5)' }}>
              {inicialEmpresa}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Bienvenido</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">
                Hola{adminNombre ? `, ${adminNombre}` : ''} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{empresaNombre}</strong> ya está en TRAZA. Completá los primeros pasos para activar al máximo el equipo.
              </p>
            </div>
          </div>

          {/* Barra de progreso: siempre 33% para empresa nueva */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Configuración inicial</span>
              <span className="text-xs font-black" style={{ color: '#0F4C81' }}>1 de 3 pasos</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: '33%', background: 'linear-gradient(90deg, #0F4C81, #1e6fb5)' }} />
            </div>
          </div>
        </div>

        {/* Paso 1: Empresa ✅ */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50 text-green-500">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-gray-500 line-through">Empresa creada</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">✓ Listo</span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                <strong className="text-gray-600">{empresaNombre}</strong> ya está registrada en TRAZA. Tu cuenta de administrador está activa.
              </p>
            </div>
          </div>
        </div>

        {/* Paso 2: Invitar equipo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ backgroundColor: '#0F4C81' }}>
              <Users size={18} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">Invitá a tu equipo</p>
              <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">
                Compartí este link para que tu equipo se registre vinculado a <strong>{empresaNombre}</strong>. Válido 30 días.
              </p>

              <div className="mt-3">
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
                    <p className="text-xs text-gray-400">Compartí por WhatsApp, Slack o email.</p>
                  </div>
                ) : (
                  <button onClick={generarNuevoLink}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                    Generar link de invitación
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paso 3: Primer objetivo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ backgroundColor: '#0F4C81' }}>
              <Target size={18} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">Asigná el primer objetivo</p>
              <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">
                Una vez que tu equipo esté adentro, asignales objetivos para empezar a medir el desempeño.
              </p>
              <Link href="/objetivos"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                Ir a Objetivos
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button onClick={irAlDashboard}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm"
          style={{ backgroundColor: '#0F4C81' }}>
          Ir al dashboard
          <ArrowRight size={15} />
        </button>

      </div>
    </div>
  )
}
