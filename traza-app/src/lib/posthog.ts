import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  if (posthog.__loaded) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview:  false, // lo manejamos manualmente para el App Router
    capture_pageleave: true,
    session_recording: { maskAllInputs: false, maskInputOptions: { password: true } },
    loaded: (ph: any) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
    },
  })
}

// Identifica al usuario cuando hace login
export function identifyUser(userId: string, props?: Record<string, any>) {
  if (typeof window === 'undefined' || !posthog.__loaded) return
  posthog.identify(userId, props)
}

// Resetea cuando hace logout
export function resetUser() {
  if (typeof window === 'undefined' || !posthog.__loaded) return
  posthog.reset()
}

// Eventos clave de Traza
export function track(event: TrazaEvent, props?: Record<string, any>) {
  if (typeof window === 'undefined' || !posthog.__loaded) return
  posthog.capture(event, props)
}

export type TrazaEvent =
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'invite_sent'
  // Objetivos
  | 'objective_created'
  | 'objective_completed'
  | 'objective_validated'
  | 'advance_added'
  // Validaciones
  | 'external_validation_requested'
  | 'external_validation_confirmed'
  // Equipo
  | 'team_viewed'
  | 'feedback_sent'
  | 'recognition_given'
  | 'briefing_generated'
  // Reportes
  | 'report_exported'
  | 'pdf_generated'
  // Empresa
  | 'company_logo_uploaded'
  | 'company_data_updated'
