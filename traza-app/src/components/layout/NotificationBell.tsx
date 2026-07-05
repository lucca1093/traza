'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle2, X } from 'lucide-react'

interface Notificacion {
  id: string
  tipo: string
  mensaje: string
  objetivo_id: string | null
  leida: boolean
  creado_en: string
}

function tiempoRelativo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime()
  const min  = Math.floor(diff / 60000)
  const hs   = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (min < 1)   return 'Ahora'
  if (min < 60)  return `Hace ${min}m`
  if (hs < 24)   return `Hace ${hs}h`
  return `Hace ${dias}d`
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifs, setNotifs]   = useState<Notificacion[]>([])
  const [open, setOpen]       = useState(false)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: persona } = await supabase
        .from('personas')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (!persona) return
      setPersonaId(persona.id)
      await fetchNotifs(persona.id)
    }
    init()
  }, [userId])

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchNotifs(pid: string) {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('persona_id', pid)
      .order('creado_en', { ascending: false })
      .limit(20)
    setNotifs(data ?? [])
  }

  async function marcarLeida(id: string) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  async function marcarTodasLeidas() {
    if (!personaId) return
    await supabase.from('notificaciones').update({ leida: true }).eq('persona_id', personaId).eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (personaId) fetchNotifs(personaId) }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ color: '#64748B' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
      >
        <Bell size={18} strokeWidth={1.75} />
        {noLeidas > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: '#3350D0' }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 rounded-2xl bg-white overflow-hidden"
          style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Notificaciones</p>
              {noLeidas > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md font-bold text-white"
                  style={{ backgroundColor: '#3350D0' }}
                >
                  {noLeidas}
                </span>
              )}
            </div>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs font-medium transition-colors"
                style={{ color: '#3350D0' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1C2B90'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3350D0'}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={20} className="mx-auto mb-2" style={{ color: '#CBD5E1' }} />
                <p className="text-sm" style={{ color: '#94A3B8' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: n.leida ? 'transparent' : 'rgba(51,80,208,0.04)',
                    borderBottom: '1px solid #F8FAFC',
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2
                      size={15}
                      style={{ color: n.leida ? '#CBD5E1' : '#3350D0' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: '#0F172A' }}>{n.mensaje}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{tiempoRelativo(n.creado_en)}</p>
                  </div>
                  {!n.leida && (
                    <button
                      onClick={() => marcarLeida(n.id)}
                      className="flex-shrink-0 mt-0.5 transition-colors"
                      style={{ color: '#CBD5E1' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CBD5E1'}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
