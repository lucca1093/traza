'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getEstadoClasses, formatFecha } from '@/lib/traza'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Objetivo } from '@/types'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getDiasDelMes(year: number, month: number) {
  const primerDia = new Date(year, month, 1).getDay() // 0=dom
  const offset = primerDia === 0 ? 6 : primerDia - 1  // ajustar para lun-dom
  const totalDias = new Date(year, month + 1, 0).getDate()
  return { offset, totalDias }
}

export default function CalendarioPage() {
  const hoy = new Date()
  const [mes, setMes]       = useState(hoy.getMonth())
  const [año, setAño]       = useState(hoy.getFullYear())
  const [objetivos, setObjetivos] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string>('todos')
  const [personas, setPersonas] = useState<any[]>([])
  const [rol, setRol] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
        // Solo sus propios objetivos
        const { data: persona } = await supabase
          .from('personas')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (persona) {
          const { data: obs } = await supabase
            .from('objetivos')
            .select('*, persona:personas(nombre, apellido)')
            .eq('persona_id', persona.id)
            .not('fecha_limite', 'is', null)
          setObjetivos(obs ?? [])
        }
      } else {
        // Admin/supervisor/super_admin: todos los de la empresa
        const { data: obs } = await supabase
          .from('objetivos')
          .select('*, persona:personas(nombre, apellido)')
          .not('fecha_limite', 'is', null)
          .order('fecha_limite')

        const { data: pers } = await supabase
          .from('personas')
          .select('id, nombre, apellido')
          .order('apellido')

        setObjetivos(obs ?? [])
        setPersonas(pers ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

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

  // Filtrar objetivos por persona seleccionada
  const obsFiltrados = filtroPersona === 'todos'
    ? objetivos
    : objetivos.filter(o => o.persona_id === filtroPersona)

  // Agrupar por día del mes actual
  function obsDelDia(dia: number) {
    const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return obsFiltrados.filter(o => o.fecha_limite?.startsWith(fecha))
  }

  const obsSeleccionados = selectedDay ? obsDelDia(selectedDay) : []

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 mt-1">Vencimientos de objetivos por fecha.</p>
        </div>
        {rol !== 'empleado' && personas.length > 0 && (
          <select
            className="traza-input w-auto"
            value={filtroPersona}
            onChange={e => { setFiltroPersona(e.target.value); setSelectedDay(null) }}
          >
            <option value="todos">Todos los colaboradores</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
            ))}
          </select>
        )}
      </div>

      <div className="traza-card overflow-hidden">
        {/* Navegación mes */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} strokeWidth={1.75} className="text-gray-600" />
          </button>
          <h2 className="font-semibold text-gray-900 text-lg">
            {MESES[mes]} {año}
          </h2>
          <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} strokeWidth={1.75} className="text-gray-600" />
          </button>
        </div>

        {/* Grilla */}
        <div className="p-4">
          {/* Cabecera días */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Días del mes */}
            {Array.from({ length: totalDias }).map((_, i) => {
              const dia = i + 1
              const obs = obsDelDia(dia)
              const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
              const isSelected = selectedDay === dia

              return (
                <button
                  key={dia}
                  onClick={() => setSelectedDay(isSelected ? null : dia)}
                  className={`
                    relative min-h-[72px] rounded-xl p-2 text-left transition-all border
                    ${isSelected ? 'border-traza-700 bg-traza-50' : 'border-transparent hover:bg-gray-50'}
                  `}
                >
                  <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${esHoy ? 'bg-traza-700 text-white' : 'text-gray-700'}
                  `}>
                    {dia}
                  </span>

                  {/* Pills de objetivos */}
                  <div className="mt-1 space-y-0.5">
                    {obs.slice(0, 3).map(o => (
                      <div
                        key={o.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate font-medium ${getEstadoClasses(o.estado)}`}
                        title={o.titulo}
                      >
                        {o.titulo}
                      </div>
                    ))}
                    {obs.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{obs.length - 3} más</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

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
            {selectedDay} de {MESES[mes]} — {obsSeleccionados.length === 0 ? 'Sin vencimientos' : `${obsSeleccionados.length} objetivo${obsSeleccionados.length > 1 ? 's' : ''}`}
          </h3>
          {obsSeleccionados.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay objetivos que venzan este día.</p>
          ) : (
            <div className="space-y-3">
              {obsSeleccionados.map(o => (
                <div key={o.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
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
