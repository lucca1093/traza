'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcularRacha } from '@/lib/traza'
import {
  ChevronLeft, ChevronRight,
  AlertTriangle, Clock, CalendarDays, Activity,
  CheckCircle2,
} from 'lucide-react'

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
  const obsSeleccionados = selectedDay ? obsEnFecha(selectedDay) : []

  function abrirObj(o: any) {
    router.push(rol === 'empleado' ? `/mi-trabajo?objetivo=${o.id}` : `/objetivos?objetivo=${o.id}`)
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Semana</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
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
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['semana','mes'] as const).map(v => (
              <button key={v} onClick={() => { setVista(v); setSelectedDay(null) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${vista===v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
                const fISO    = isoDate(dia)
                const obs     = obsEnFecha(fISO)
                const esHoy   = fISO === hoyISO
                const sel     = selectedDay === fISO
                const finde   = i >= 5
                const hayVenc = obs.some(esVencido)
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
    </div>
  )
}
