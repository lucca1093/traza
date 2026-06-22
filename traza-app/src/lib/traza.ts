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
  if (!validacion) return 'bg-gray-100 text-gray-500'
  const map: Record<string, string> = {
    'De acuerdo':                 'bg-[#ccfbf1] text-[#0f766e]',
    'Parcialmente de acuerdo':    'bg-[#ede9fe] text-[#6d28d9]',
    'En desacuerdo':              'bg-[#ffedd5] text-[#c2410c]',
  }
  return map[validacion] ?? 'bg-gray-100 text-gray-600'
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
