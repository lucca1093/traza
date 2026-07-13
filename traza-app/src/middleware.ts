import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute = request.nextUrl.pathname === '/'
    || request.nextUrl.pathname.startsWith('/p/')
    || request.nextUrl.pathname.startsWith('/empleadores')
    || request.nextUrl.pathname.startsWith('/validar')
    || request.nextUrl.pathname.startsWith('/registro')
    || request.nextUrl.pathname.startsWith('/onboarding')
    || request.nextUrl.pathname.startsWith('/logout')
    || request.nextUrl.pathname.startsWith('/colaborar')
    || request.nextUrl.pathname.startsWith('/confirmar-validacion')
    || request.nextUrl.pathname.startsWith('/feedback-cliente')
    || request.nextUrl.pathname.startsWith('/verificar-supervisor')
    || request.nextUrl.pathname.startsWith('/demo')
    || request.nextUrl.pathname.startsWith('/api/demo')

  // Si no hay sesión y trata de acceder al dashboard → redirigir a login
  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // No redirigir automáticamente desde /login — dejar que el usuario cambie de cuenta

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
