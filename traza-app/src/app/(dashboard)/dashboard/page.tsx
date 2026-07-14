import { createClient } from '@/lib/supabase-server'
import MetricCard from '@/components/ui/MetricCard'
import { calcularIndiceTraza, calcularRacha, getEstadoClasses, formatFecha, detectarDiscrepancia } from '@/lib/traza'
import { AlertTriangle, Clock, MessageSquare, Link2, Paperclip, CheckCircle2, TrendingUp } from 'lucide-react'
import type { Objetivo } from '@/types'
import Link from 'next/link'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import CareerInsightsCard from '@/components/CareerInsightsCard'

const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"

function diasRestantes(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fin  = new Date(fecha); fin.setHours(0, 0, 0, 0)
  return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function ScoreColor(score: number) {
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function BarColors(val: number) {
  if (val >= 75) return { bg: '#dcfce7', fill: '#22c55e' }
  if (val >= 50) return { bg: '#fef3c7', fill: '#f59e0b' }
  return { bg: '#fee2e2', fill: '#ef4444' }
}

/* ── Sección header reutilizable ── */
function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <div>
        <h2
          className="text-base font-semibold"
          style={{ color: '#0F172A', fontFamily: DISPLAY, letterSpacing: '-0.01em' }}
        >
          {title}
        </h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  // Usuario independiente — fallback a datos de personas
  if (!profileData || profileData.rol === 'individuo' || !profileData.empresa_id) {
    const nombre = profileData?.nombre ?? user!.email?.split('@')[0] ?? 'Profesional'

    // Traemos TODAS las filas de personas del usuario (no solo empleo activo)
    // para calcular el score global de toda su carrera, igual que la credencial.
    const { data: todasPersonas } = await supabase
      .from('personas').select('id, nombre, apellido, traza_id')
      .eq('user_id', user!.id)
    const personaActiva = todasPersonas?.find(p => (p as any).empleo_activo !== false)
                          ?? todasPersonas?.[0]
                          ?? null

    // Combinamos objetivos y avances de todas las empresas
    let todosObjs: Objetivo[]  = []
    let todosAvances: any[]    = []
    for (const p of (todasPersonas ?? [])) {
      const [{ data: o }, { data: a }] = await Promise.all([
        supabase.from('objetivos').select('*').eq('persona_id', p.id),
        supabase.from('objetivo_avances').select('persona_id, creado_en').eq('persona_id', p.id),
      ])
      todosObjs    = [...todosObjs, ...(o ?? []) as Objetivo[]]
      todosAvances = [...todosAvances, ...(a ?? [])]
    }

    const persona  = personaActiva
    const indice   = calcularIndiceTraza(todosObjs, todosAvances)
    const sinDatos = todosObjs.length === 0

    return (
      <div className="space-y-7">
        <div className="traza-page-header">
          <div>
            <h1 className="traza-page-title">Buen día, {profileData?.nombre ?? persona?.nombre ?? nombre}</h1>
            <p className="traza-page-sub capitalize">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* ── Checklist de primeros pasos (solo para nuevos) ── */}
        <OnboardingChecklist />

        {/* ── Score personal ────────────────────────────────── */}
        <div id="demo-indice-card" className="traza-card overflow-hidden">
          <CardHeader
            title="Índice Traza"
            sub="Tu desempeño profesional verificado"
            right={
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: '#EEF2FF', color: '#3350D0' }}
              >
                {indice.badge}
              </span>
            }
          />
          <div className="px-6 py-6 flex items-center gap-8">
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 48, fontWeight: 900, color: sinDatos ? '#CBD5E1' : ScoreColor(indice.score), lineHeight: 1 }}>
                {sinDatos ? '—' : indice.score}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>de 100</p>
            </div>
            <div className="flex-1 space-y-3">
              {sinDatos ? (
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  Cargá tu primer objetivo para empezar a construir tu índice.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                    <span>Objetivos totales</span><span className="font-bold" style={{ color: '#0F172A' }}>{indice.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                    <span>Completados</span><span className="font-bold" style={{ color: '#0F172A' }}>{indice.completados}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                    <span>Validados positivos</span><span className="font-bold" style={{ color: '#16a34a' }}>{indice.positivos}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── CTA credencial pública ─────────────────────────── */}
        {persona?.traza_id && !sinDatos && (
          <div id="demo-credencial-cta" style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Tu historial profesional te pertenece.
              </p>
              <p style={{ color: '#BBC5F7', fontSize: 13, marginBottom: 16 }}>
                Compartí tu credencial verificada con empleadores o colegas.
              </p>
              <a
                href={`/p/${persona.traza_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                Ver credencial pública <CheckCircle2 size={13} />
              </a>
            </div>
          </div>
        )}

        {/* ── Insights de carrera con IA ─────────────────────── */}
        {!sinDatos && <CareerInsightsCard />}
      </div>
    )
  }

  const profile = profileData
  const esAdmin  = ['admin', 'super_admin', 'supervisor'].includes(profile.rol)
  const empresaId = profile.empresa_id

  /* ════════════════════════════════════════
     VISTA ADMIN / SUPERVISOR
  ════════════════════════════════════════ */
  if (esAdmin) {
    const { count: totalPersonas } = await supabase
      .from('personas').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .eq('empleo_activo', true)

    const { data: objetivos } = await supabase
      .from('objetivos').select('*')
      .eq('empresa_id', empresaId)

    const objs        = (objetivos ?? []) as Objetivo[]
    const totalObjs   = objs.length
    const completados = objs.filter(o => o.estado === 'Completado').length
    const cumplimiento = totalObjs > 0 ? Math.round(completados / totalObjs * 100) : 0
    const pendValidar  = objs.filter(o => o.estado === 'Completado' && !o.validacion).length

    const objsConDiscrepancia = objs.filter(o => {
      if (!o.autoevaluacion || !o.validacion) return false
      return detectarDiscrepancia(o.autoevaluacion, o.validacion) === 'alta'
    })
    const objsCalBaja = objs.filter(o =>
      o.validacion === 'En desacuerdo' && !objsConDiscrepancia.find(d => d.id === o.id)
    )

    const { data: avancesEquipo } = await supabase
      .from('objetivo_avances')
      .select('*, objetivo:objetivos!inner(id, titulo, estado, validacion, empresa_id), persona:personas(nombre, apellido)')
      .eq('objetivo.empresa_id', empresaId)
      .order('creado_en', { ascending: false })
      .limit(8)

    const lunes = (() => {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      return d.toISOString().split('T')[0]
    })()

    const { data: cierres } = await supabase
      .from('cierres_semanales')
      .select('*, persona:personas!inner(nombre, apellido, empresa_id)')
      .eq('persona.empresa_id', empresaId)
      .eq('semana', lunes)
      .order('creado_en', { ascending: false })

    return (
      <div className="space-y-7">

        {/* ── Page header ───────────────────────────────── */}
        <div className="traza-page-header">
          <div>
            <h1 className="traza-page-title">
              Buen día, {profile.nombre}
            </h1>
            <p className="traza-page-sub capitalize">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* ── Métricas ───────────────────────────────────── */}
        <div id="demo-metricas-equipo" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon="Users"       label="Colaboradores activos" value={totalPersonas ?? 0} />
          <MetricCard icon="Target"      label="Objetivos activos"     value={totalObjs - completados} />
          <MetricCard icon="CheckSquare" label="Completados"           value={completados} />
          <MetricCard icon="TrendingUp"  label="Cumplimiento"          value={`${cumplimiento}%`} highlight />
        </div>

        {/* ── Alerta: pendientes de validar ─────────────── */}
        {pendValidar > 0 && (
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <AlertTriangle size={15} strokeWidth={1.75} style={{ color: '#D97706' }} />
              </div>
              <p className="text-sm" style={{ color: '#92400E' }}>
                <span className="font-semibold">{pendValidar} objetivo{pendValidar > 1 ? 's' : ''}</span>{' '}
                completado{pendValidar > 1 ? 's' : ''} esperan validación.
              </p>
            </div>
            <Link
              href="/validacion"
              className="flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#FDE68A', color: '#92400E' }}
            >
              Validar →
            </Link>
          </div>
        )}

        {/* ── Alertas de discrepancia ───────────────────── */}
        {(objsConDiscrepancia.length > 0 || objsCalBaja.length > 0) && (
          <div className="traza-card overflow-hidden">
            <div
              className="px-6 py-3 flex items-center gap-2.5"
              style={{ backgroundColor: '#FFF5F5', borderBottom: '1px solid #FEE2E2' }}
            >
              <AlertTriangle size={15} strokeWidth={1.75} style={{ color: '#DC2626' }} />
              <h2
                className="text-sm font-semibold"
                style={{ color: '#DC2626', fontFamily: DISPLAY }}
              >
                Alertas que requieren atención
              </h2>
            </div>
            <div>
              {objsConDiscrepancia.map((obj: any) => (
                <div
                  key={obj.id}
                  className="px-6 py-4 flex items-start gap-4"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#DC2626' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{obj.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {obj.persona ? `${obj.persona?.nombre ?? ''} ${obj.persona?.apellido ?? ''} · ` : ''}
                      Alta discrepancia — autoevaluación ({obj.autoevaluacion}) vs validación ({obj.validacion})
                    </p>
                  </div>
                  <Link
                    href="/validacion"
                    className="flex-shrink-0 text-xs font-semibold hover:underline"
                    style={{ color: '#DC2626' }}
                  >
                    Revisar →
                  </Link>
                </div>
              ))}
              {objsCalBaja.map((obj: any) => (
                <div
                  key={obj.id}
                  className="px-6 py-4 flex items-start gap-4"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#D97706' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{obj.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      Calificación baja — supervisor marcó "En desacuerdo"
                    </p>
                  </div>
                  <Link
                    href="/validacion"
                    className="flex-shrink-0 text-xs font-semibold hover:underline"
                    style={{ color: '#D97706' }}
                  >
                    Revisar →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cierres semanales ─────────────────────────── */}
        {cierres && cierres.length > 0 && (
          <div className="traza-card overflow-hidden">
            <CardHeader
              title="Cierres semanales"
              sub={`${cierres.length} colaborador${cierres.length > 1 ? 'es' : ''} completaron el cierre de esta semana`}
            />
            <div>
              {(cierres as any[]).map((c: any) => (
                <div
                  key={c.id}
                  className="px-6 py-5"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                >
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: '#0F172A', fontFamily: DISPLAY }}
                  >
                    {c.persona?.nombre} {c.persona?.apellido}
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    {c.que_avance && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                          style={{ color: '#94A3B8' }}
                        >
                          Avanzó
                        </p>
                        <p className="text-sm" style={{ color: '#334155' }}>{c.que_avance}</p>
                      </div>
                    )}
                    {c.que_obstaculos && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                          style={{ color: '#94A3B8' }}
                        >
                          Obstáculos
                        </p>
                        <p className="text-sm" style={{ color: '#334155' }}>{c.que_obstaculos}</p>
                      </div>
                    )}
                    {c.que_necesito && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                          style={{ color: '#94A3B8' }}
                        >
                          Necesita
                        </p>
                        <p className="text-sm" style={{ color: '#334155' }}>{c.que_necesito}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Feed de actividad ─────────────────────────── */}
        <div id="demo-actividad-equipo" className="traza-card overflow-hidden">
          <CardHeader
            title="Actividad del equipo"
            sub="Avances registrados por colaboradores, del más reciente al más antiguo"
          />
          {avancesEquipo && avancesEquipo.length > 0 ? (
            <div>
              {avancesEquipo.map((a: any) => (
                <div
                  key={a.id}
                  className="px-6 py-4 flex gap-3"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {a.tipo === 'comentario' && (
                      <MessageSquare size={15} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
                    )}
                    {a.tipo === 'link' && (
                      <Link2 size={15} strokeWidth={1.75} style={{ color: '#3350D0' }} />
                    )}
                    {a.tipo === 'archivo' && (
                      <Paperclip size={15} strokeWidth={1.75} style={{ color: '#F97316' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                        {a.persona?.nombre} {a.persona?.apellido}
                      </p>
                      <span style={{ color: '#CBD5E1' }}>·</span>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {new Date(a.creado_en).toLocaleString('es-AR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs" style={{ color: '#94A3B8' }}>en</span>
                      <Link
                        href={`/objetivos?objetivo=${a.objetivo?.id}`}
                        className="text-xs font-semibold hover:underline truncate"
                        style={{ color: '#3350D0' }}
                      >
                        {a.objetivo?.titulo}
                      </Link>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-md font-medium ${getEstadoClasses(a.objetivo?.estado)}`}
                      >
                        {a.objetivo?.estado}
                      </span>
                    </div>

                    {a.tipo === 'comentario' ? (
                      <p className="text-sm" style={{ color: '#475569' }}>{a.contenido}</p>
                    ) : (
                      <a
                        href={a.contenido}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline break-all"
                        style={{ color: '#3350D0' }}
                      >
                        {a.contenido}
                      </a>
                    )}

                    {a.objetivo?.estado === 'Completado' && !a.objetivo?.validacion && (
                      <Link
                        href={`/validacion?objetivo=${a.objetivo?.id}&back=dashboard`}
                        className="inline-flex items-center mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                      >
                        Pendiente de validación →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm px-6 py-8" style={{ color: '#94A3B8' }}>
              El equipo aún no registró avances.
            </p>
          )}
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════
     VISTA EMPLEADO
  ════════════════════════════════════════ */
  const { data: persona } = await supabase
    .from('personas').select('id').eq('user_id', user!.id).single()

  const { data: misObjetivos } = await supabase
    .from('objetivos').select('*').eq('persona_id', persona?.id ?? '')

  const objs = (misObjetivos ?? []) as Objetivo[]

  const { data: todosAvances } = await supabase
    .from('objetivo_avances')
    .select('persona_id, creado_en')
    .eq('persona_id', persona?.id ?? '')
    .order('creado_en', { ascending: true })

  const indice = calcularIndiceTraza(objs, todosAvances ?? [])
  const racha  = calcularRacha(todosAvances ?? [])

  function explicarDimension(key: 'A' | 'B' | 'C' | 'D' | 'E', val: number): string {
    if (key === 'A') {
      if (objs.filter(o => o.validacion).length === 0) return 'Todavía no tenés objetivos validados por el manager'
      if (val >= 80) return 'Tus objetivos tienen validaciones positivas del manager'
      if (val >= 50) return 'Algunos objetivos tienen validaciones parciales o negativas'
      return 'Varios objetivos tienen validaciones negativas del manager'
    }
    if (key === 'B') {
      const hoy = new Date()
      const vencidos = objs.filter(o => !(o as any).es_continuo && o.fecha_limite && new Date(o.fecha_limite) < hoy)
      if (vencidos.length === 0) return 'Sin objetivos vencidos — buen cumplimiento de fechas'
      if (val >= 80) return 'Completás la mayoría de tus objetivos antes del vencimiento'
      if (val >= 50) return 'Algunos objetivos vencieron sin completarse'
      return 'Varios objetivos vencieron sin completarse'
    }
    if (key === 'C') {
      if (!todosAvances?.length) return 'No registraste avances todavía'
      const hoy = new Date()
      const ultimoAvance = todosAvances[todosAvances.length - 1]
      const diasSinActividad = ultimoAvance
        ? Math.floor((hoy.getTime() - new Date(ultimoAvance.creado_en).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      if (diasSinActividad > 14) return `Hace ${diasSinActividad} días que no registrás avances`
      if (val >= 80) return 'Registrás avances de forma consistente semana a semana'
      if (val >= 50) return 'Tu regularidad en el registro de avances es moderada'
      return 'La regularidad de tus avances puede mejorar'
    }
    if (key === 'D') {
      if (objs.filter(o => o.validacion && (o as any).autoevaluacion).length === 0) return 'Sin suficientes datos para medir alineación'
      if (val >= 80) return 'Tu autoevaluación coincide con la validación del manager'
      if (val >= 50) return 'Hay algunas diferencias entre tu autoevaluación y la del manager'
      return 'Hay discrepancias importantes entre tu autoevaluación y la del manager'
    }
    if (val >= 80) return 'Tu desempeño mejoró respecto al período anterior'
    if (val >= 55) return 'Tu desempeño se mantuvo estable'
    if (val <= 35) return 'Tu desempeño bajó respecto al período anterior'
    return 'Sin suficientes datos para medir tendencia'
  }

  const dimensiones = [
    { key: 'A' as const, label: 'Validaciones', peso: 35, val: indice.moduloA    },
    { key: 'B' as const, label: 'Cumplimiento', peso: 25, val: indice.moduloB    },
    { key: 'C' as const, label: 'Regularidad',  peso: 20, val: indice.moduloC    },
    { key: 'D' as const, label: 'Alineación',   peso: 10, val: indice.alineacion },
    { key: 'E' as const, label: 'Tendencia',    peso: 10, val: indice.evolucion  },
  ]

  const hoy14 = new Date(); hoy14.setDate(hoy14.getDate() + 14)
  const proximos = objs
    .filter(o => o.estado !== 'Completado' && o.fecha_limite)
    .filter(o => new Date(o.fecha_limite!) <= hoy14)
    .sort((a, b) => new Date(a.fecha_limite!).getTime() - new Date(b.fecha_limite!).getTime())

  const conFeedback = objs
    .filter(o => o.validacion)
    .sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
    .slice(0, 3)

  const { data: misAvances } = await supabase
    .from('objetivo_avances')
    .select('*, objetivo:objetivos(titulo)')
    .eq('persona_id', persona?.id ?? '')
    .order('creado_en', { ascending: false })
    .limit(4)

  const scoreColor = ScoreColor(indice.score)

  return (
    <div className="space-y-7">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Buen día, {profile.nombre}</h1>
          <p className="traza-page-sub capitalize">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* ── Estado vacío — primer acceso ───────────────── */}
      {objs.length === 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1C2B90 0%, #3350D0 100%)' }}
        >
          <div className="px-8 py-8">
            <div className="flex items-start gap-5">
              {/* Ícono */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <TrendingUp size={22} strokeWidth={2} style={{ color: '#fff' }} />
              </div>
              <div className="flex-1">
                <h2
                  className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em' }}
                >
                  Empezá a construir tu historial profesional
                </h2>
                <p className="text-sm mb-6" style={{ color: '#BBC5F7', lineHeight: 1.6 }}>
                  Tu Índice Traza se calcula en base a tus objetivos, validaciones y avances.
                  Cargá tu primer objetivo para que tu manager pueda validarlo y tu score empiece a crecer.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/objetivos"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity"
                    style={{ backgroundColor: '#fff', color: '#1C2B90' }}
                  >
                    <CheckCircle2 size={15} /> Cargar primer objetivo
                  </Link>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    Ver guía de inicio →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Métricas ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="Target"      label="Mis objetivos" value={indice.total}               />
        <MetricCard icon="CheckSquare" label="Completados"   value={indice.completados}         />
        <MetricCard icon="TrendingUp"  label="Cumplimiento"  value={`${indice.cumplimiento}%`}  />
        <MetricCard icon="Trophy"      label="Índice Traza"  value={`${indice.score}/100`} highlight />
      </div>

      {/* ── Scoring — Índice Traza breakdown ────────────── */}
      <div className="traza-card overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #F1F5F9' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: '#0F172A', fontFamily: DISPLAY, letterSpacing: '-0.01em' }}
            >
              Tu Índice Traza
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              Cómo se compone tu puntaje actual
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold"
              style={{ color: scoreColor, fontFamily: DISPLAY, letterSpacing: '-0.04em' }}
            >
              {indice.score}
            </span>
            <span className="text-sm" style={{ color: '#CBD5E1' }}>/100</span>
          </div>
        </div>

        <div>
          {dimensiones.map(({ key, label, peso, val }) => {
            const { bg, fill } = BarColors(val)
            const color = val >= 75 ? '#16a34a' : val >= 50 ? '#d97706' : '#dc2626'
            return (
              <div
                key={key}
                className="px-6 py-4"
                style={{ borderBottom: '1px solid #F8FAFC' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{label}</p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{peso}% del score</p>
                  </div>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: bg }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${val}%`, backgroundColor: fill }}
                    />
                  </div>
                  <div className="w-9 text-right flex-shrink-0">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color }}
                    >
                      {val}
                    </span>
                  </div>
                </div>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: '#94A3B8', paddingLeft: '9rem' }}
                >
                  {explicarDimension(key, val)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Racha ───────────────────────────────────────── */}
      <div
        className="traza-card overflow-hidden flex items-center gap-6 px-6 py-5"
        style={{ background: racha >= 4 ? 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)' : undefined }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
          style={{ background: racha > 0 ? 'linear-gradient(135deg, #F97316, #EAB308)' : '#F1F5F9' }}
        >
          {racha > 0 ? '🔥' : '💤'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>
            Racha de actividad
          </p>
          <p className="text-3xl font-bold mt-0.5" style={{ color: racha > 0 ? '#EA580C' : '#CBD5E1', fontFamily: DISPLAY, letterSpacing: '-0.04em' }}>
            {racha} {racha === 1 ? 'semana' : 'semanas'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            {racha === 0 ? 'Registrá un avance esta semana para empezar tu racha' :
             racha === 1 ? '¡Arrancaste! Seguí la semana que viene.' :
             racha < 4  ? `${racha} semanas consecutivas con actividad` :
             racha < 8  ? `🔥 ¡${racha} semanas seguidas! Vas muy bien.` :
             `🏆 Racha élite — ${racha} semanas consecutivas`}
          </p>
        </div>
        {racha >= 2 && (
          <div className="flex-shrink-0 text-right">
            <p className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: '#FED7AA', color: '#9A3412' }}>
              Top {racha >= 8 ? '5%' : racha >= 4 ? '20%' : '40%'}
            </p>
          </div>
        )}
      </div>

      {/* ── Grid 2 cols ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximos vencimientos */}
        <div className="traza-card overflow-hidden">
          <CardHeader
            title="Próximos vencimientos"
            sub="Objetivos que vencen en los próximos 14 días"
          />
          <div className="p-6">
            {proximos.length === 0 ? (
              <div className="traza-empty py-8">
                <div className="traza-empty-icon">
                  <Clock size={20} strokeWidth={1.75} style={{ color: '#CBD5E1' }} />
                </div>
                <p>Sin vencimientos próximos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximos.map(obj => {
                  const dias    = diasRestantes(obj.fecha_limite!)
                  const urgente = dias <= 3
                  const medio   = dias <= 7
                  return (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: '1px solid #F8FAFC' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                          {obj.titulo}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {urgente && <AlertTriangle size={11} style={{ color: '#DC2626' }} />}
                          <p
                            className="text-xs font-medium"
                            style={{
                              color: urgente ? '#DC2626' : medio ? '#D97706' : '#94A3B8',
                            }}
                          >
                            {dias === 0
                              ? 'Vence hoy'
                              : dias < 0
                              ? `Venció hace ${Math.abs(dias)}d`
                              : `${dias} día${dias > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`ml-3 flex-shrink-0 text-xs px-2.5 py-1 rounded-md font-medium ${getEstadoClasses(obj.estado)}`}
                      >
                        {obj.estado}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Feedback del manager */}
        <div className="traza-card overflow-hidden">
          <CardHeader
            title="Feedback del manager"
            sub="Últimas validaciones de tus objetivos"
          />
          <div className="p-6">
            {conFeedback.length === 0 ? (
              <div className="traza-empty py-8">
                <div className="traza-empty-icon">
                  <CheckCircle2 size={20} strokeWidth={1.75} style={{ color: '#CBD5E1' }} />
                </div>
                <p>Todavía no recibiste feedback</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conFeedback.map(obj => (
                  <div
                    key={obj.id}
                    className="py-2.5"
                    style={{ borderBottom: '1px solid #F8FAFC' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-sm font-semibold truncate flex-1"
                        style={{ color: '#0F172A' }}
                      >
                        {obj.titulo}
                      </p>
                      <span className="flex-shrink-0 text-xs font-medium" style={{ color: '#64748B' }}>
                        {obj.validacion === 'De acuerdo'
                          ? 'Validado ✓'
                          : obj.validacion === 'Parcialmente de acuerdo'
                          ? 'Parcial'
                          : obj.validacion}
                      </span>
                    </div>
                    {obj.comentario_supervisor?.trim() && (
                      <p className="text-xs mt-1 italic" style={{ color: '#94A3B8' }}>
                        "{obj.comentario_supervisor}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Mis avances recientes ────────────────────────── */}
      {misAvances && misAvances.length > 0 && (
        <div className="traza-card overflow-hidden">
          <CardHeader title="Mis avances recientes" />
          <div className="p-6">
            <div className="space-y-3">
              {misAvances.map((a: any) => (
                <div
                  key={a.id}
                  className="flex gap-3 py-3"
                  style={{ borderBottom: '1px solid #F8FAFC' }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {a.tipo === 'comentario' && (
                      <MessageSquare size={14} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
                    )}
                    {a.tipo === 'link' && (
                      <Link2 size={14} strokeWidth={1.75} style={{ color: '#3350D0' }} />
                    )}
                    {a.tipo === 'archivo' && (
                      <Paperclip size={14} strokeWidth={1.75} style={{ color: '#F97316' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-0.5 font-medium" style={{ color: '#94A3B8' }}>
                      {a.objetivo?.titulo}
                    </p>
                    {a.tipo === 'comentario' ? (
                      <p className="text-sm" style={{ color: '#334155' }}>{a.contenido}</p>
                    ) : (
                      <a
                        href={a.contenido}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline break-all"
                        style={{ color: '#3350D0' }}
                      >
                        {a.contenido}
                      </a>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>
                      {new Date(a.creado_en).toLocaleString('es-AR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
