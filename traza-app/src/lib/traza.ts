// ============================================================
// TRAZA - Lógica de negocio del Índice Traza
// ============================================================

import type { Objetivo, IndiceTraza, NivelTraza } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility para clases condicionales con Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// ÍNDICE TRAZA v3 — Modelo de 5 dimensiones
//
// A. Resultados validados (35%)
//    Promedio ponderado: supervisor (×1.0) + admin (×1.0) + autoevaluación (×0.5)
//    Solo objetivos con al menos una validación.
//
// B. Cumplimiento (25%)
//    % de objetivos vencidos (fecha_limite < hoy) que están Completados.
//    Objetivos sin fecha o futuros no penalizan.
//
// C. Proactividad (20%)
//    Regularidad de avances cargados: % de semanas activas sobre semanas totales
//    desde el primer avance. Premia la constancia, no el volumen.
//
// D. Alineación (10%)
//    % de objetivos donde autoevaluación ↔ supervisor difieren ≤ 1 punto.
//    Alta alineación = autoconciencia profesional.
//
// E. Evolución (10%)
//    Tendencia: mini-score período reciente (últimos 90 días) vs anterior (90–180 días).
//    Quien mejora sube; quien baja baja; sin datos suficientes → neutro (50).
//
// Score final: A×0.35 + B×0.25 + C×0.20 + D×0.10 + E×0.10 → escala 0–100
// ============================================================

