import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { calcularIndiceTraza, generarPerfilNarrativo } from '@/lib/traza'
import { ShieldCheck, Users, CheckCircle2, Building2, ArrowRight, Sparkles } from 'lucide-react'
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

  // ── Historial multi-empresa por traza_id ──────────────────
  const trazaIds = [...new Set(personas.map((p: any) => p.traza_id).filter(Boolean))]
  let todasPorTraza: Record<string, any[]> = {}
  if (trazaIds.length > 0) {
    const { data: allP } = await supabase
      .from('personas')
      .select('id, traza_id, fecha_inicio_empleo, empresa:empresas(rubro)')
      .in('traza_id', trazaIds)
    ;(allP ?? []).forEach((p: any) => {
      if (!todasPorTraza[p.traza_id]) todasPorTraza[p.traza_id] = []
      todasPorTraza[p.traza_id].push(p)
    })
  }

  // ── Objetivos y avances en batch ──────────────────────────
  const personaIds = personas.map((p: any) => p.id)
  let obsMap:     Record<string, Objetivo[]> = {}
  let avancesMap: Record<string, any[]>      = {}

  if (personaIds.length > 0) {
    const { data: allObs } = await supabase
      .from('objetivos').select('*').in('persona_id', personaIds)

    ;(allObs ?? []).forEach((o: any) => {
      if (!obsMap[o.persona_id]) obsMap[o.persona_id] = []
      obsMap[o.persona_id].push(o as Objetivo)
    })

    const allObsIds = (allObs ?? []).map((o: any) => o.id)
    if (allObsIds.length > 0) {
      const { data: allAv } = await supabase
        .from('objetivo_avances').select('objetivo_id, creado_en, created_at')
        .in('objetivo_id', allObsIds)

      const obsIdToPid: Record<string, string> = {}
      ;(allObs ?? []).forEach((o: any) => { obsIdToPid[o.id] = o.persona_id })
      ;(allAv ?? []).forEach((a: any) => {
        const pid = obsIdToPid[a.objetivo_id]
        if (pid) {
          if (!avancesMap[pid]) avancesMap[pid] = []
          avancesMap[pid].push(a)
        }
      })
    }
  }

  // ── Construir candidatos ──────────────────────────────────
  const candidatos: CandidatoPublico[] = personas.map((p: any) => {
    const obs    = obsMap[p.id] ?? []
    const avs    = avancesMap[p.id] ?? []
    const indice = calcularIndiceTraza(obs, avs)

    const conVal  = obs.filter((o: Objetivo) => !!o.validacion)
    const positiv = obs.filter((o: Objetivo) => o.validacion === 'De acuerdo').length
    const pctPos  = conVal.length > 0 ? Math.round((positiv / conVal.length) * 100) : 0

    const historial   = todasPorTraza[p.traza_id] ?? [p]
    const fechas      = historial.map((h: any) => h.fecha_inicio_empleo).filter(Boolean) as string[]
    const activoDesde = fechas.length > 0 ? fechas.sort()[0] : (p.created_at ?? null)

    // Sectores únicos de todas las empresas del historial
    const sectores = [...new Set(
      historial.map((h: any) => h.empresa?.rubro ?? (p.empresa as any)?.rubro).filter(Boolean)
    )] as string[]

    // Snippet narrativo local (sin API)
    const narrativaCompleta = generarPerfilNarrativo({
      nombre:   p.nombre,
      apellido: p.apellido,
      cargo:    p.cargo,
      area:     p.area,
      empresa:  (p.empresa as any)?.nombre,
      objetivos: obs,
    })
    const narrativaSnippet = narrativaCompleta.split('.')[0].trim() + '.'

    return {
      trazaId:                  p.traza_id,
      nombre:                   p.nombre,
      apellido:                 p.apellido,
      cargo:                    p.cargo,
      area:                     p.area,
      rubro:                    (p.empresa as any)?.rubro ?? null,
      sectores,
      empresasCount:            historial.length,
      activoDesde,
      score:                    indice.score,
      nivel:                    indice.nivel,
      badge:                    indice.badge,
      moduloA:                  indice.moduloA,
      moduloB:                  indice.moduloB,
      moduloC:                  indice.moduloC,
      alineacion:               indice.alineacion,
      pctValidacionesPositivas: pctPos,
      totalValidaciones:        conVal.length,
      supervisoresCount:        conVal.length,
      narrativaSnippet,
    }
  })

  // ── Stats del pool ────────────────────────────────────────
  const { count: totalPerfiles }    = await supabase.from('personas').select('id', { count: 'exact', head: true }).eq('disponible_para_busqueda', true)
  const { count: totalEmpresas }    = await supabase.from('empresas').select('id', { count: 'exact', head: true })
  const { count: totalValidaciones} = await supabase.from('objetivos').select('id', { count: 'exact', head: true }).not('validacion', 'is', null)

  const avgScore = candidatos.length > 0
    ? Math.round(candidatos.reduce((s, c) => s + c.score, 0) / candidatos.length)
    : 0
  const pctAltoDesempeno = candidatos.length > 0
    ? Math.round((candidatos.filter(c => c.score >= 65).length / candidatos.length) * 100)
    : 0

  const areas  = [...new Set(candidatos.map(c => c.area).filter(Boolean))]  as string[]
  const rubros = [...new Set(candidatos.map(c => c.rubro).filter(Boolean))] as string[]

  return (
    <div style={{ backgroundColor: '#f8fafc' }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b" style={{ backgroundColor: 'rgba(10,22,40,0.97)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3350D0' }}>
              <span className="text-white text-xs font-black">T</span>
            </div>
            <span className="text-white font-black tracking-tight text-sm">TRAZA</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              para Empleadores
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/registro/empresa"
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all text-white"
              style={{ backgroundColor: '#3350D0', border: '1px solid rgba(255,255,255,0.15)' }}>
              Registrar empresa
            </Link>
            <Link href="/login"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(145deg, #060D2E 0%, #0D1850 45%, #3350D0 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={11} className="text-blue-300" />
                <span className="text-xs font-semibold text-blue-200 tracking-wide uppercase">Evaluado por referentes internos, no por el candidato</span>
              </div>

              <h1 className="text-5xl font-black text-white leading-tight mb-5" style={{ letterSpacing: '-0.025em' }}>
                Contratá talento<br />
                <span style={{ color: '#8899EE' }}>verificado,</span><br />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>no declarado.</span>
              </h1>

              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 480 }}>
                Los perfiles que ves aquí fueron construidos por el jefe directo y el equipo, no por el candidato.
                Cada score, cada evaluación, cada dato — viene de quien trabajó con esa persona.
              </p>

              {/* Stats inline */}
              <div className="flex gap-8 flex-wrap mb-8">
                {[
                  { val: `${(totalValidaciones ?? 0) > 0 ? totalValidaciones : '—'}`, label: 'Evaluaciones completadas'  },
                  { val: `${(totalEmpresas ?? 0) > 0 ? totalEmpresas : '—'}`,          label: 'Empresas en la red'        },
                  { val: candidatos.length > 0 ? `${candidatos.length}` : 'Próximamente', label: 'Perfiles disponibles'  },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-3xl font-black text-white">{s.val}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/registro/empresa"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1C2B90, #3350D0)', boxShadow: '0 4px 24px rgba(28,43,144,0.35)' }}>
                  <Sparkles size={15} />
                  Registrar mi empresa gratis
                  <ArrowRight size={15} />
                </Link>
                <a href="#pool"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  Ver el pool de talento ↓
                </a>
              </div>
            </div>

            {/* Mockup de credential card */}
            <div className="hidden lg:block">
              <div className="rounded-2xl p-5 max-w-xs ml-auto"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">Credencial TRAZA · Verificada</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#8899EE' }}>ML</div>
                  <div>
                    <p className="text-white font-bold text-sm">María L.</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Product Manager · Tech</p>
                  </div>
                  <div className="ml-auto text-center">
                    <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>91</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</p>
                  </div>
                </div>
                {[
                  { label: 'Resultados validados', val: 94, color: '#3350D0' },
                  { label: 'Cumplimiento',          val: 100, color: '#16a34a' },
                  { label: 'Proactividad',           val: 78, color: '#7c3aed' },
                  { label: 'Alineación',             val: 90, color: '#0891b2' },
                  { label: 'Evolución',              val: 80, color: '#d97706' },
                ].map(b => (
                  <div key={b.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{b.label}</span>
                      <span style={{ color: b.color }}>{b.val}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${b.val}%`, backgroundColor: b.color }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Construido por su equipo · No por la candidata
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CÓMO FUNCIONA ──────────────────────────────────── */}
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto px-6 py-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cómo funciona TRAZA
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { n: '01', title: 'El empleado registra objetivos', desc: 'Dentro de la plataforma con su empresa: metas, plazos y categorías de trabajo real.' },
                { n: '02', title: 'El jefe directo evalúa cada resultado', desc: 'Al cerrar un objetivo, el responsable del equipo califica el resultado: De acuerdo, Parcialmente o En desacuerdo.' },
                { n: '03', title: 'El sistema calcula el Índice TRAZA', desc: 'Un score 0–100 con 5 dimensiones verificadas: Resultados, Cumplimiento, Proactividad, Alineación y Evolución.' },
                { n: '04', title: 'El empleado comparte su credencial', desc: 'El empleador ve datos reales validados por terceros. El candidato no puede inflar su historial porque no lo armó solo.' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="text-3xl font-black flex-shrink-0" style={{ color: 'rgba(255,255,255,0.08)', lineHeight: 1 }}>{s.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── POOL STATS ───────────────────────────────────────── */}
      <div id="pool" />
      {candidatos.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-8 flex-wrap">
            <div>
              <span className="text-2xl font-black text-gray-900">{candidatos.length}</span>
              <span className="text-sm text-gray-400 ml-2">perfiles disponibles</span>
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div>
              <span className="text-2xl font-black text-gray-900">{avgScore}</span>
              <span className="text-sm text-gray-400 ml-2">score promedio del pool</span>
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div>
              <span className="text-2xl font-black" style={{ color: '#3350D0' }}>{pctAltoDesempeno}%</span>
              <span className="text-sm text-gray-400 ml-2">con score Avanzado o Elite</span>
            </div>
            <div className="ml-auto hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck size={12} className="text-blue-400" />
              Actualizado en tiempo real
            </div>
          </div>
        </div>
      )}

      {/* ── BUSCADOR ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {candidatos.length === 0 ? (
          <div className="text-center py-28 rounded-2xl border border-dashed border-gray-200 bg-white">
            <ShieldCheck size={44} className="mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-gray-500 mb-2">Todavía no hay perfiles públicos</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Los profesionales de TRAZA pueden activar su visibilidad desde su perfil interno.
              Cuando lo hagan, aparecerán aquí con su score verificado.
            </p>
          </div>
        ) : (
          <TalentSearch candidatos={candidatos} areas={areas} rubros={rubros} />
        )}
      </div>

      {/* ── CTA EMPRESAS ─────────────────────────────────────── */}
      <div style={{ backgroundColor: '#060D2E' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Para empresas</p>
            <h3 className="text-3xl font-black text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
              ¿Querés que tu equipo<br />también tenga desempeño verificado?
            </h3>
            <p className="mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 480 }}>
              TRAZA mide el rendimiento real con objetivos evaluados por el equipo directo, evidencia concreta y un score transparente. Cada persona construye su historial mientras trabaja.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ backgroundColor: '#3350D0' }}>
                Empezar con mi equipo
                <ArrowRight size={15} />
              </Link>
              <Link href="/empleadores"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Seguir explorando talento
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#040d1a', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white tracking-tight text-sm">TRAZA</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>· Performance Intelligence Platform</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Actualizado · {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  )
}
