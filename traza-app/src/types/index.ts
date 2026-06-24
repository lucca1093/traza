// ============================================================
// TRAZA - TypeScript Types
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'empleado'

export interface Empresa {
  id: string
  nombre: string
  rubro: string | null
  logo_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  empresa_id: string | null
  nombre: string | null
  apellido: string | null
  cargo: string | null
  area: string | null
  supervisor_id: string | null
  rol: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Persona {
  id: string
  empresa_id: string
  user_id: string | null
  nombre: string
  apellido: string
  cargo: string | null
  area: string | null
  supervisor_id: string | null
  created_at: string
}

export type Prioridad = 'Alta' | 'Media' | 'Baja'
export type EstadoObjetivo = 'Pendiente' | 'En progreso' | 'Completado'
export type TipoObjetivo = 'Asignado' | 'Personal'
export type ResultadoValidacion = 'De acuerdo' | 'Parcialmente de acuerdo' | 'En desacuerdo'
export type CategoriaObjetivo = 'Resultado' | 'Eficiencia' | 'Aprendizaje' | 'Hábito'

export interface Objetivo {
  id: string
  empresa_id: string
  persona_id: string | null
  creado_por: string | null
  titulo: string
  descripcion: string | null
  prioridad: Prioridad
  fecha_limite: string | null
  estado: EstadoObjetivo
  tipo: TipoObjetivo
  categoria: CategoriaObjetivo
  progreso: number
  evidencia_url: string | null
  validacion: ResultadoValidacion | null
  validado_por: string | null
  comentario_supervisor: string | null
  validacion_admin: ResultadoValidacion | null
  validacion_admin_por: string | null
  comentario_admin: string | null
  autoevaluacion?: string | null
  comentario_empleado?: string | null
  created_at: string
  updated_at: string
  // joins opcionales
  persona?: Persona
}

export interface Evidencia {
  id: string
  objetivo_id: string
  empresa_id: string
  tipo: 'archivo' | 'link'
  url: string
  nombre: string | null
  created_at: string
}

// Índice Traza calculado
export interface IndiceTraza {
  score: number           // 0-100 (compuesto)
  nivel: NivelTraza
  badge: string
  cumplimiento: number    // porcentaje de completados sobre total
  total: number
  completados: number
  positivos: number
  parciales: number
  negativos: number
  // Módulos del Índice v2
  moduloA: number         // Calidad de validación multi-fuente (0-100)
  moduloB: number         // Cumplimiento ajustado por vencimiento (0-100)
  moduloC: number         // Consistencia autoevaluación (0-100)
}

export type NivelTraza = 'Elite' | 'Avanzado' | 'Profesional' | 'Inicial'

// Para analytics
export interface RankingEmpleado {
  persona: Persona
  indice: IndiceTraza
}

export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}