export function calcularIndiceTraza(objetivos: Objetivo[], avances: any[] = []): IndiceTraza {
  const total       = objetivos.length
  const completados = objetivos.filter(o => o.estado === 'Completado').length
  const positivos   = objetivos.filter(o => o.validacion === 'De acuerdo').length
  const parciales   = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo').length
  const negativos   = objetivos.filter(o => o.validacion === 'En desacuerdo').length

  const cumplimiento = total > 0 ? Math.round((completados / total) * 1000) / 10 : 0

  // ── Módulo A: Resultados validados (0–100) — peso 35% ─────
  const supScore:   Record<string, number> = { 'De acuerdo': 1.0, 'Parcialmente de acuerdo': 0.5, 'En desacuerdo': 0.0 }
  const adminScore: Record<string, number> = { 'De acuerdo': 1.0, 'Parcialmente de acuerdo': 0.5, 'En desacuerdo': 0.0 }
  const autoScore:  Record<string, number> = { 'De acuerdo': 1.0, 'Parcialmente de acuerdo': 0.5, 'En desacuerdo': 0.0, 'Cumplido': 1.0, 'Parcialmente cumplido': 0.5, 'No cumplido': 0.0 }

  const conValidacion = objetivos.filter(o => o.validacion)
  let moduloA = 50
  if (conValidacion.length > 0) {
    const promedios = conValidacion.map(o => {
      let suma = 0, pesoTotal = 0
      if (o.validacion)             { suma += supScore[o.validacion] * 1.0; pesoTotal += 1.0 }
      if ((o as any).validacion_admin) { suma += adminScore[(o as any).validacion_admin] * 1.0; pesoTotal += 1.0 }
      if ((o as any).autoevaluacion)   { suma += autoScore[(o as any).autoevaluacion] * 0.5; pesoTotal += 0.5 }
      return pesoTotal > 0 ? suma / pesoTotal : 0.5
    })
    moduloA = Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100)
  }

  // ── Módulo B: Cumplimiento (0–100) — peso 25% ─────────────
  const hoy = new Date()
  const vencidos = objetivos.filter(o =>
    !(o as any).es_continuo && o.fecha_limite && new Date(o.fecha_limite) < hoy
  )
  let moduloB = 75
  if (vencidos.length > 0) {
    const completadosVencidos = vencidos.filter(o => o.estado === 'Completado').length
    moduloB = Math.round((completadosVencidos / vencidos.length) * 100)
  }

  // ── Módulo C: Proactividad — regularidad de avances (0–100) — peso 20% ──
  // Mide constancia, no volumen: % de semanas con al menos 1 avance
  // dentro del período activo del empleado en la plataforma.
  let moduloC = 50
  if (avances.length >= 2) {
    const timestamps = avances
      .map(a => new Date(a.creado_en ?? a.created_at).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b)
    if (timestamps.length >= 2) {
      const primerT = timestamps[0]
      const ultimoT = timestamps[timestamps.length - 1]
      const semanasTotales = Math.max(1, Math.ceil((ultimoT - primerT) / (7 * 24 * 60 * 60 * 1000)))
      const semanasConActividad = new Set(
        timestamps.map(t => Math.floor((t - primerT) / (7 * 24 * 60 * 60 * 1000)))
      ).size
      moduloC = Math.round((semanasConActividad / semanasTotales) * 100)
    }
  } else if (avances.length === 1) {
    moduloC = 25
  }

  // ── Módulo D: Alineación autoevaluación ↔ supervisor (0–100) — peso 10% ──
  const val2num: Record<string, number> = {
    'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0,
    'Cumplido': 2, 'Parcialmente cumplido': 1, 'No cumplido': 0,
  }
  const conAmbas = objetivos.filter(o => o.validacion && (o as any).autoevaluacion)
  let alineacion = 50
  if (conAmbas.length > 0) {
    const alineados = conAmbas.filter(o => {
      const diff = Math.abs((val2num[o.validacion!] ?? 1) - (val2num[(o as any).autoevaluacion] ?? 1))
      return diff <= 1
    }).length
    alineacion = Math.round((alineados / conAmbas.length) * 100)
  }

  // ── Módulo E: Evolución / tendencia (0–100) — peso 10% ────
  const hoyMs   = hoy.getTime()
  const hace90  = hoyMs - 90  * 24 * 60 * 60 * 1000
  const hace180 = hoyMs - 180 * 24 * 60 * 60 * 1000

  const miniScore = (objs: Objetivo[]) => {
    if (objs.length === 0) return null
    const comp = objs.filter(o => o.estado === 'Completado').length / objs.length
    const pos  = objs.filter(o => o.validacion === 'De acuerdo').length / objs.length
    return Math.round((comp * 0.5 + pos * 0.5) * 100)
  }

  const recientes  = objetivos.filter(o => {
    const ref = o.fecha_limite ?? (o as any).created_at
    if (!ref) return false
    const t = new Date(ref).getTime()
    return t >= hace90 && t <= hoyMs
  })
  const anteriores = objetivos.filter(o => {
    const ref = o.fecha_limite ?? (o as any).created_at
    if (!ref) return false
    const t = new Date(ref).getTime()
    return t >= hace180 && t < hace90
  })

  let evolucion = 50
  const sReciente  = miniScore(recientes)
  const sAnterior  = miniScore(anteriores)
  if (sReciente !== null && sAnterior !== null && recientes.length >= 2 && anteriores.length >= 2) {
    const delta = sReciente - sAnterior
    if (delta >= 15)      evolucion = 100
    else if (delta >= 5)  evolucion = 80
    else if (delta >= -5) evolucion = 60
    else if (delta >= -15) evolucion = 35
    else                  evolucion = 15
  }

  // ── Score final ───────────────────────────────────────────
  let score = Math.round(
    moduloA * 0.35 +
    moduloB * 0.25 +
    moduloC * 0.20 +
    alineacion * 0.10 +
    evolucion  * 0.10
  )
  score = Math.max(0, Math.min(100, score))

  const nivel = getNivel(score)

  return {
    score, nivel, badge: getBadge(nivel), cumplimiento,
    total, completados, positivos, parciales, negativos,
    moduloA, moduloB, moduloC,
    alineacion, evolucion,
  }
}

function getNivel(score: number): NivelTraza {
  if (score >= 85) return 'Elite'
  if (score >= 65) return 'Avanzado'
  if (score >= 40) return 'Profesional'
  return 'Inicial'
}

function getBadge(nivel: NivelTraza): string {
  const badges: Record<NivelTraza, string> = {
    Elite:        'Elite Performer',
    Avanzado:     'High Performer',
    Profesional:  'Growth Professional',
    Inicial:      'En Desarrollo',
  }
  return badges[nivel]
}

