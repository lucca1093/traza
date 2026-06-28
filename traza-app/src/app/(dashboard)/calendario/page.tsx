'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, CalendarDays } from 'lucide-react'

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getLunes(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDiasDelMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1).getDay()
  const offset = primerDia === 0 ? 6 : primerDia - 1
  const totalDias = new Date(year, month + 1, 0).getDate()
  return { offset, totalDias }
}

function getEstadoStyle(estado: string, vencido: boolean) {
  if (vencido && estado !== 'Completado') {
    return { bg: 'bg-red-100', text: 'text-red-700', dot: '#ef4444' }
  }
  if (estado === 'Completado') return { bg: 'bg-green-100', text: 'text-green-700', dot: '#22c55e' }
  if (estado === 'En progreso') return { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#f59e0b' }
  return { bg: 'bg-gray-100', text: 'text-gray-500', dot: '#9ca3af' }
}

export default function CalendarioPage() {
  const router = useRouter()
  const hoy = new Date()
  const hoyISO = toISODate(hoy)

  const [vista, setVista]             = useState<'semana' | 'mes'>('semana')
  const [lunesActual, setLunes]       = useState<Date>(getLunes(hoy))
  const [mes, setMes]                 = useState(hoy.getMonth())
  const [año, setAño]                 = useState(hoy.getFullYear())
  const [objetivos, setObjetivos]     = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string>('todos')
  const [personas, setPersonas]       = useState<any[]>([])
  const [rol, setRol]                 = useState<string>('')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('rol, empresa_id').eq('id', user.id).single()
      setRol(profile?.rol ?? '')

      if (profile?.rol === 'empleado') {
        const { data: persona } = await supabase.from('personas').select('id').eq('user_id', user.id).eq('empleo_activo', true).single()
        if (persona) {
          const { data: obs } = await supabase.from('objetivos').select('*, persona:personas(nombre, apellido)').eq('persona_id', persona.id).not('fecha_limite', 'is', null)
          setObjetivos(obs ?? [])
        }
      } else {
        const { data: obs } = await supabase.from('objetivos').select('*, persona:personas(nombre, apellido)').eq('empresa_id', profile?.empresa_id).not('fecha_limite', 'is', null).order('fecha_limite')
        const { data: pers } = await supabase.from('personas').select('id, nombre, apellido').eq('empleo_activo', true).eq('empresa_id', profile?.empresa_id).order('apellido')
        setObjetivos(obs ?? [])
        setPersonas(pers ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const obsFiltrados = filtroPersona === 'todos' ? objetivos : objetivos.filter(o => o.persona_id === filtroPersona)

  const esVencido = (o: any) => o.fecha_limite < hoyISO && o.estado !== 'Completado'

  function obsDelaFecha(fechaISO: string) {
    return obsFiltrados.filter(o => o.fecha_limite?.startsWith(fechaISO))
  }

  // ── Stats ──
  const en7dias   = new Date(hoy); en7dias.setDate(hoy.getDate() + 7)
  const en30dias  = new Date(hoy); en30dias.setDate(hoy.getDate() + 30)
  const vencidos  = obsFiltrados.filter(o => esVencido(o))
  const estaSemana = obsFiltrados.filter(o => o.fecha_limite >= hoyISO && o.fecha_limite <= toISODate(en7dias) && o.estado !== 'Completado')
  const proximos30 = obsFiltrados.filter(o => o.fecha_limite > toISODate(en7dias) && o.fecha_limite <= toISODate(en30dias) && o.estado !== 'Completado')

  // ── Próximos vencimientos (lista) ──
  const proximosLista = obsFiltrados
    .filter(o => o.fecha_limite >= hoyISO)
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite))
    .slice(0, 8)

  // ── Vista semana ──
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesActual)
    d.setDate(lunesActual.getDate() + i)
    return d
  })

  const domingo = new Date(lunesActual); domingo.setDate(lunesActual.getDate() + 6)
  const labelSemana = lunesActual.getMonth() === domingo.getMonth()
    ? `${lunesActual.getDate()} – ${domingo.getDate()} de ${MESES[lunesActual.getMonth()]} ${lunesActual.getFullYear()}`
    : `${lunesActual.getDate()} ${MESES[lunesActual.getMonth()]} – ${domingo.getDate()} ${MESES[domingo.getMonth()]} ${domingo.getFullYear()}`

  function prevSemana() { setLunes(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n }); setSelectedDay(null) }
  function nextSemana() { setLunes(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n }); setSelectedDay(null) }
  function prevMes() { if (mes === 0) { setMes(11); setAño(a => a - 1) } else setMes(m => m - 1); setSelectedDay(null) }
  function nextMes() { if (mes === 11) { setMes(0); setAño(a => a + 1) } else setMes(m => m + 1); setSelectedDay(null) }
  function irAHoy() { setLunes(getLunes(hoy)); setMes(hoy.getMonth()); setAño(hoy.getFullYear()); setSelectedDay(null) }

  const { offset, totalDias } = getDiasDelMes(año, mes)

  const obsSeleccionados = selectedDay ? obsDelaFecha(selectedDay) : []

  function abrirObjetivo(o: any) {
    router.push(rol === 'empleado' ? `/mi-trabajo?objetivo=${o.id}` : `/objetivos?objetivo=${o.id}`)
  }

  function formatFechaRelativa(fechaISO: string) {
    const f = new Date(fechaISO + 'T12:00:00')
    const diff = Math.round((f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Mañana'
    if (diff === -1) return 'Ayer'
    if (diff < 0) return `Hace ${Math.abs(diff)} días`
    if (diff < 7) return `En ${diff} días`
    return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 mt-1">Vencimientos de objetivos por fecha.</p>
        </div>
        <div className="flex items-center gap-3">
          {rol !== 'empleado' && personas.length > 0 && (
            <select className="traza-input w-auto" value={filtroPersona} onChange={e => { setFiltroPersona(e.target.value); setSelectedDay(null) }}>
              <option value="todos">Todos</option>
              {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          )}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['semana', 'mes'] as const).map(v => (
              <button key={v} onClick={() => { setVista(v); setSelectedDay(null) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${vista === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${vencidos.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${vencidos.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <AlertTriangle size={15} className={vencidos.length > 0 ? 'text-red-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className={`text-xl font-bold ${vencidos.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{vencidos.length}</p>
            <p className="text-xs text-gray-500">Vencidos sin completar</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
            <Clock size={15} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{estaSemana.length}</p>
            <p className="text-xs text-gray-500">Vencen esta semana</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-blue-50 border border-blue-100">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
            <CalendarDays size={15} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{proximos30.length}</p>
            <p className="text-xs text-gray-500">Próximos 30 días</p>
          </div>
        </div>
      </div>

      {/* Layout: calendario + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Calendario */}
        <div className="traza-card overflow-hidden">
          {/* Navegación */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={vista === 'semana' ? prevSemana : prevMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} strokeWidth={1.75} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900 text-base">
                {vista === 'semana' ? labelSemana : `${MESES[mes]} ${año}`}
              </h2>
              <button onClick={irAHoy} className="text-xs text-traza-700 font-medium hover:underline">Hoy</button>
            </div>
            <button onClick={vista === 'semana' ? nextSemana : nextMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} strokeWidth={1.75} className="text-gray-600" />
            </button>
          </div>

          {/* Vista semana */}
          {vista === 'semana' && (
            <div className="grid grid-cols-7 divide-x divide-gray-100">
              {diasSemana.map((dia, i) => {
                const fechaISO = toISODate(dia)
                const obs = obsDelaFecha(fechaISO)
                const esHoy = fechaISO === hoyISO
                const isSelected = selectedDay === fechaISO
                const esFinDeSemana = i >= 5
                const tieneVencidos = obs.some(o => esVencido(o))

                return (
                  <div key={fechaISO}
                    className={`min-h-[180px] cursor-pointer transition-colors ${isSelected ? 'bg-traza-50' : esFinDeSemana ? 'bg-gray-50/40 hover:bg-gray-50' : 'hover:bg-gray-50/60'}`}
                    onClick={() => setSelectedDay(isSelected ? null : fechaISO)}>
                    <div className={`px-2 py-3 text-center border-b ${isSelected ? 'border-traza-200' : 'border-gray-100'}`}>
                      <p className={`text-xs font-medium mb-1.5 ${esFinDeSemana ? 'text-gray-400' : 'text-gray-400'}`}>{DIAS_CORTO[i]}</p>
                      <span className={`text-base font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${esHoy ? 'bg-traza-700 text-white' : esFinDeSemana ? 'text-gray-400' : 'text-gray-800'}`}>
                        {dia.getDate()}
                      </span>
                      {obs.length > 0 && (
                        <span className={`text-xs font-semibold mt-1 block ${tieneVencidos ? 'text-red-500' : 'text-traza-600'}`}>{obs.length}</span>
                      )}
                    </div>
                    <div className="p-1.5 space-y-1">
                      {obs.slice(0, 3).map(o => {
                        const venc = esVencido(o)
                        const st = getEstadoStyle(o.estado, venc)
                        return (
                          <div key={o.id}
                            onClick={e => { e.stopPropagation(); abrirObjetivo(o) }}
                            className={`text-xs px-2 py-1 rounded-lg truncate font-medium cursor-pointer hover:opacity-75 transition-opacity ${st.bg} ${st.text}`}
                            title={`${o.titulo}${o.persona ? ` — ${o.persona.nombre}` : ''}`}>
                            {o.titulo}
                          </div>
                        )
                      })}
                      {obs.length > 3 && <p className="text-xs text-gray-400 px-1">+{obs.length - 3} más</p>}
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
                {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: totalDias }).map((_, i) => {
                  const dia = i + 1
                  const fechaISO = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                  const obs = obsFiltrados.filter(o => o.fecha_limite?.startsWith(fechaISO))
                  const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
                  const isSelected = selectedDay === fechaISO
                  const tieneVencidos = obs.some(o => esVencido(o))
                  return (
                    <button key={dia} onClick={() => setSelectedDay(isSelected ? null : fechaISO)}
                      className={`relative min-h-[64px] rounded-xl p-2 text-left transition-all border ${isSelected ? 'border-traza-700 bg-traza-50' : 'border-transparent hover:bg-gray-50'}`}>
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${esHoy ? 'bg-traza-700 text-white' : 'text-gray-700'}`}>{dia}</span>
                      <div className="mt-1 space-y-0.5">
                        {obs.slice(0, 2).map(o => {
                          const venc = esVencido(o)
                          const st = getEstadoStyle(o.estado, venc)
                          return (
                            <div key={o.id} onClick={e => { e.stopPropagation(); abrirObjetivo(o) }}
                              className={`text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-75 ${st.bg} ${st.text}`}
                              title={o.titulo}>
                              {o.titulo}
                            </div>
                          )
                        })}
                        {obs.length > 2 && <div className={`text-xs px-1 font-medium ${tieneVencidos ? 'text-red-400' : 'text-gray-400'}`}>+{obs.length - 2}</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
            {[
              { label: 'Completado',  color: '#22c55e', bg: '#dcfce7' },
              { label: 'En progreso', color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Pendiente',   color: '#9ca3af', bg: '#f3f4f6' },
              { label: 'Vencido',     color: '#ef4444', bg: '#fee2e2' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.bg, border: `1px solid ${item.color}20` }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Detalle del día seleccionado */}
          {selectedDay && (
            <div className="traza-card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                {(() => {
                  const d = new Date(selectedDay + 'T12:00:00')
                  return `${DIAS_LARGO[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} de ${MESES[d.getMonth()]}`
                })()}
              </h3>
              {obsSeleccionados.length === 0 ? (
                <p className="text-sm text-gray-400">Sin vencimientos este día.</p>
              ) : (
                <div className="space-y-2">
                  {obsSeleccionados.map(o => {
                    const venc = esVencido(o)
                    const st = getEstadoStyle(o.estado, venc)
                    return (
                      <div key={o.id} onClick={() => abrirObjetivo(o)}
                        className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: st.dot }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 leading-tight">{o.titulo}</p>
                          {o.persona && <p className="text-xs text-gray-400 mt-0.5">{o.persona.nombre} {o.persona.apellido}</p>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${st.bg} ${st.text}`}>
                            {venc ? 'Vencido' : o.estado}
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
            <div className="traza-card p-5 border border-red-100" style={{ backgroundColor: '#fff5f5' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">Vencidos sin completar</p>
              </div>
              <div className="space-y-2">
                {vencidos.slice(0, 4).map(o => (
                  <div key={o.id} onClick={() => abrirObjetivo(o)}
                    className="cursor-pointer hover:bg-red-50 rounded-lg p-2 transition-colors">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{o.titulo}</p>
                    <p className="text-xs text-red-400 mt-0.5">{formatFechaRelativa(o.fecha_limite)}{o.persona ? ` · ${o.persona.nombre}` : ''}</p>
                  </div>
                ))}
                {vencidos.length > 4 && <p className="text-xs text-red-400 font-medium">+{vencidos.length - 4} más</p>}
              </div>
            </div>
          )}

          {/* Próximos vencimientos */}
          <div className="traza-card p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">Próximos vencimientos</p>
            {proximosLista.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Todo al día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {proximosLista.map(o => {
                  const st = getEstadoStyle(o.estado, false)
                  return (
                    <div key={o.id} onClick={() => abrirObjetivo(o)}
                      className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
                      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: st.dot }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight truncate">{o.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatFechaRelativa(o.fecha_limite)}{o.persona ? ` · ${o.persona.nombre}` : ''}
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
    </div>
  )
}
