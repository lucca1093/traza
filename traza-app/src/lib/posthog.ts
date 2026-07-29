// PostHog — wrapper seguro que no rompe el build si el paquete no está instalado

function getph(): any {
  if (typeof window === 'undefined') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('posthog-js').default
  } catch {
    return null
  }
}

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  const ph = getph()
  if (!ph || ph.__loaded) return
  ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview:  false,
    capture_pageleave: true,
    loaded: (p: any) => {
      if (process.env.NODE_ENV === 'development') p.opt_out_capturing()
    },
  })
}

export function identifyUser(userId: string, props?: Record<string, any>) {
  const ph = getph()
  if (!ph?.__loaded) return
  ph.identify(userId, props)
}

export function resetUser() {
  getph()?.reset?.()
}

export function track(event: TrazaEvent, props?: Record<string, any>) {
  const ph = getph()
  if (!ph?.__loaded) return
  ph.capture(event, props)
}

export function pageview(url: string) {
  const ph = getph()
  if (!ph?.__loaded) return
  ph.capture('$pageview', { $current_url: url })
}

export type TrazaEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'invite_sent'
  | 'objective_created'
  | 'objective_completed'
  | 'objective_validated'
  | 'advance_added'
  | 'external_validation_requested'
  | 'external_validation_confirmed'
  | 'team_viewed'
  | 'feedback_sent'
  | 'recognition_given'
  | 'briefing_generated'
  | 'report_exported'
  | 'pdf_generated'
  | 'company_logo_uploaded'
  | 'company_data_updated'
