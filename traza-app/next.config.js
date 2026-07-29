const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sube los source maps a Sentry para ver el código real (no el compilado)
  // en cada error. Requiere SENTRY_AUTH_TOKEN en Vercel.
  org:     'traza',   // ← cambiá esto por el nombre de tu organización en Sentry
  project: 'traza-app',

  // No muestra logs de Sentry durante el build
  silent: true,

  // Source maps solo en producción, no se incluyen en el bundle del usuario
  hideSourceMaps: true,

  // Deshabilitar si no tenés SENTRY_AUTH_TOKEN configurado todavía
  disableClientWebpackPlugin:  !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin:  !process.env.SENTRY_AUTH_TOKEN,
})
