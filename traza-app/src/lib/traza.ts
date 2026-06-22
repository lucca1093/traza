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
// ÍNDICE TRAZA
// Fórmula:
//   puntos = completados×10 + positivos×10 + parciales×5 - negativos×10
//   score  = clamp(puntos / (total×20) × 100, 0, 100)
// ============================================================

export function calcularIndiceTraza(objetivos: Objetivo[]): IndiceTraza {
  const total      = objetivos.length
  const completados = objetivos.filter(o => o.estado === 'Completado').length
  const positivos  = objetivos.filter(o => o.validacion === 'De acuerdo').length
  const parciales  = objetivos.filter(o => o.validacion === 'Parcialmente de acuerdo').length
  const negativos  = objetivos.filter(o => o.validacion === 'En desacuerdo').length

  const cumplimiento = total > 0 ? Math.round((completados / total) * 1000) / 10 : 0

  const puntos    = completados * 10 + positivos * 10 + parciales * 5 - negativos * 10
  const maxPuntos = total * 20
  let score = maxPuntos > 0 ? Math.round((puntos / maxPuntos) * 1000) / 10 : 0
  score = Math.max(0, Math.min(100, score))

  const nivel = getNivel(score)

  return { score, nivel, badge: getBadge(nivel), cumplimiento, total, completados, positivos, parciales, negativos }
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

  // Apertura según nivel
  const nombreCompleto = `${nombre} ${apellido}`
  const rolDesc = cargo && area ? `${cargo} en el área de ${area}` : cargo ?? area ?? 'profesional'

  let apertura = ''
  if (score >= 85) {
    apertura = `${nombreCompleto} es un${cargo ? 'a' : ''} ${rolDesc} con desempeño sobresaliente y resultados consistentemente validados por su entorno.`
  } else if (score >= 65) {
    apertura = `${nombreCompleto} se desempeña como ${rolDesc} con un historial sólido de cumplimiento y gestión de objetivos.`
  } else if (score >= 40) {
    apertura = `${nombreCompleto} es un${cargo ? 'a' : ''} ${rolDesc} con trayectoria en desarrollo y capacidad de crecimiento profesional comprobada.`
  } else {
    apertura = `${nombreCompleto} se desempeña como ${rolDesc} y se encuentra en etapa de desarrollo y construcción de su historial de desempeño.`
  }

  // Métricas centrales
  let metricasTexto = ''
  if (total === 0) {
    metricasTexto = 'Aún no registra objetivos completados en la plataforma.'
  } else {
    const pctStr = `${cumplimiento}%`
    metricasTexto = `Su Índice Traza es de ${score}/100 (${badge}), con un ${pctStr} de cumplimiento: ${completados} de ${total} objetivo${total > 1 ? 's' : ''} completado${completados > 1 ? 's' : ''}.`
  }

  // Validaciones
  let validacionTexto = ''
  if (validados.length > 0) {
    if (positivos > 0 && parciales === 0 && negativos === 0) {
      validacionTexto = `La totalidad de sus entregas validadas fueron calificadas positivamente por sus supervisores.`
    } else if (positivos >= parciales && negativos === 0) {
      validacionTexto = `La mayoría de sus entregas fueron validadas positivamente${parciales > 0 ? `, con algunas calificaciones parciales` : ''}.`
    } else if (negativos === 0) {
      validacionTexto = `Sus entregas recibieron validaciones entre positivas y parciales, sin observaciones negativas.`
    } else {
      const pctPos = Math.round((positivos / validados.length) * 100)
      validacionTexto = `El ${pctPos}% de sus entregas validadas recibieron calificación positiva.`
    }
  }

  // Consistencia autoevaluación
  let autoText = ''
  if (consistencia !== null && conAutoeval.length >= 2) {
    if (consistencia >= 80) {
      autoText = `Demuestra alta autoconciencia profesional, con autoevaluaciones consistentes con la perspectiva de sus supervisores.`
    } else if (consistencia >= 50) {
      autoText = `Muestra capacidad de autoevaluación con alineación parcial respecto al feedback recibido.`
    }
  }

  // Empresa actual
  const empresaText = empresa
    ? `Actualmente se desempeña en ${empresa}.`
    : ''

  // Armar párrafo final
  const partes = [apertura, metricasTexto, validacionTexto, autoText, empresaText]
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