// ============================================================
// COLORES
// ============================================================

export function getNivelClasses(nivel: NivelTraza): string {
  const map: Record<NivelTraza, string> = {
    Elite:       'bg-yellow-50 text-yellow-700 border-yellow-200',
    Avanzado:    'bg-blue-50 text-blue-700 border-blue-200',
    Profesional: 'bg-green-50 text-green-700 border-green-200',
    Inicial:     'bg-gray-50 text-gray-600 border-gray-200',
  }
  return map[nivel]
}

export function getEstadoClasses(estado: string): string {
  const map: Record<string, string> = {
    'Completado':  'bg-gray-100 text-gray-600',
    'En progreso': 'bg-gray-100 text-gray-700',
    'Pendiente':   'bg-gray-50 text-gray-500',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-600'
}

export function getPrioridadClasses(prioridad: string): string {
  const map: Record<string, string> = {
    'Alta':  'bg-gray-900 text-white',
    'Media': 'bg-gray-200 text-gray-700',
    'Baja':  'bg-gray-100 text-gray-500',
  }
  return map[prioridad] ?? 'bg-gray-100 text-gray-600'
}

export function getValidacionClasses(validacion: string | null): string {
  return 'bg-gray-100 text-gray-500' // legacy, usar getValidacionStyle
}

export function getCategoriaStyle(categoria: string): { backgroundColor: string; color: string; label: string } {
  // Todos en el mismo tono neutro del sistema de diseño
  const neutro = { backgroundColor: '#f3f4f6', color: '#374151' }
  const map: Record<string, { backgroundColor: string; color: string; label: string }> = {
    'Resultado':    { ...neutro, label: 'Resultado'   },
    'Eficiencia':   { ...neutro, label: 'Eficiencia'  },
    'Aprendizaje':  { ...neutro, label: 'Aprendizaje' },
    'Hábito':       { ...neutro, label: 'Hábito'      },
  }
  return map[categoria] ?? { ...neutro, label: categoria }
}

// Detecta discrepancia entre autoevaluación del empleado y validación del supervisor
export function detectarDiscrepancia(
  autoevaluacion: string | null | undefined,
  validacion: string | null | undefined
): 'alta' | 'media' | null {
  if (!autoevaluacion || !validacion) return null

  const autoScore: Record<string, number> = {
    'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0,
    'Cumplido': 2, 'Parcialmente cumplido': 1, 'No cumplido': 0,
  }
  const supScore: Record<string, number> = {
    'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0,
  }

  const diff = Math.abs((autoScore[autoevaluacion] ?? 1) - (supScore[validacion] ?? 1))
  if (diff === 2) return 'alta'
  if (diff === 1) return 'media'
  return null
}

export function getValidacionStyle(validacion: string | null): { backgroundColor: string; color: string } {
  return { backgroundColor: '#f3f4f6', color: '#6b7280' }
}


// ============================================================
// TRAZA AUTÓNOMO — Índice de comportamiento observable
//
// No depende de ninguna validación humana.
// Se calcula 100% desde datos de comportamiento en la plataforma.
//
// 5 señales (peso igual, promedio simple):
//   1. Consistencia        — regularidad temporal de avances
//   2. Densidad evidencia  — % avances con archivo o link adjunto
//   3. Proactividad        — avances sin esperar respuesta del supervisor
//   4. Precisión histórica — alineación autoevaluación vs validación
//   5. Progresión          — tasa de completado + progreso promedio
//
// Requiere: objetivos[] + avances[] (objetivo_avances)
// ============================================================

export function calcularIndiceAutonomo(
  objetivos: Objetivo[],
  avances: any[]
): IndiceAutonomo {

  // ── 1. Consistencia ──────────────────────────────────────────
  // Mide la regularidad con que el empleado registra avances.
  // Gap promedio entre avances consecutivos → menor gap = mayor consistencia.
  let consistencia = 0
  if (avances.length >= 2) {
    const fechas = avances
      .map(a => new Date(a.creado_en).getTime())
      .sort((a, b) => a - b)
    const gaps: number[] = []
    for (let i = 1; i < fechas.length; i++) {
      gaps.push((fechas[i] - fechas[i - 1]) / (1000 * 60 * 60 * 24))
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
    if (avgGap <= 5)       consistencia = 100
    else if (avgGap <= 10) consistencia = 85
    else if (avgGap <= 14) consistencia = 70
    else if (avgGap <= 21) consistencia = 50
    else if (avgGap <= 30) consistencia = 30
    else                   consistencia = 15
  } else if (avances.length === 1) {
    consistencia = 20
  }

  // ── 2. Densidad de evidencia ──────────────────────────────────
  // % de avances con tipo 'archivo' o 'link' (evidencia verificable).
  let densidadEvidencia = 0
  if (avances.length > 0) {
    const conEvidencia = avances.filter(a => a.tipo === 'archivo' || a.tipo === 'link').length
    densidadEvidencia = Math.round((conEvidencia / avances.length) * 100)
  }

  // ── 3. Proactividad ───────────────────────────────────────────
  // % de avances que el empleado subió sin esperar respuesta del supervisor.
  // Proxy: avances sin respondido_en (el supervisor nunca respondió ese avance,
  // pero el empleado siguió actualizando de todas formas).
  let proactividad = 0
  if (avances.length > 0) {
    const sinRespuesta = avances.filter(a => !a.respondido_en).length
    proactividad = Math.round((sinRespuesta / avances.length) * 100)
    // Bonus leve si el empleado sube más de 2 avances por objetivo en promedio
    if (objetivos.length > 0 && avances.length / objetivos.length >= 2.5) {
      proactividad = Math.min(100, proactividad + 10)
    }
  }

  // ── 4. Precisión histórica ────────────────────────────────────
  // % de objetivos donde autoevaluación y validación coinciden (o difieren ≤ 1 punto).
  // Mide si el empleado se conoce bien a sí mismo.
  const conAmbas = objetivos.filter(o => o.validacion && (o as any).autoevaluacion)
  let precisionHistorica = 50 // neutro si no hay datos suficientes
  if (conAmbas.length > 0) {
    const score2num: Record<string, number> = {
      'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0,
      'Cumplido': 2, 'Parcialmente cumplido': 1, 'No cumplido': 0,
    }
    const precisos = conAmbas.filter(o => {
      const diff = Math.abs(
        (score2num[o.validacion!] ?? 1) - (score2num[(o as any).autoevaluacion] ?? 1)
      )
      return diff <= 1
    }).length
    precisionHistorica = Math.round((precisos / conAmbas.length) * 100)
  }

  // ── 5. Progresión ─────────────────────────────────────────────
  // Combinación de tasa de completado (60%) + promedio de progreso (40%).
  let progresion = 50
  if (objetivos.length > 0) {
    const completados = objetivos.filter(o => o.estado === 'Completado').length
    const tasaCompletado = completados / objetivos.length
    const avgProgreso = objetivos.reduce((sum, o) => sum + (o.progreso || 0), 0) / objetivos.length
    progresion = Math.round(tasaCompletado * 60 + (avgProgreso / 100) * 40)
  }

  // ── Score final ───────────────────────────────────────────────
  const score = Math.round(
    (consistencia + densidadEvidencia + proactividad + precisionHistorica + progresion) / 5
  )

  return {
    score:             Math.max(0, Math.min(100, score)),
    consistencia,
    densidadEvidencia,
    proactividad,
    precisionHistorica,
    progresion,
  }
}

// ============================================================
// ÍNDICE DUAL — Combina Validado + Autónomo
//
// dual = validado × 0.60 + autónomo × 0.40
// alertaSesgo = autónomo > validado + 20
//   → posible supervisor que no está reconociendo el trabajo
// ============================================================

export function calcularIndiceDual(
  scoreValidado: number,
  indiceAutonomo: IndiceAutonomo
): IndiceDual {
  const dual = Math.round(scoreValidado * 0.6 + indiceAutonomo.score * 0.4)
  const alertaSesgo = indiceAutonomo.score > scoreValidado + 20

  return {
    validado:    scoreValidado,
    autonomo:    indiceAutonomo.score,
    dual:        Math.max(0, Math.min(100, dual)),
    alertaSesgo,
  }
}

// ============================================================
// HELPERS DE FECHA
// ============================================================

export function isVencido(fechaLimite: string | null, estado: EstadoObjetivo): boolean {
  if (!fechaLimite || estado === 'Completado') return false
  return new Date(fechaLimite) < new Date()
}

import type { EstadoObjetivo, IndiceAutonomo, IndiceDual } from '@/types'

export function formatFecha(fecha: string | null): string {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ============================================================
// RACHA — Semanas consecutivas con al menos 1 avance
// ============================================================

export function calcularRacha(avances: any[]): number {
  if (avances.length === 0) return 0

  // Obtener el lunes de la semana que contiene una fecha
  function getLunesDeDate(d: Date): Date {
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

  // Conjunto de lunes (ISO) con actividad
  const semanasConActividad = new Set(
    avances.map(a => isoDate(getLunesDeDate(new Date(a.creado_en ?? a.created_at))))
  )

  const hoy = new Date()
  let semana = getLunesDeDate(hoy)
  let racha = 0

  while (true) {
    if (semanasConActividad.has(isoDate(semana))) {
      racha++
      semana = new Date(semana)
      semana.setDate(semana.getDate() - 7)
    } else {
      break
    }
  }

  return racha
}

// ============================================================
// GENERADOR DE NARRATIVA DE PERFIL (sin API externa)
// ============================================================

export interface PerfilNarrativoInput {
  nombre: string
  apellido: string
  cargo?: string | null
  area?: string | null
  empresa?: string | null
  objetivos: Objetivo[]
}

export function generarPerfilNarrativo(input: PerfilNarrativoInput): string {
  const { nombre, apellido, cargo, area, empresa, objetivos } = input
  const indice = calcularIndiceTraza(objetivos)
  const { score, badge, cumplimiento, total, completados, positivos, parciales, negativos } = indice

  const validados = objetivos.filter(o => !!o.validacion)
  const conAutoeval = objetivos.filter(o => (o as any).autoevaluacion)
  const autoSatisfecho = conAutoeval.filter(o => ['De acuerdo', 'Cumplido'].includes((o as any).autoevaluacion)).length
  const consistencia = conAutoeval.length > 0
    ? Math.round((autoSatisfecho / conAutoeval.length) * 100)
    : null

  // Trimestres con actividad (para medir consistencia en el tiempo)
  const trimestresActivos = new Set(
    objetivos
      .filter(o => o.estado === 'Completado' && o.fecha_limite)
      .map(o => {
        const d = new Date(o.fecha_limite!)
        return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
      })
  ).size

  const nombreCompleto = `${nombre} ${apellido}`
  const rolDesc = cargo && area
    ? `${cargo} en el área de ${area}`
    : cargo ?? area ?? 'profesional'

  // ── Apertura según nivel ──────────────────────────────────────
  let apertura = ''
  if (score >= 85) {
    apertura = `${nombreCompleto} es ${rolDesc} con un historial de desempeño sobresaliente, avalado por validaciones de supervisores en cada etapa de su trabajo.`
  } else if (score >= 65) {
    apertura = `${nombreCompleto} se desempeña como ${rolDesc} con un historial sólido y consistente de cumplimiento de objetivos.`
  } else if (score >= 40) {
    apertura = `${nombreCompleto} trabaja como ${rolDesc} y registra una trayectoria en crecimiento con evidencia concreta de avance profesional.`
  } else {
    apertura = `${nombreCompleto} se desempeña como ${rolDesc} y está construyendo su historial de desempeño verificado en la plataforma.`
  }

  // ── Métricas centrales ────────────────────────────────────────
  let metricasTexto = ''
  if (total === 0) {
    metricasTexto = 'Aún no registra objetivos completados en la plataforma.'
  } else {
    metricasTexto = `Acumula un Índice Traza de ${score}/100 (${badge}), con un ${cumplimiento}% de cumplimiento sobre ${total} objetivo${total > 1 ? 's' : ''} asignado${total > 1 ? 's' : ''}, de los cuales ${completados} fue${completados > 1 ? 'ron' : ''} completado${completados > 1 ? 's' : ''}.`
  }

  // ── Validaciones ──────────────────────────────────────────────
  let validacionTexto = ''
  if (validados.length > 0) {
    const pctPos = Math.round((positivos / validados.length) * 100)
    if (positivos === validados.length) {
      validacionTexto = `La totalidad de sus entregas validadas recibieron calificación positiva de sus supervisores, lo que refleja alineación constante con los estándares de la organización.`
    } else if (pctPos >= 70 && negativos === 0) {
      validacionTexto = `El ${pctPos}% de sus entregas fue calificado positivamente, con el resto recibiendo observaciones parciales pero sin calificaciones negativas.`
    } else if (negativos === 0) {
      validacionTexto = `Sus entregas acumulan calificaciones entre positivas y parciales, sin observaciones negativas por parte de supervisores.`
    } else {
      validacionTexto = `El ${pctPos}% de sus entregas validadas recibieron calificación positiva.`
    }
  }

  // ── Consistencia temporal ─────────────────────────────────────
  let consistenciaTexto = ''
  if (trimestresActivos >= 3) {
    consistenciaTexto = `Su actividad se extiende a lo largo de ${trimestresActivos} trimestres, lo que evidencia continuidad y compromiso sostenido en el tiempo.`
  } else if (trimestresActivos === 2) {
    consistenciaTexto = `Registra actividad en ${trimestresActivos} trimestres consecutivos, mostrando continuidad en su desarrollo profesional.`
  }

  // ── Autoconciencia ────────────────────────────────────────────
  let autoText = ''
  if (consistencia !== null && conAutoeval.length >= 2) {
    if (consistencia >= 80) {
      autoText = `Además, demuestra alta autoconciencia profesional: sus autoevaluaciones son consistentes con el feedback recibido de supervisores.`
    } else if (consistencia >= 50) {
      autoText = `Sus autoevaluaciones muestran alineación parcial con la perspectiva de sus líderes, indicando capacidad de reflexión sobre su propio desempeño.`
    }
  }

  // ── Empresa ───────────────────────────────────────────────────
  const empresaText = empresa
    ? `Actualmente se desempeña en ${empresa}.`
    : ''

  const partes = [apertura, metricasTexto, validacionTexto, consistenciaTexto, autoText, empresaText]
    .filter(Boolean)
    .join(' ')

  return partes
}

// ============================================================
// PERMISOS POR ROL
// ============================================================

import type { UserRole, NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio',               href: '/dashboard',       icon: 'LayoutDashboard', roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Mi Semana',            href: '/mi-semana',       icon: 'CalendarDays',    roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Empresas',             href: '/empresas',        icon: 'Building2',       roles: ['super_admin', 'admin'] },
  { label: 'Personas',             href: '/personas',        icon: 'Users',           roles: ['super_admin', 'admin'] },
  { label: 'Mi Trabajo',           href: '/mi-trabajo',      icon: 'Target',          roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Gestión de Objetivos', href: '/objetivos',       icon: 'ClipboardList',   roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Validación',           href: '/validacion',      icon: 'CheckSquare',     roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Analytics',            href: '/analytics',       icon: 'BarChart2',       roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Buscar Talento',       href: '/buscar-talento',  icon: 'Search',          roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Perfil Profesional',   href: '/perfil',          icon: 'User',            roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Reuniones 1:1',        href: '/reuniones',       icon: 'MessageSquare',   roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Reportes',             href: '/reportes',        icon: 'FileText',        roles: ['super_admin', 'admin', 'supervisor'] },
]

export function getNavForRole(rol: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(rol))
}
