import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isAuthRoute   = path.startsWith('/login')
  const isPublicRoute = path === '/'
    || path.startsWith('/p/')
    || path.startsWith('/empleadores')
    || path.startsWith('/validar')
    || path.startsWith('/registro')
    || path.startsWith('/onboarding')
    || path.startsWith('/logout')
    || path.startsWith('/colaborar')
    || path.startsWith('/confirmar-validacion')
    || path.startsWith('/feedback-cliente')
    || path.startsWith('/verificar-supervisor')
    || path.startsWith('/demo')
    || path.startsWith('/api/demo')
    || path.startsWith('/api/validar')
    || path.startsWith('/api/confirmar-validacion')
    || path.startsWith('/recuperar-contrasena')
    || path.startsWith('/nueva-contrasena')
    || path.startsWith('/politica-de-privacidad')
    || path.startsWith('/terminos-y-condiciones')
    || path.startsWith('/checkout')
    || path.startsWith('/pago-exitoso')
    || path.startsWith('/api/checkout')
    || path.startsWith('/api/webhooks/mercadopago')

  // Rutas públicas y de auth no necesitan verificar sesión con Supabase
  // (evita que el SDK de Supabase redireccione a su página de auth propia)
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next({ request })
  }

  // ── Rutas protegidas: verificar sesión ───────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Si el cliente Supabase falla (ej. key incompatible), redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si no hay sesión → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Control de roles ─────────────────────────────────────────────
  // Rutas que solo pueden ver admin/supervisor (NO empleados ni individuos)
  const soloManagers = [
    '/empresas', '/personas', '/equipo',
    '/objetivos', '/validacion', '/analytics', '/reportes',
  ]
  const esSoloManagers = soloManagers.some(r => path.startsWith(r))

  if (esSoloManagers) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle()

    const rol = profile?.rol ?? 'empleado'
    const rolesPermitidos = ['super_admin', 'admin', 'supervisor']

    if (!rolesPermitidos.includes(rol)) {
      // Empleado intentando acceder a sección restringida → su dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  // ─────────────────────────────────────────────────────────────────

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
