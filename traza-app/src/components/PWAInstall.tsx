'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showAndroid,    setShowAndroid]    = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)
  const [installed,      setInstalled]      = useState(false)

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // No mostrar si ya fue descartado antes
    if (localStorage.getItem('pwa_dismissed')) return

    // Detectar si ya está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Android / Chrome: escuchar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler as any)

    // iOS: detectar Safari en iPhone/iPad
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
    if (isIOS && isSafari) {
      // Mostrar después de 3 segundos para no ser invasivo
      const t = setTimeout(() => setShowIOS(true), 3000)
      return () => clearTimeout(t)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa_dismissed', '1')
    setShowAndroid(false)
    setShowIOS(false)
  }

  async function instalarAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    dismiss()
  }

  if (installed || (!showAndroid && !showIOS)) return null

  // Banner Android
  if (showAndroid) return (
    <div
      style={{
        position:     'fixed',
        bottom:       '80px',
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       9998,
        background:   '#0F172A',
        color:        '#E2E8F0',
        borderRadius: '16px',
        padding:      '14px 18px',
        display:      'flex',
        alignItems:   'center',
        gap:          '14px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth:     '360px',
        width:        'calc(100vw - 32px)',
        fontSize:     '13px',
      }}
    >
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192x192.png" alt="TRAZA" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">Instalá TRAZA</p>
        <p className="text-xs" style={{ color: '#94A3B8' }}>Accedé desde tu pantalla de inicio</p>
      </div>
      <button
        onClick={instalarAndroid}
        style={{ background: '#1C2B90', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
      >
        Instalar
      </button>
      <button onClick={dismiss} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  )

  // Instrucciones iOS (Safari no permite el prompt automático)
  if (showIOS) return (
    <div
      style={{
        position:     'fixed',
        bottom:       '80px',
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       9998,
        background:   '#0F172A',
        color:        '#E2E8F0',
        borderRadius: '16px',
        padding:      '16px 18px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth:     '340px',
        width:        'calc(100vw - 32px)',
        fontSize:     '13px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-white text-sm">Instalá TRAZA en tu iPhone</p>
        <button onClick={dismiss} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
          <X size={16} />
        </button>
      </div>
      <p style={{ color: '#94A3B8', lineHeight: 1.6 }}>
        Tocá <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> abajo y elegí <strong style={{ color: '#E2E8F0' }}>"Agregar a pantalla de inicio"</strong>
      </p>
      {/* Flecha apuntando hacia abajo */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '20px' }}>↓</div>
    </div>
  )

  return null
}
