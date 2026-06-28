'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcularRacha } from '@/lib/traza'
import { Flame, Target, CheckCircle2, ChevronRight, Plus, TrendingUp, MessageSquare, Link2, Paperclip } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function getLunes(d = new Date()): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(d)
  lunes.setDate(d.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getSaludo(nombre: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Buenos días, ${nombre}`
  if (h < 19) return `Buenas tardes, ${nombre}`
  return `Buenas noches, ${nombre}`
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS_LARGO = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const MOODS = [
  { val: 1, emoji: '😔', label: 'Difícil',  bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  { val: 2, emoji: '😐', label: 'Regular',  bg: '#fff7ed', border: '#fdba74', text: '#92400e' },
  { val: 3, emoji: '🙂', label: 'Bien',     bg: '#fefce8', border: '#fde047', text: '#713f12' },
  { val: 4, emoji: '😊', label: 'Muy bien', bg: '#f0fdf4', border: '#86efac', text: '#14532d' },
  { val: 5, emoji: '🚀', label: 'Genial',   bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a' },
]

// ── Componente ────────────────────────────────────────────────
export default function MiSemanaPage() {
  const router = useRouter()
  const hoy     = new Date()
  const hoyISO  = isoDate(hoy)
  const lunes   = getLunes(hoy)
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6)
  const lunesISO   = isoDate(lunes)
  const domingoISO = isoDate(domingo)

  const [loading, setLoading]         = useState(true)
  const [nombre, setNombre]           = useState('')
  const [personaId, setPersonaId]     = useState<string | null>(null)
  const [avances, setAvances]         = useState<any[]>([])
  const [objetivos, setObjetivos]     = useState<any[]>([])
  const [moodHoy, setMoodHoy]         = useState<number | null>(null)
  const [savingMood, setSavingMood]   = useState(false)
  const [racha, setRacha]             = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('nombre, apellido').eq('id', user.id).single()
      setNombre(profile?.nombre ?? 'vos')

      // Buscar persona activa
      const { data: persona } = await supabase
        .from('personas').select('id').eq('user_id', user.id).eq('empleo_activo', true).single()

      if (!persona) { setLoading(false); return }
      setPersonaId(persona.id)

      // Objetivos del empleado
      const { data: obs } = await supabase
        .from('objetivos').select('*').eq('persona_id', persona.id)
      setObjetivos(obs ?? [])

      // Todos los avances (para racha)
      const allObs = obs ?? []
      let todosAvances: any[] = []
      if (allObs.length > 0) {
        const { data: av } = await supabase
          .from('objetivo_avances').select('*')
          .in('objetivo_id', allObs.map((o: any) => o.id))
          .order('creado_en', { ascending: false })
        todosAvances = av ?? []
      }
      setAvances(todosAvances)
      setRacha(calcularRacha(todosAvances))

      // Mood de hoy
      const { data: mood } = await supabase
        .from('mood_checks').select('mood')
        .eq('persona_id', persona.id).eq('fecha', hoyISO).single()
      setMoodHoy(mood?.mood ?? null)

      setLoading(false)
    }
    load()
  }, [])

  async function guardarMood(val: number) {
    if (!personaId || savingMood) return
    setSavingMood(true)
    await supabase.from('mood_checks').upsert(
      { persona_id: personaId, fecha: hoyISO, mood: val },
      { onConflict: 'persona_id,fecha' }
    )
    setMoodHoy(val)
    setSavingMood(false)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  // ── Datos derivados ───────────────────────────────────────
  const obsSemana = objetivos.filter(o =>
    o.fecha_limite && o.fecha_limite >= lunesISO && o.fecha_limite <= domingoISO
  )
  const obsSemanaCompletados = obsSemana.filter(o => o.estado === 'Completado').length
  const obsVencidos = objetivos.filter(o =>
    o.fecha_limite && o.fecha_limite < hoyISO && o.estado !== 'Completado' && !o.es_continuo
  )
  const avancesSemana = avances.filter(a => {
    const f = (a.creado_en ?? '').split('T')[0]
    return f >= lunesISO && f <= domingoISO
  })

  // Últimas 8 semanas para visualización de streak
  const ultimasOchoSemanas = Array.from({ length: 8 }, (_, i) => {
    const l = new Date(lunes)
    l.setDate(lunes.getDate() - (7 - i) * 7)
    const d = new Date(l); d.setDate(l.getDate() + 6)
    const lunesS = isoDate(l)
    const domS   = isoDate(d)
    const tieneActividad = avances.some(a => {
      const f = (a.creado_en ?? '').split('T')[0]
      return f >= lunesS && f <= domS
    })
    return { lunesISO: lunesS, esActual: lunesS === lunesISO, tieneActividad }
  })

  const moodActual = MOODS.find(m => m.val === moodHoy)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          {DIAS_LARGO[hoy.getDay()]} {hoy.getDate()} de {MESES[hoy.getMonth()]} · Semana del {lunes.getDate()} al {domingo.getDate()}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{getSaludo(nombre)} 👋</h1>
        <p className="text-gray-500 mt-1">Este es tu resumen de la semana.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {/* Racha */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${racha > 0 ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${racha > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <Flame size={18} className={racha > 0 ? 'text-orange-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${racha > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{racha}</p>
            <p className="text-xs text-gray-500">semanas seguidas</p>
          </div>
        </div>

        {/* Objetivos esta semana */}
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-blue-50 border border-blue-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
            <Target size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{obsSemanaCompletados}<span className="text-base font-normal text-blue-400">/{obsSemana.length}</span></p>
            <p className="text-xs text-gray-500">vencen esta semana</p>
          </div>
        </div>

        {/* Avances esta semana */}
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-green-50 border border-green-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-100">
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{avancesSemana.length}</p>
            <p className="text-xs text-gray-500">avances esta semana</p>
          </div>
        </div>
      </div>

      {/* Mood check */}
      <div className="traza-card p-6">
        {moodHoy === null ? (
          <>
            <p className="font-semibold text-gray-900 mb-1">¿Cómo arrancás la semana?</p>
            <p className="text-sm text-gray-400 mb-4">Tu respuesta es solo para vos — te ayuda a ver tendencias con el tiempo.</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button key={m.val} onClick={() => guardarMood(m.val)} disabled={savingMood}
                  className="flex-1 min-w-[80px] flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all hover:scale-105 disabled:opacity-50"
                  style={{ borderColor: m.border, backgroundColor: m.bg }}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: m.text }}>{m.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: moodActual?.bg }}>
              {moodActual?.emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Mood de hoy: <span style={{ color: moodActual?.text }}>{moodActual?.label}</span></p>
              <p className="text-sm text-gray-400">Registrado · {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button onClick={() => setMoodHoy(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Alerta vencidos */}
      {obsVencidos.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border border-red-200 bg-red-50">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium text-red-700">
            Tenés <strong>{obsVencidos.length} objetivo{obsVencidos.length > 1 ? 's' : ''} vencido{obsVencidos.length > 1 ? 's' : ''}</strong> sin completar.{' '}
            <button onClick={() => router.push('/mi-trabajo')} className="underline">Ver en Mi Trabajo</button>
          </p>
        </div>
      )}

      {/* Objetivos de la semana */}
      <div className="traza-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Objetivos que vencen esta semana</h2>
          <button onClick={() => router.push('/mi-trabajo')}
            className="text-sm text-traza-700 flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        {obsSemana.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Ningún objetivo vence esta semana.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {obsSemana.map(o => {
              const completado = o.estado === 'Completado'
              const hoyDia = o.fecha_limite === hoyISO
              return (
                <div key={o.id}
                  onClick={() => router.push(`/mi-trabajo?objetivo=${o.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${completado ? 'bg-green-400' : hoyDia ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium leading-tight ${completado ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {o.titulo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {hoyDia ? 'Vence hoy' : `Vence el ${new Date(o.fecha_limite + 'T12:00:00').getDate()} de ${MESES[new Date(o.fecha_limite + 'T12:00:00').getMonth()]}`}
                      {' · '}{o.prioridad}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    completado ? 'bg-green-100 text-green-700' :
                    o.estado === 'En progreso' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{o.estado}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Avances recientes de la semana */}
      <div className="traza-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Mis avances esta semana</h2>
          <button onClick={() => router.push('/mi-trabajo')}
            className="text-sm text-traza-700 flex items-center gap-1 hover:underline">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {avancesSemana.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">Todavía no registraste avances esta semana.</p>
            <button onClick={() => router.push('/mi-trabajo')}
              className="traza-button-primary text-sm px-4 py-2">
              Registrar primer avance
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {avancesSemana.slice(0, 5).map(a => {
              const obj = objetivos.find(o => o.id === a.objetivo_id)
              const rev = a.estado_revision ?? 'sin_revisar'
              const revDot: Record<string, string> = {
                sin_revisar: '#d1d5db',
                visto:       '#2563eb',
                aprobado:    '#16a34a',
              }
              const revLabel: Record<string, string> = {
                sin_revisar: 'Sin revisar',
                visto:       'Visto',
                aprobado:    'Aprobado',
              }
              return (
                <div key={a.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-start gap-2.5">
                  {/* Icono tipo */}
                  <span className="mt-0.5 flex-shrink-0">
                    {a.tipo === 'comentario' && <MessageSquare size={13} className="text-gray-400" />}
                    {a.tipo === 'link'       && <Link2 size={13} className="text-traza-500" />}
                    {a.tipo === 'archivo'    && <Paperclip size={13} className="text-orange-400" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {obj && <p className="text-xs text-gray-400 font-medium truncate mb-0.5">{obj.titulo}</p>}
                    {(a.tipo === 'link' || a.tipo === 'archivo') ? (
                      <a href={a.contenido} target="_blank" rel="noopener noreferrer"
                        className="text-traza-700 hover:underline break-all text-xs">{a.contenido}</a>
                    ) : (
                      <p className="text-sm text-gray-700 leading-snug">{a.contenido}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.creado_en).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Estado revisión */}
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: revDot[rev] }} />
                    <span className="text-xs" style={{ color: revDot[rev] }}>{revLabel[rev]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Visualización racha — últimas 8 semanas */}
      <div className="traza-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900">Actividad semanal</h2>
          {racha > 0 && (
            <span className="ml-auto text-sm font-semibold text-orange-600">
              🔥 {racha} sem. seguida{racha > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          {ultimasOchoSemanas.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full rounded-lg transition-all ${
                s.esActual
                  ? s.tieneActividad
                    ? 'bg-orange-400 h-10'
                    : 'bg-gray-200 h-6 border-2 border-dashed border-gray-300'
                  : s.tieneActividad
                    ? 'bg-orange-300 h-8'
                    : 'bg-gray-100 h-4'
              }`} />
              <span className="text-xs text-gray-400">
                {s.esActual ? 'Ahora' : (() => {
                  const d = new Date(s.lunesISO + 'T12:00:00')
                  return `${d.getDate()}/${d.getMonth() + 1}`
                })()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-300 inline-block"/> Con actividad</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block"/> Sin actividad</span>
        </div>
      </div>
    </div>
  )
}
