import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'traza — Performance Intelligence',
    template: '%s · traza',
  },
  description: 'Desempeño profesional verificable. Registrá objetivos, validá resultados y construí un historial basado en evidencia real.',
  icons: {
    icon: '/favicon.ico',
  },
  themeColor: '#1C2B90',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
