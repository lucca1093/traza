import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Captura el 100% de errores, 10% de transacciones de performance
  tracesSampleRate: 0.1,

  // Solo activo en producción
  enabled: process.env.NODE_ENV === 'production',

  // Ignora errores conocidos que no son bugs reales
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
  ],
})
