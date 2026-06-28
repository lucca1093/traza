import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { calcularIndiceTraza } from '@/lib/traza'
import { ShieldCheck, Users, CheckCircle2, Building2 } from 'lucide-react'
import TalentSearch, { type CandidatoPublico } from './TalentSearch'
import type { Objetivo } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmpleadoresPage() {
  const supabase = createAdminClient()

  // ── Candidatos opt-in ──────────────────────────────────────
  const { data: personasRaw } = await supabase
    .from('personas')
    .select('*, empresa:empresas(nombre, rubro)')
    .eq('disponible_para_busqueda', true)
    .eq('empleo_activo', true)
    .order('apellido')

  const personas = personasRaw ?? []

  // ── Todas las personas del mismo traza_id (historial multi-empresa) ──
  const trazaIds = [...new Set(personas.map(p => p.traza_id).filter(Boolean))]

  let todasPersonasPorTraza: Record<string, any[]> = {}
  if (trazaIds.length > 0) {
    const { data: allPersonas } = await supabase
      .from('personas')
      .select('id, traza_id, fecha_inicio_empleo')
      .in('traza_id', trazaIds)
    ;(allPersonas ?? []).forEach(p => {
      if (!todasPersonasPorTraza[p.traza_id]) todasPersonasPorTraza[p.traza_id] = []
      todasPersonasPorTraza[p.traza_id].push(p)
    })
  }

  // ── Objetivos de todos los candidatos ──────────────────────
  const personaIds = personas.map(p => p.id)
  let obsMap: Record<string, Objetivo[]> = {}
  let avancesMap: Record<string, any[]> = {}

  if (personaIds.length > 0) {
    const { data: allObs } = await supabase
      .from('objetivos').select('*').in('persona_id', personaIds)

    ;(allObs ?? []).forEach(o => {
      if (!obsMap[o.persona_id]) obsMap[o.persona_id] = []
      obsMap[o.persona_id].push(o as Objetivo)
    })

    const allObsIds = (allObs ?? []).map(o => o.id)
    if (allObsIds.length > 0) {
      const { data: allAv } = await supabase
        .from('objetivo_avances').select('objetivo_id, creado_en, created_at')
        .in('objetivo_id', allObsIds)

      const obsIdToPersona: Record<string, string> = {}
      ;(allObs ?? []).forEach(o => { obsIdToPersona[o.id] = o.persona_id })
      ;(allAv ?? []).forEach(a => {
        const pid = obsIdToPersona[a.objetivo_id]
        if (pid) {
          if (!avancesMap[pid]) avancesMap[pid] = []
          avancesMap[pid].push(a)
        }
      })
    }
  }

  // ── Calcular scores y armar candidatos ────────────────────
  const candidatos: CandidatoPublico[] = personas.map(p => {
    const obs    = obsMap[p.id] ?? []
    const avs    = avancesMap[p.id] ?? []
    const indice = calcularIndiceTraza(obs, avs)

    const conVal  = obs.filter((o: Objetivo) => !!o.validacion)
    const positiv = obs.filter((o: Objetivo) => o.validacion === 'De acuerdo').length
    const pctPos  = conVal.length > 0 ? Math.round((positiv / conVal.length) * 100) : 0

    // Fecha más antigua de actividad (primera empresa en TRAZA)
    const historial = todasPersonasPorTraza[p.traza_id] ?? [p]
    const fechas    = historial.map((h: any) => h.fecha_inicio_empleo).filter(Boolean) as string[]
    const activoDesde = fechas.length > 0 ? fechas.sort()[0] : p.created_at ?? null

    return {
      trazaId:                    p.traza_id,
      nombre:                     p.nombre,
      apellido:                   p.apellido,
      cargo:                      p.cargo,
      area:                       p.area,
      empresasCount:              historial.length,
      activoDesde,
      score:                      indice.score,
      nivel:                      indice.nivel,
      badge:                      indice.badge,
      moduloA:                    indice.moduloA,
      moduloC:                    indice.moduloC,
      pctValidacionesPositivas:   pctPos,
      totalValidaciones:          conVal.length,
    }
  })

  // ── Stats para el hero ────────────────────────────────────
  const { count: totalPerfiles } = await supabase
    .from('personas').select('id', { count: 'exact', head: true }).eq('disponible_para_busqueda', true)
  const { count: totalEmpresas } = await supabase
    .from('empresas').select('id', { count: 'exact', head: true })
  const { count: totalValidaciones } = await supabase
    .from('objetivos').select('id', { count: 'exact', head: true }).not('validacion', 'is', null)

  const areas = [...new Set(candidatos.map(c => c.area).filter(Boolean))] as string[]

  return (
    <div>
      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 backdrop-blur-sm border-b border-white/10"
        style={{ backgroundColor: 'rgba(15, 33, 62, 0.97)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F4C81' }}>
              <span className="text-white text-xs font-black">T</span>
            </div>
            <span className="text-white font-black tracking-tight">TRAZA</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              para Empleadores
            </span>
          </div>
          <Link href="/login"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
            style={{ color: '#93C5FD', border: '1px solid rgba(147,197,253,0.2)' }}
            onMouseEnter={undefined}>
            Ingresar a la plataforma →
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg, #0a1628 0%, #0F4C81 60%, #1a6bb5 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <ShieldCheck size={12} className="text-blue-300" />
              <span className="text-xs font-medium text-blue-200">Desempeño verificado por terceros</span>
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
              Talento verificado,<br />
              <span style={{ color: '#60A5FA' }}>no declarado.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 560 }}>
              Los perfiles que ves aquí fueron construidos por supervisores reales, no por los propios candidatos.
              Cada score, cada validación, cada dato — viene de alguien que trabajó con esa persona.
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}> El candidato no puede inflar su historial porque no lo armó solo.</strong>
            </p>

            {/* Stats */}
            <div className="flex gap-8 flex-wrap">
              {[
                { val: totalPerfiles ?? 0,     label: 'Perfiles verificados'    },
                { val: totalValidaciones ?? 0, label: 'Validaciones de supervisores' },
                { val: totalEmpresas ?? 0,     label: 'Empresas en la red'      },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black text-white">{s.val.toLocaleString('es-AR')}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck size={18} className="text-blue-400" />,
                title: 'Score real de supervisores',
                desc:  'El Índice TRAZA combina evaluaciones de supervisores, historial de objetivos y consistencia en el tiempo. No es autoevaluado.',
              },
              {
                icon: <Building2 size={18} className="text-blue-400" />,
                title: 'Historial multi-empresa',
                desc:  'Ves el rendimiento en cada empresa donde trabajó, no solo el empleo actual. La trayectoria completa, verificada.',
              },
              {
                icon: <CheckCircle2 size={18} className="text-blue-400" />,
                title: 'Sin CV inflado',
                desc:  'El candidato no armó su perfil. Lo construyeron sus líderes. La asimetría de información se elimina.',
              },
            ].map(p => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  {p.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{p.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BUSCADOR ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Talento disponible</h2>
            <p className="text-gray-500 mt-1 text-sm">
              {candidatos.length === 0
                ? 'Todavía no hay perfiles públicos disponibles.'
                : `${candidatos.length} profesional${candidatos.length !== 1 ? 'es' : ''} con desempeño verificado`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={13} />
            Solo perfiles con opt-in activo
          </div>
        </div>

        {candidatos.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 bg-white">
            <ShieldCheck size={40} className="mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-gray-500 mb-2">No hay perfiles públicos todavía</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Los profesionales de TRAZA pueden activar su visibilidad desde su perfil interno.
              Cuando lo hagan, aparecerán aquí.
            </p>
          </div>
        ) : (
          <TalentSearch candidatos={candidatos} areas={areas} />
        )}
      </div>

      {/* ── CTA EMPRESAS ─────────────────────────────────────── */}
      <div className="border-t border-gray-100" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Para empresas</p>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            ¿Querés que tu equipo también tenga desempeño verificado?
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            TRAZA mide el rendimiento real de tu equipo con objetivos, validaciones de supervisores
            y evidencia concreta. Los empleados construyen su historial de forma transparente.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all"
            style={{ backgroundColor: '#0F4C81' }}>
            Conocer la plataforma →
          </Link>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 tracking-tight">TRAZA</span>
            <span className="text-xs text-gray-400">· Performance Intelligence Platform</span>
          </div>
          <p className="text-xs text-gray-400">
            Datos actualizados en tiempo real · {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  )
}
