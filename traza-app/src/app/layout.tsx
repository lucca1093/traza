import type { Metadata } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'TRAZA — Tu historial profesional verificado',
    template: '%s · TRAZA',
  },
  description: 'Registrá objetivos, validá resultados y construí un historial de desempeño verificado y portátil. Tu récord profesional, tuyo para siempre.',
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/favicon-16x16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/favicon-32x32.png',  sizes: '32x32',  type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type:        'website',
    url:         APP_URL,
    title:       'TRAZA — Tu historial profesional verificado',
    description: 'Registrá objetivos, validá resultados y construí un historial de desempeño verificado y portátil.',
    siteName:    'TRAZA',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TRAZA — Performance Intelligence' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'TRAZA — Tu historial profesional verificado',
    description: 'Registrá objetivos, validá resultados y construí un historial de desempeño verificado y portátil.',
    images:      ['/og-image.png'],
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
