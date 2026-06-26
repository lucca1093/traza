'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getEstadoClasses } from '@/lib/traza'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
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

export default function CalendarioPage() {
  const router = useRouter()
  const hoy = new Date()

  const [vista, setVista]           = useState<'semana' | 'mes'>('semana')
  const [lunesActual, setLunes]     = useState<Date>(getLunes(hoy))
  const [mes, setMes]               = useState(hoy.getMonth())
  const [año, setAño]               = useState(hoy.getFullYear())
  const [objetivos, setObjetivos]   = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string>('todos')
  const [personas, setPersonas]     = useState<any[]>([])
  const [rol, setRol]               = useState<string>('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('rol, empresa_id')
        .eq('id', user.id)
        .single()

      setRol(profile?.rol ?? '')

      if (profile?.rol === 'empleado') {
        const { data: persona } = await supabase
          .from('personas').select('id').eq('user_id', user.id).eq('empleo_activo', true).single()
        if (persona) {
          const { data: obs } = await supabase
            .from('objetivos')
            .select('*, persona:personas(nombre, apellido)')
            .eq('persona_id', persona.id)
            .not('fecha_limite', 'is', null)
          setObjetivos(obs ?? [])
        }
      } else {
        const { data: obs } = await supabase
          .from('objetivos')
          .select('*, persona:personas(nombre, apellido)')
          .not('fecha_limite', 'is', null)
          .order('fecha_limite')

        const { data: pers } = await supabase
          .from('personas').select('id, nombre, apellido').eq('empleo_activo', true).order('apellido')

        setObjetivos(obs ?? [])
        setPersonas(pers ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const obsFiltrados = filtroPersona === 'todos'
    ? objetivos
    : objetivos.filter(o => o.persona_id === filtroPersona)

  function obsDelaFecha(fechaISO: string) {
    return obsFiltrados.filter(o => o.fecha_limite?.startsWith(fechaISO))
  }

  // ── Vista semana ──
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesActual)
    d.setDate(lunesActual.getDate() + i)
    return d
  })

  function prevSemana() {
    setLunes(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    setSelectedDay(null)
  }
  function nextSemana() {
    setLunes(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    setSelectedDay(null)
  }
  function irAHoy() {
    setLunes(getLunes(hoy))
    setMes(hoy.getMonth())
    setAño(hoy.getFullYear())
    setSelectedDay(null)
  }

  const domingo = new Date(lunesActual)
  domingo.setDate(lunesActual.getDate() + 6)
  const labelSemana = lunesActual.getMonth() === domingo.getMonth()
    ? `${lunesActual.getDate()} – ${domingo.getDate()} de ${MESES[lunesActual.getMonth()]} ${lunesActual.getFullYear()}`
    : `${lunesActual.getDate()} ${MESES[lunesActual.getMonth()]} – ${domingo.getDate()} ${MESES[domingo.getMonth()]} ${domingo.getFullYear()}`

  // ── Vista mes ──
  function prevMes() {
    if (mes === 0) { setMes(11); setAño(a => a - 1) }
    else setMes(m => m - 1)
    setSelectedDay(null)
  }
  function nextMes() {
    if (mes === 11) { setMes(0); setAño(a => a + 1) }
    else setMes(m => m + 1)
    setSelectedDay(null)
  }

  const { offset, totalDias } = getDiasDelMes(año, mes)

  function obsDelDiaMes(dia: number) {
    const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return obsFiltrados.filter(o => o.fecha_limite?.startsWith(fecha))
  }

  const obsSeleccionados = selectedDay ? obsDelaFecha(selectedDay) : []

  function abrirObjetivo(o: any) {
    const dest = rol === 'empleado' ? `/mi-trabajo?objetivo=${o.id}` : `/objetivos?objetivo=${o.id}`
    router.push(dest)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 mt-1">Vencimientos de objetivos por fecha.</p>
        </div>
        <div className="flex items-center gap-3">
          {rol !== 'empleado' && personas.length > 0 && (
            <select
              className="traza-input w-auto"
              value={filtroPersona}
              onChange={e => { setFiltroPersona(e.target.value); setSelectedDay(null) }}
            >
              <option value="todos">Todos</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          )}
          {/* Toggle vista */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setVista('semana'); setSelectedDay(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${vista === 'semana' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Semana
            </button>
            <button
              onClick={() => { setVista('mes'); setSelectedDay(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${vista === 'mes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      <div className="traza-card overflow-hidden">
        {/* Navegación */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={vista === 'semana' ? prevSemana : prevMes}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={1.75} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 text-base">
              {vista === 'semana' ? labelSemana : `${MESES[mes]} ${año}`}
            </h2>
            <button
              onClick={irAHoy}
              className="text-xs text-traza-700 font-medium hover:underline"
            >
              Hoy
            </button>
          </div>
          <button
            onClick={vista === 'semana' ? nextSemana : nextMes}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} strokeWidth={1.75} className="text-gray-600" />
          </button>
        </div>

        {/* ── VISTA SEMANA ── */}
        {vista === 'semana' && (
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {diasSemana.map((dia, i) => {
              const fechaISO = toISODate(dia)
              const obs = obsDelaFecha(fechaISO)
              const esHoy = toISODate(dia) === toISODate(hoy)
              const isSelected = selectedDay === fechaISO
              const esFinDeSemana = i >= 5

              return (
                <div
                  key={fechaISO}
                  className={`min-h-[220px] cursor-pointer transition-colors ${isSelected ? 'bg-traza-50' : esFinDeSemana ? 'bg-gray-50/50 hover:bg-gray-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedDay(isSelected ? null : fechaISO)}
                >
                  {/* Cabecera día */}
                  <div className={`px-2 py-3 text-center border-b border-gray-100 ${isSelected ? 'border-traza-200' : ''}`}>
                    <p className={`text-xs font-medium mb-1 ${esFinDeSemana ? 'text-gray-400' : 'text-gray-500'}`}>
                      {DIAS_CORTO[i]}
                    </p>
                    <span className={`text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full mx-auto ${esHoy ? 'bg-traza-700 text-white' : esFinDeSemana ? 'text-gray-400' : 'text-gray-800'}`}>
                      {dia.getDate()}
                    </span>
                    {obs.length > 0 && (
                      <span className="text-xs text-traza-700 font-semibold mt-1 block">{obs.length}</span>
                    )}
                  </div>

                  {/* Objetivos del día */}
                  <div className="p-2 space-y-1">
                    {obs.slice(0, 4).map(o => (
                      <div
                        key={o.id}
                        onClick={e => { e.stopPropagation(); abrirObjetivo(o) }}
                        className={`text-xs px-2 py-1.5 rounded-lg truncate font-medium cursor-pointer hover:opacity-75 transition-opacity ${getEstadoClasses(o.estado)}`}
                        title={`${o.titulo}${o.persona ? ` — ${o.persona.nombre}` : ''}`}
                      >
                        {o.titulo}
                      </div>
                    ))}
                    {obs.length > 4 && (
                      <p className="text-xs text-gray-400 px-1">+{obs.length - 4} más</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── VISTA MES ── */}
        {vista === 'mes' && (
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {DIAS_CORTO.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: totalDias }).map((_, i) => {
                const dia = i + 1
                const fechaISO = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                const obs = obsDelDiaMes(dia)
                const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
                const isSelected = selectedDay === fechaISO
                return (
                  <button
                    key={dia}
                    onClick={() => setSelectedDay(isSelected ? null : fechaISO)}
                    className={`relative min-h-[72px] rounded-xl p-2 text-left transition-all border ${isSelected ? 'border-traza-700 bg-traza-50' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${esHoy ? 'bg-traza-700 text-white' : 'text-gray-700'}`}>
                      {dia}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {obs.slice(0, 3).map(o => (
                        <div
                          key={o.id}
                          onClick={e => { e.stopPropagation(); abrirObjetivo(o) }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-75 ${getEstadoClasses(o.estado)}`}
                          title={o.titulo}
                        >
                          {o.titulo}
                        </div>
                      ))}
                      {obs.length > 3 && <div className="text-xs text-gray-400 px-1">+{obs.length - 3}</div>}
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
            { label: 'Completado',  cls: 'bg-green-100 text-green-700' },
            { label: 'En progreso', cls: 'bg-yellow-100 text-yellow-700' },
            { label: 'Pendiente',   cls: 'bg-red-100 text-red-700' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${item.cls.split(' ')[0]}`} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel detalle del día seleccionado */}
      {selectedDay && (
        <div className="traza-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {(() => {
              const d = new Date(selectedDay + 'T12:00:00')
              return `${DIAS_LARGO[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} de ${MESES[d.getMonth()]}`
            })()}
            {' · '}
            {obsSeleccionados.length === 0 ? 'Sin vencimientos' : `${obsSeleccionados.length} objetivo${obsSeleccionados.length > 1 ? 's' : ''}`}
          </h3>
          {obsSeleccionados.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay objetivos que venzan este día.</p>
          ) : (
            <div className="space-y-2">
              {obsSeleccionados.map(o => (
                <div
                  key={o.id}
                  onClick={() => abrirObjetivo(o)}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{o.titulo}</p>
                    {o.persona && (
                      <p className="text-xs text-gray-500 mt-0.5">{o.persona.nombre} {o.persona.apellido}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoClasses(o.estado)}`}>
                      {o.estado}
                    </span>
                    <span className="text-xs text-traza-700 font-medium">Abrir →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
