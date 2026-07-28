'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  function aceptar() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  function rechazar() {
    localStorage.setItem('cookie_consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position:        'fixed',
        bottom:          '20px',
        left:            '50%',
        transform:       'translateX(-50%)',
        zIndex:          9999,
        background:      '#0F172A',
        color:           '#CBD5E1',
        borderRadius:    '14px',
        padding:         '14px 20px',
        display:         'flex',
        alignItems:      'center',
        gap:             '16px',
        flexWrap:        'wrap',
        boxShadow:       '0 8px 32px rgba(0,0,0,0.35)',
        maxWidth:        '640px',
        width:           'calc(100vw - 32px)',
        fontSize:        '13px',
        lineHeight:      '1.5',
      }}
    >
      <p style={{ margin: 0, flex: 1, minWidth: '200px' }}>
        Este sitio usa cookies para funcionar correctamente.{' '}
        <Link href="/politica-de-privacidad" style={{ color: '#8899EE', textDecoration: 'underline' }}>
          Más información
        </Link>
      </p>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={rechazar}
          style={{
            background:   'transparent',
            border:       '1px solid #334155',
            color:        '#94A3B8',
            borderRadius: '8px',
            padding:      '6px 14px',
            fontSize:     '13px',
            cursor:       'pointer',
            fontWeight:   500,
          }}
        >
          Solo necesarias
        </button>
        <button
          onClick={aceptar}
          style={{
            background:   '#1C2B90',
            border:       'none',
            color:        '#ffffff',
            borderRadius: '8px',
            padding:      '6px 16px',
            fontSize:     '13px',
            cursor:       'pointer',
            fontWeight:   600,
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
