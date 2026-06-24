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
// ÍNDICE TRAZA v2 — Fórmula multi-fuente
//
// Compuesto por 3 módulos:
//
// A. Calidad de validación (50%)
//    Promedio ponderado de las 3 fuentes disponibles:
//    - Supervisor (peso 1.0): De acuerdo=1.0 / Parcial=0.5 / Desacuerdo=0.0
//    - Admin (peso 1.0, si existe): misma escala
//    - Autoevaluación (peso 0.5): Satisfecho=1.0 / Parcial=0.5 / Insatisfecho=0.0
//    Solo se consideran objetivos con AL MENOS una validación.
//
// B. Cumplimiento ajustado (30%)
//    Completados / objetivos vencidos (fecha_limite < hoy).
//    Los objetivos sin fecha o con fecha futura NO penalizan.
//    Los Hábitos sin fecha tampoco penalizan.
//
// C. Consistencia (20%)
//    % de objetivos donde autoevaluación y validación supervisor coinciden
//    (o difieren en 1 punto). Discrepancias altas reducen este módulo.
//    Si no hay autoevaluaciones, este módulo es neutro (50).
//
// Score final: A×0.50 + B×0.30 + C×0.20  → escala 0–100
// ============================================================

export function calcularIndiceTraza(objetivos: Objetivo[]): IndiceTraza {
  const total       = objetivos.length
  const completados = objetivos.filter(o => o.estado === 'Completado').length
  const positivos   = objetivos.filter(o => o.validacion === 'De acuerdo').length
  const parciales   = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo').length
  const negativos   = objetivos.filter(o => o.validacion === 'En desacuerdo').length

  const cumplimiento = total > 0 ? Math.round((completados / total) * 1000) / 10 : 0

  // ── Módulo A: Calidad de validación (0–100) ───────────────
  const supScore:  Record<string, number> = { 'De acuerdo': 1.0, 'Parcialmente de acuerdo': 0.5, 'En desacuerdo': 0.0 }
  const adminScore: Record<string, number> = { 'De acuerdo': 1.0, 'Parcialmente de acuerdo': 0.5, 'En desacuerdo': 0.0 }
  const autoScore: Record<string, number> = { 'Satisfecho': 1.0, 'Parcialmente satisfecho': 0.5, 'Insatisfecho': 0.0 }

  const conValidacion = objetivos.filter(o => o.validacion)
  let moduloA = 50 // neutro si no hay validaciones
  if (conValidacion.length > 0) {
    const promedios = conValidacion.map(o => {
      let suma = 0, pesoTotal = 0
      // Supervisor
      if (o.validacion) { suma += supScore[o.validacion] * 1.0; pesoTotal += 1.0 }
      // Admin
      if ((o as any).validacion_admin) { suma += adminScore[(o as any).validacion_admin] * 1.0; pesoTotal += 1.0 }
      // Autoevaluación
      if ((o as any).autoevaluacion) { suma += autoScore[(o as any).autoevaluacion] * 0.5; pesoTotal += 0.5 }
      return pesoTotal > 0 ? suma / pesoTotal : 0.5
    })
    moduloA = Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100)
  }

  // ── Módulo B: Cumplimiento ajustado (0–100) ───────────────
  // Excluye objetivos continuos (es_continuo=true) — hábitos permanentes
  // que no deben penalizar por no completarse en una fecha.
  const hoy = new Date()
  const vencidos = objetivos.filter(o =>
    !(o as any).es_continuo &&
    o.fecha_limite &&
    new Date(o.fecha_limite) < hoy
  )
  let moduloB = 75 // neutro si no hay objetivos vencidos
  if (vencidos.length > 0) {
    const completadosVencidos = vencidos.filter(o => o.estado === 'Completado').length
    moduloB = Math.round((completadosVencidos / vencidos.length) * 100)
  }

  // ── Módulo C: Consistencia autoevaluación (0–100) ─────────
  const conAmbas = objetivos.filter(o => o.validacion && (o as any).autoevaluacion)
  let moduloC = 50 // neutro si no hay autoevaluaciones
  if (conAmbas.length > 0) {
    const sup2num:  Record<string, number> = { 'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0 }
    const auto2num: Record<string, number> = { 'Satisfecho': 2, 'Parcialmente satisfecho': 1, 'Insatisfecho': 0 }
    const consistentes = conAmbas.filter(o => {
      const diff = Math.abs((sup2num[o.validacion!] ?? 1) - (auto2num[(o as any).autoevaluacion] ?? 1))
      return diff <= 1 // coinciden o difieren en 1 punto
    }).length
    moduloC = Math.round((consistentes / conAmbas.length) * 100)
  }

  // ── Score final ───────────────────────────────────────────
  let score = Math.round(moduloA * 0.50 + moduloB * 0.30 + moduloC * 0.20)
  score = Math.max(0, Math.min(100, score))

  const nivel = getNivel(score)

  return {
    score, nivel, badge: getBadge(nivel), cumplimiento,
    total, completados, positivos, parciales, negativos,
    // Módulos para mostrar en la credencial
    moduloA, moduloB, moduloC,
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
    'Completado':  'bg-green-100 text-green-700',
    'En progreso': 'bg-yellow-100 text-yellow-700',
    'Pendiente':   'bg-red-100 text-red-700',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-600'
}

export function getPrioridadClasses(prioridad: string): string {
  const map: Record<string, string> = {
    'Alta':  'bg-red-100 text-red-700',
    'Media': 'bg-yellow-100 text-yellow-700',
    'Baja':  'bg-green-100 text-green-700',
  }
  return map[prioridad] ?? 'bg-gray-100 text-gray-600'
}

export function getValidacionClasses(validacion: string | null): string {
  return 'bg-gray-100 text-gray-500' // legacy, usar getValidacionStyle
}

export function getCategoriaStyle(categoria: string): { backgroundColor: string; color: string; label: string } {
  const map: Record<string, { backgroundColor: string; color: string; label: string }> = {
    'Resultado':    { backgroundColor: '#dbeafe', color: '#1d4ed8', label: 'Resultado'   },
    'Eficiencia':   { backgroundColor: '#d1fae5', color: '#065f46', label: 'Eficiencia'  },
    'Aprendizaje':  { backgroundColor: '#ede9fe', color: '#5b21b6', label: 'Aprendizaje' },
    'Hábito':       { backgroundColor: '#fef3c7', color: '#92400e', label: 'Hábito'      },
  }
  return map[categoria] ?? { backgroundColor: '#f3f4f6', color: '#6b7280', label: categoria }
}

// Detecta discrepancia entre autoevaluación del empleado y validación del supervisor
export function detectarDiscrepancia(
  autoevaluacion: string | null | undefined,
  validacion: string | null | undefined
): 'alta' | 'media' | null {
  if (!autoevaluacion || !validacion) return null

  const autoScore: Record<string, number> = {
    'Satisfecho': 2, 'Parcialmente satisfecho': 1, 'Insatisfecho': 0
  }
  const supScore: Record<string, number> = {
    'De acuerdo': 2, 'Parcialmente de acuerdo': 1, 'En desacuerdo': 0
  }

  const diff = Math.abs((autoScore[autoevaluacion] ?? 1) - (supScore[validacion] ?? 1))
  if (diff === 2) return 'alta'
  if (diff === 1) return 'media'
  return null
}

export function getValidacionStyle(validacion: string | null): { backgroundColor: string; color: string } {
  const map: Record<string, { backgroundColor: string; color: string }> = {
    'De acuerdo':              { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    'Parcialmente de acuerdo': { backgroundColor: '#ede9fe', color: '#6d28d9' },
    'En desacuerdo':           { backgroundColor: '#ffedd5', color: '#c2410c' },
  }
  return map[validacion ?? ''] ?? { backgroundColor: '#f3f4f6', color: '#6b7280' }
}


// ============================================================
// HELPERS DE FECHA
// ============================================================

export function isVencido(fechaLimite: string | null, estado: EstadoObjetivo): boolean {
  if (!fechaLimite || estado === 'Completado') return false
  return new Date(fechaLimite) < new Date()
}

import type { EstadoObjetivo } from '@/types'

export function formatFecha(fecha: string | null): string {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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
  const autoSatisfecho = conAutoeval.filter(o => (o as any).autoevaluacion === 'Satisfecho').length
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
  { label: 'Inicio',               href: '/dashboard',     icon: 'LayoutDashboard', roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Empresas',             href: '/empresas',      icon: 'Building2',       roles: ['super_admin', 'admin'] },
  { label: 'Personas',             href: '/personas',      icon: 'Users',           roles: ['super_admin', 'admin'] },
  { label: 'Mi Trabajo',           href: '/mi-trabajo',    icon: 'Target',          roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Gestión de Objetivos', href: '/objetivos',     icon: 'ClipboardList',   roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Validación',           href: '/validacion',    icon: 'CheckSquare',     roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Calendario',           href: '/calendario',    icon: 'CalendarDays',    roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Analytics',            href: '/analytics',     icon: 'BarChart2',       roles: ['super_admin', 'admin', 'supervisor'] },
  { label: 'Perfil Profesional',   href: '/perfil',        icon: 'User',            roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Talent Card',          href: '/talent-card',   icon: 'Award',           roles: ['super_admin', 'admin', 'supervisor', 'empleado'] },
  { label: 'Reportes',             href: '/reportes',      icon: 'FileText',        roles: ['super_admin', 'admin', 'supervisor'] },
]

export function getNavForRole(rol: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(rol))
}
