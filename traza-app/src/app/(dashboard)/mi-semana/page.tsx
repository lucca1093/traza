'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcularRacha } from '@/lib/traza'
import {
  ChevronLeft, ChevronRight,
  AlertTriangle, Clock, CalendarDays, Activity,
  CheckCircle2, Star, Send, MessageSquare,
} from 'lucide-react'
import { formatFecha } from '@/lib/traza'

// ── Helpers ───────────────────────────────────────────────────
const DIAS_CORTO  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DIAS_LARGO  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function getLunes(d = new Date()): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const l = new Date(d)
  l.setDate(d.getDate() + diff)
  l.setHours(0, 0, 0, 0)
  return l
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getDiasDelMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1).getDay()
  const offset    = primerDia === 0 ? 6 : primerDia - 1
  const totalDias = new Date(year, month + 1, 0).getDate()
  return { offset, totalDias }
}

function estadoColor(estado: string, vencido: boolean) {
  if (vencido)                  return { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' }
  if (estado === 'Completado')  return { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' }
  if (estado === 'En progreso') return { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' }
  return { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' }
}

function formatRelativa(fechaISO: string, hoyISO: string): string {
  const diff = Math.round(
    (new Date(fechaISO + 'T12:00:00').getTime() - new Date(hoyISO + 'T12:00:00').getTime())
    / (1000 * 60 * 60 * 24)
  )
  if (diff === 0)  return 'Hoy'
  if (diff === 1)  return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff < 0)   return `Hace ${Math.abs(diff)} días`
  if (diff < 7)   return `En ${diff} días`
  const d = new Date(fechaISO + 'T12:00:00')
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
}

function getSaludo(nombre: string): string {
  const h = new Date().getHours()
  const momento = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${momento}, ${nombre}`
}

// ── Componente ────────────────────────────────────────────────
export default function MiSemanaPage() {
  const router = useRouter()
  const hoy    = new Date()
  const hoyISO = isoDate(hoy)

  // ── Estado ─────────────────────────────────────────────────
  const [loading, setLoading]     = useState(true)
  const [rol, setRol]             = useState('')
  const [nombre, setNombre]       = useState('')
  const [objetivos, setObjetivos] = useState<any[]>([])
  const [avances, setAvances]     = useState<any[]>([])
  const [personas, setPersonas]   = useState<any[]>([])
  const [filtroPersona, setFiltroPersona] = useState('todos')
  const [racha, setRacha]         = useState(0)
  const [tienePersona, setTienePersona] = useState(false)

  // Evaluación mensual del supervisor
  const [personaId, setPersonaId]       = useState<string | null>(null)
  const [empresaId, setEmpresaId]       = useState<string | null>(null)
  const [mis1on1, setMis1on1]           = useState<any[]>([])
  const [evalYaEnviada, setEvalYaEnviada] = useState(false)
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [savingEval, setSavingEval]     = useState(false)
  const [evalForm, setEvalForm]         = useState({
    calificacion: '' as '' | 'Excelente' | 'Bueno' | 'Regular' | 'Mejorable',
    aspectos:     [] as string[],
    comentario:   '',
  })

  // Calendario
  const [vista, setVista]           = useState<'semana' | 'mes'>('semana')
  const [lunesActual, setLunes]     = useState(getLunes(hoy))
  const [mes, setMes]               = useState(hoy.getMonth())
  const [año, setAño]               = useState(hoy.getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // ── Carga ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('rol, empresa_id, nombre, apellido').eq('id', user.id).single()
      setRol(profile?.rol ?? '')
      setNombre(profile?.nombre ?? 'vos')

      if (profile?.rol === 'empleado') {
        const { data: persona } = await supabase
          .from('personas').select('id').eq('user_id', user.id).eq('empleo_activo', true).single()
        if (persona) {
          setTienePersona(true)
          setPersonaId(persona.id)
          setEmpresaId(profile.empresa_id)
          const { data: obs } = await supabase
            .from('objetivos').select('*').eq('persona_id', persona.id).not('fecha_limite', 'is', null)
          setObjetivos(obs ?? [])
          if ((obs ?? []).length > 0) {
            const { data: av } = await supabase
              .from('objetivo_avances').select('*')
              .in('objetivo_id', (obs ?? []).map((o: any) => o.id))
            setAvances(av ?? [])
            setRacha(calcularRacha(av ?? []))
          }
          // Verificar si ya evaluó al supervisor este mes
          const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`
          const res = await fetch(`/api/evaluar-supervisor?empleadoId=${persona.id}&periodo=${periodoActual}`)
          const resData = await res.json()
          if (resData.evaluacion) setEvalYaEnviada(true)

          // Cargar mis 1:1s
          const res1on1 = await fetch(`/api/1on1?empleadoId=${persona.id}`)
          const data1on1 = await res1on1.json()
          setMis1on1(data1on1.reuniones ?? [])
        }
      } else {
        const { data: obs } = await supabase
          .from('objetivos').select('*, persona:personas(nombre,apellido)')
          .eq('empresa_id', profile?.empresa_id)
          .not('fecha_limite', 'is', null)
          .order('fecha_limite')
        const { data: pers } = await supabase
          .from('personas').select('id, nombre, apellido')
          .eq('empleo_activo', true).eq('empresa_id', profile?.empresa_id).order('apellido')
        setObjetivos(obs ?? [])
        setPersonas(pers ?? [])

        // racha org: avances de todos
        if ((obs ?? []).length > 0) {
          const { data: av } = await supabase
            .from('objetivo_avances').select('creado_en, objetivo_id')
            .in('objetivo_id', (obs ?? []).map((o: any) => o.id))
          setAvances(av ?? [])
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Datos derivados ────────────────────────────────────────
  const obsFiltrados = filtroPersona === 'todos'
    ? objetivos
    : objetivos.filter(o => o.persona_id === filtroPersona)

  const esVencido = (o: any) => o.fecha_limite < hoyISO && o.estado !== 'Completado'

  const en7d  = new Date(hoy); en7d.setDate(hoy.getDate() + 7)
  const en30d = new Date(hoy); en30d.setDate(hoy.getDate() + 30)

  const vencidos   = obsFiltrados.filter(esVencido)
  const estaSemana = obsFiltrados.filter(o => o.fecha_limite >= hoyISO && o.fecha_limite <= isoDate(en7d) && o.estado !== 'Completado')
  const prox30     = obsFiltrados.filter(o => o.fecha_limite > isoDate(en7d) && o.fecha_limite <= isoDate(en30d) && o.estado !== 'Completado')
  const proxLista  = obsFiltrados.filter(o => o.fecha_limite >= hoyISO).sort((a,b) => a.fecha_limite.localeCompare(b.fecha_limite)).slice(0, 8)

  // ── Calendario ─────────────────────────────────────────────
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesActual); d.setDate(lunesActual.getDate() + i); return d
  })
  const domingo    = new Date(lunesActual); domingo.setDate(lunesActual.getDate() + 6)
  const labelSem   = lunesActual.getMonth() === domingo.getMonth()
    ? `${lunesActual.getDate()} – ${domingo.getDate()} de ${MESES[lunesActual.getMonth()]} ${lunesActual.getFullYear()}`
    : `${lunesActual.getDate()} ${MESES[lunesActual.getMonth()]} – ${domingo.getDate()} ${MESES[domingo.getMonth()]} ${domingo.getFullYear()}`

  function prevSem() { setLunes(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n }); setSelectedDay(null) }
  function nextSem() { setLunes(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n }); setSelectedDay(null) }
  function prevMes() { if (mes===0){setMes(11);setAño(a=>a-1)}else setMes(m=>m-1); setSelectedDay(null) }
  function nextMes() { if (mes===11){setMes(0);setAño(a=>a+1)}else setMes(m=>m+1); setSelectedDay(null) }
  function irHoy()   { setLunes(getLunes(hoy)); setMes(hoy.getMonth()); setAño(hoy.getFullYear()); setSelectedDay(null) }

  const { offset, totalDias } = getDiasDelMes(año, mes)

  function obsEnFecha(fechaISO: string) {
    return obsFiltrados.filter(o => o.fecha_limite?.startsWith(fechaISO))
  }

  function reunion1on1EnFecha(fechaISO: string) {
    return mis1on1.filter(r => r.fecha === fechaISO)
  }
  const obsSeleccionados = selectedDay ? obsEnFecha(selectedDay) : []

  function abrirObj(o: any) {
    router.push(rol === 'empleado' ? `/mi-trabajo?objetivo=${o.id}` : `/objetivos?objetivo=${o.id}`)
  }

  const ASPECTOS_OPCIONES = [
    'Claro en su feedback', 'Disponible cuando lo necesito',
    'Justo en sus evaluaciones', 'Me ayuda a crecer',
    'Reconoce mis logros', 'Da contexto y dirección',
  ]

  async function handleSubmitEval(e: React.FormEvent) {
    e.preventDefault()
    if (!evalForm.calificacion || !personaId || !empresaId) return
    setSavingEval(true)
    const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`
    await fetch('/api/evaluar-supervisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleadoId: personaId, empresaId, periodo,
        calificacion: evalForm.calificacion,
        aspectos: evalForm.aspectos,
        comentario: evalForm.comentario.trim() || null,
      }),
    })
    setSavingEval(false)
    setEvalYaEnviada(true)
    setShowEvalForm(false)
  }

  function toggleAspecto(a: string) {
    setEvalForm(f => ({
      ...f,
      aspectos: f.aspectos.includes(a) ? f.aspectos.filter(x => x !== a) : [...f.aspectos, a],
    }))
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Mi Semana</h1>
          <p className="traza-page-sub">
            {getSaludo(nombre)} · {DIAS_LARGO[hoy.getDay() === 0 ? 6 : hoy.getDay()-1]} {hoy.getDate()} de {MESES[hoy.getMonth()]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {rol !== 'empleado' && personas.length > 0 && (
            <select className="traza-input w-auto" value={filtroPersona}
              onChange={e => { setFiltroPersona(e.target.value); setSelectedDay(null) }}>
              <option value="todos">Todo el equipo</option>
              {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          )}
          <div className="traza-tabs">
            {(['semana','mes'] as const).map(v => (
              <button key={v} onClick={() => { setVista(v); setSelectedDay(null) }}
                className={`traza-tab ${vista === v ? 'active' : ''}`}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats strip ────────────────────────────────────── */}
      <div className={`grid gap-3 ${tienePersona ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {tienePersona && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${racha > 0 ? 'bg-traza-50 border border-traza-100' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${racha > 0 ? 'bg-traza-100' : 'bg-gray-100'}`}>
              <Activity size={15} className={racha > 0 ? 'text-traza-700' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-xl font-bold ${racha > 0 ? 'text-traza-700' : 'text-gray-400'}`}>{racha}</p>
              <p className="text-xs text-gray-500">sem. activas seguidas</p>
            </div>
          </div>
        )}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${vencidos.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${vencidos.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <AlertTriangle size={15} className={vencidos.length > 0 ? 'text-red-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className={`text-xl font-bold ${vencidos.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{vencidos.length}</p>
            <p className="text-xs text-gray-500">vencidos sin completar</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
            <Clock size={15} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{estaSemana.length}</p>
            <p className="text-xs text-gray-500">vencen esta semana</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-blue-50 border border-blue-100">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
            <CalendarDays size={15} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{prox30.length}</p>
            <p className="text-xs text-gray-500">próximos 30 días</p>
          </div>
        </div>
      </div>

      {/* placeholder — evaluación movida abajo */}
      {false && (
        <div className={`rounded-2xl border p-5 transition-all ${evalYaEnviada ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'}`}>
          {evalYaEnviada ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Ya evaluaste a tu supervisor este mes</p>
                <p className="text-xs text-gray-400 mt-0.5">Gracias por tu feedback. Podés actualizar tu respuesta el próximo mes.</p>
              </div>
            </div>
          ) : !showEvalForm ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                  <Star size={17} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">¿Cómo te está yendo con tu supervisor?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Evaluación mensual · Tu respuesta es anónima para el equipo</p>
                </div>
              </div>
              <button
                onClick={() => setShowEvalForm(true)}
                className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors"
                style={{ backgroundColor: '#3350D0' }}
              >
                Evaluar ahora
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitEval} className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Evaluación mensual del supervisor</p>
                <button type="button" onClick={() => setShowEvalForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>

              {/* Calificación */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Cómo calificarías a tu supervisor este mes?</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { val: 'Excelente', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    { val: 'Bueno',     color: '#3350D0', bg: '#EDEFFD', border: '#BBC5F7' },
                    { val: 'Regular',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { val: 'Mejorable', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  ] as const).map(({ val, color, bg, border }) => (
                    <button
                      key={val} type="button"
                      onClick={() => setEvalForm(f => ({ ...f, calificacion: val }))}
                      className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        backgroundColor: evalForm.calificacion === val ? bg : '#f9fafb',
                        borderColor:     evalForm.calificacion === val ? border : '#e5e7eb',
                        color:           evalForm.calificacion === val ? color : '#9ca3af',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspectos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Qué aspectos destacás? (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {ASPECTOS_OPCIONES.map(a => {
                    const sel = evalForm.aspectos.includes(a)
                    return (
                      <button
                        key={a} type="button" onClick={() => toggleAspecto(a)}
                        className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                        style={{
                          backgroundColor: sel ? '#EDEFFD' : '#f9fafb',
                          borderColor:     sel ? '#BBC5F7' : '#e5e7eb',
                          color:           sel ? '#3350D0' : '#6b7280',
                        }}
                      >
                        {sel ? '✓ ' : ''}{a}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Comentario */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comentario (opcional)</p>
                <textarea
                  value={evalForm.comentario}
                  onChange={e => setEvalForm(f => ({ ...f, comentario: e.target.value }))}
                  placeholder="¿Algo más que quieras compartir?"
                  rows={3}
                  className="traza-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!evalForm.calificacion || savingEval}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#3350D0' }}
              >
                <Send size={14} />
                {savingEval ? 'Enviando...' : 'Enviar evaluación'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Calendario + panel ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5 items-start">

        {/* Calendario */}
        <div className="traza-card overflow-hidden">

          {/* Nav del calendario */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={vista==='semana' ? prevSem : prevMes}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} strokeWidth={1.75} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900 text-sm">
                {vista==='semana' ? labelSem : `${MESES[mes]} ${año}`}
              </h2>
              <button onClick={irHoy} className="text-xs text-traza-700 font-medium hover:underline">Hoy</button>
            </div>
            <button onClick={vista==='semana' ? nextSem : nextMes}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} strokeWidth={1.75} className="text-gray-600" />
            </button>
          </div>

          {/* Vista semana */}
          {vista === 'semana' && (
            <div className="grid grid-cols-7 divide-x divide-gray-100">
              {diasSemana.map((dia, i) => {
                const fISO      = isoDate(dia)
                const obs       = obsEnFecha(fISO)
                const reuniones = reunion1on1EnFecha(fISO)
                const esHoy     = fISO === hoyISO
                const sel       = selectedDay === fISO
                const finde     = i >= 5
                const hayVenc   = obs.some(esVencido)
                return (
                  <div key={fISO}
                    className={`min-h-[160px] cursor-pointer transition-colors ${sel ? 'bg-traza-50' : finde ? 'bg-gray-50/40 hover:bg-gray-50' : 'hover:bg-gray-50/60'}`}
                    onClick={() => setSelectedDay(sel ? null : fISO)}>
                    <div className={`px-2 py-3 text-center border-b ${sel ? 'border-traza-200' : 'border-gray-100'}`}>
                      <p className="text-xs font-medium text-gray-400 mb-1.5">{DIAS_CORTO[i]}</p>
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto ${esHoy ? 'bg-traza-700 text-white' : finde ? 'text-gray-400' : 'text-gray-800'}`}>
                        {dia.getDate()}
                      </span>
                      {obs.length > 0 && (
                        <span className={`text-xs font-semibold mt-1 block ${hayVenc ? 'text-red-500' : 'text-traza-600'}`}>{obs.length}</span>
                      )}
                    </div>
                    <div className="p-1.5 space-y-1">
                      {obs.slice(0,3).map(o => {
                        const st = estadoColor(o.estado, esVencido(o))
                        return (
                          <div key={o.id}
                            onClick={e => { e.stopPropagation(); abrirObj(o) }}
                            className="text-xs px-2 py-0.5 rounded-lg truncate font-medium cursor-pointer hover:opacity-75 transition-opacity"
                            style={{ backgroundColor: st.bg, color: st.text }}
                            title={`${o.titulo}${o.persona ? ` — ${o.persona.nombre}` : ''}`}>
                            {o.titulo}
                          </div>
                        )
                      })}
                      {obs.length > 3 && <p className="text-xs text-gray-400 px-1">+{obs.length-3} más</p>}
                      {reuniones.length > 0 && (
                        <a href="/reuniones"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg truncate font-medium hover:opacity-75 transition-opacity"
                          style={{ backgroundColor: '#f0f4ff', color: '#4f46e5' }}
                          title="Reunión 1:1">
                          <MessageSquare size={9} />
                          Reunión 1:1
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vista mes */}
          {vista === 'mes' && (
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {DIAS_CORTO.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offset }).map((_,i) => <div key={`e-${i}`} />)}
                {Array.from({ length: totalDias }).map((_,i) => {
                  const dia     = i+1
                  const fISO    = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                  const obs     = obsEnFecha(fISO)
                  const esHoy   = dia===hoy.getDate() && mes===hoy.getMonth() && año===hoy.getFullYear()
                  const sel     = selectedDay === fISO
                  const hayVenc = obs.some(esVencido)
                  return (
                    <button key={dia} onClick={() => setSelectedDay(sel ? null : fISO)}
                      className={`relative min-h-[60px] rounded-xl p-1.5 text-left transition-all border ${sel ? 'border-traza-700 bg-traza-50' : 'border-transparent hover:bg-gray-50'}`}>
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-traza-700 text-white' : 'text-gray-700'}`}>{dia}</span>
                      <div className="mt-1 space-y-0.5">
                        {obs.slice(0,2).map(o => {
                          const st = estadoColor(o.estado, esVencido(o))
                          return (
                            <div key={o.id}
                              onClick={e => { e.stopPropagation(); abrirObj(o) }}
                              className="text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-75"
                              style={{ backgroundColor: st.bg, color: st.text }}
                              title={o.titulo}>{o.titulo}</div>
                          )
                        })}
                        {obs.length > 2 && <p className={`text-xs px-1 font-medium ${hayVenc ? 'text-red-400' : 'text-gray-400'}`}>+{obs.length-2}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
            {[
              { label: 'Completado',  dot: '#22c55e' },
              { label: 'En progreso', dot: '#f59e0b' },
              { label: 'Pendiente',   dot: '#9ca3af' },
              { label: 'Vencido',     dot: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dot }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">

          {/* Detalle día seleccionado */}
          {selectedDay && (
            <div className="traza-card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                {(() => {
                  const d = new Date(selectedDay + 'T12:00:00')
                  return `${DIAS_LARGO[d.getDay()===0?6:d.getDay()-1]} ${d.getDate()} de ${MESES[d.getMonth()]}`
                })()}
              </h3>
              {obsSeleccionados.length === 0 ? (
                <p className="text-sm text-gray-400">Sin vencimientos este día.</p>
              ) : (
                <div className="space-y-2">
                  {obsSeleccionados.map(o => {
                    const st = estadoColor(o.estado, esVencido(o))
                    return (
                      <div key={o.id} onClick={() => abrirObj(o)}
                        className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: st.dot }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 leading-tight">{o.titulo}</p>
                          {o.persona && <p className="text-xs text-gray-400 mt-0.5">{o.persona.nombre} {o.persona.apellido}</p>}
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                            style={{ backgroundColor: st.bg, color: st.text }}>
                            {esVencido(o) ? 'Vencido' : o.estado}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Vencidos urgentes */}
          {vencidos.length > 0 && (
            <div className="traza-card p-5" style={{ borderColor: '#fecaca', borderWidth: 1 }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">Vencidos sin completar</p>
              </div>
              <div className="space-y-2">
                {vencidos.slice(0,4).map(o => (
                  <div key={o.id} onClick={() => abrirObj(o)}
                    className="cursor-pointer hover:bg-red-50 rounded-lg p-2 transition-colors">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{o.titulo}</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      {formatRelativa(o.fecha_limite, hoyISO)}
                      {o.persona ? ` · ${o.persona.nombre}` : ''}
                    </p>
                  </div>
                ))}
                {vencidos.length > 4 && <p className="text-xs text-red-400 font-medium">+{vencidos.length-4} más</p>}
              </div>
            </div>
          )}

          {/* Próximos vencimientos */}
          <div className="traza-card p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">Próximos vencimientos</p>
            {proxLista.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={22} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Todo al día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {proxLista.map(o => {
                  const st = estadoColor(o.estado, false)
                  return (
                    <div key={o.id} onClick={() => abrirObj(o)}
                      className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
                      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: st.dot }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight truncate">{o.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatRelativa(o.fecha_limite, hoyISO)}
                          {o.persona ? ` · ${o.persona.nombre}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Evaluación mensual del supervisor (solo empleados) ── */}
      {rol === 'empleado' && tienePersona && (
        <div className={`rounded-2xl border p-5 transition-all ${evalYaEnviada ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'}`}>
          {evalYaEnviada ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Ya evaluaste a tu supervisor este mes</p>
                <p className="text-xs text-gray-400 mt-0.5">Gracias por tu feedback. Podés actualizar tu respuesta el próximo mes.</p>
              </div>
            </div>
          ) : !showEvalForm ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                  <Star size={17} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">¿Cómo te está yendo con tu supervisor?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Evaluación mensual · Tu respuesta es anónima para el equipo</p>
                </div>
              </div>
              <button
                onClick={() => setShowEvalForm(true)}
                className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors"
                style={{ backgroundColor: '#3350D0' }}
              >
                Evaluar ahora
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitEval} className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Evaluación mensual del supervisor</p>
                <button type="button" onClick={() => setShowEvalForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Cómo calificarías a tu supervisor este mes?</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { val: 'Excelente', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    { val: 'Bueno',     color: '#3350D0', bg: '#EDEFFD', border: '#BBC5F7' },
                    { val: 'Regular',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { val: 'Mejorable', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  ] as const).map(({ val, color, bg, border }) => (
                    <button
                      key={val} type="button"
                      onClick={() => setEvalForm(f => ({ ...f, calificacion: val }))}
                      className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={{
                        backgroundColor: evalForm.calificacion === val ? bg : '#f9fafb',
                        borderColor:     evalForm.calificacion === val ? border : '#e5e7eb',
                        color:           evalForm.calificacion === val ? color : '#6b7280',
                      }}
                    >{val}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Qué aspectos destacás? (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {ASPECTOS_OPCIONES.map(a => {
                    const sel = evalForm.aspectos.includes(a)
                    return (
                      <button key={a} type="button" onClick={() => toggleAspecto(a)}
                        className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                        style={{
                          backgroundColor: sel ? '#EDEFFD' : '#f9fafb',
                          borderColor:     sel ? '#BBC5F7' : '#e5e7eb',
                          color:           sel ? '#3350D0' : '#6b7280',
                        }}>{sel ? '✓ ' : ''}{a}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comentario (opcional)</p>
                <textarea
                  value={evalForm.comentario}
                  onChange={e => setEvalForm(f => ({ ...f, comentario: e.target.value }))}
                  placeholder="¿Algo más que quieras compartir?"
                  rows={3} className="traza-input resize-none"
                />
              </div>
              <button type="submit" disabled={!evalForm.calificacion || savingEval}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#3350D0' }}>
                <Send size={14} />
                {savingEval ? 'Enviando...' : 'Enviar evaluación'}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  )
}
