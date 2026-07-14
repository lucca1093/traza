import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type Rol = 'empleado' | 'supervisor' | 'admin' | 'super_admin' | 'individuo'

/**
 * Verifica autenticación y opcionalmente el rol.
 * Devuelve { user, profile, error } donde error es un NextResponse listo para retornar.
 *
 * Uso básico (solo auth):
 *   const { user, error } = await requireAuth()
 *   if (error) return error
 *
 * Uso con roles permitidos:
 *   const { user, profile, error } = await requireAuth(['admin', 'super_admin'])
 *   if (error) return error
 */
export async function requireAuth(rolesPermitidos?: Rol[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }),
    }
  }

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return { user, profile: null, error: null }
  }

  // Verificamos rol en profiles (usuarios de empresa)
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, empresa_id')
    .eq('id', user.id)
    .single()

  // Si no tiene profile, es individuo — verificar si está permitido
  const rolEfectivo = (profile?.rol as Rol) ?? 'individuo'

  if (!rolesPermitidos.includes(rolEfectivo)) {
    return {
      user,
      profile,
      error: NextResponse.json({ error: 'Sin permisos para esta acción.' }, { status: 403 }),
    }
  }

  return { user, profile, error: null }
}
