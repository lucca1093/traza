'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, identifyUser } from '@/lib/posthog'
import { supabase } from '@/lib/supabase'
import posthog from 'posthog-js'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const identified   = useRef(false)

  // Inicializar una sola vez
  useEffect(() => { initPostHog() }, [])

  // Registrar cada cambio de página
  useEffect(() => {
    if (typeof window === 'undefined' || !posthog.__loaded) return
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  // Identificar al usuario cuando hay sesión activa
  useEffect(() => {
    if (identified.current) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('nombre, apellido, rol, empresa_id').eq('id', user.id).single()
        .then(({ data: profile }) => {
          identifyUser(user.id, {
            email:      user.email,
            nombre:     profile?.nombre,
            apellido:   profile?.apellido,
            rol:        profile?.rol,
            empresa_id: profile?.empresa_id,
          })
          identified.current = true
        })
    })
  }, [])

  return <>{children}</>
}
