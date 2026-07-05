/**
 * TRAZA — Tailwind CSS Configuration Extension v1.0
 *
 * En tailwind.config.ts:
 *   import trazaTheme from './brand/tailwind.traza.config.js'
 *   export default { content: [...], theme: { extend: { ...trazaTheme } } }
 */

const trazaTheme = {

  colors: {
    /* ── Primaria — Sapphire Indigo ───────────────────────────────── */
    traza: {
      50:  '#EDEFFD',
      100: '#DDE2FB',
      200: '#BBC5F7',
      300: '#8899EE',
      400: '#5572E5',
      500: '#3350D0',  // interactive / CTA
      600: '#2438B0',  // hover
      700: '#1C2B90',  // brand / logo
      800: '#152070',
      900: '#0D1850',
      950: '#060D2E',
    },

    /* ── Neutral — Slate ─────────────────────────────────────────── */
    slate: {
      50:  '#FFFFFF',
      100: '#F8FAFC',
      200: '#F1F5F9',
      300: '#E2E8F0',
      400: '#CBD5E1',
      500: '#94A3B8',
      600: '#64748B',
      700: '#475569',
      800: '#334155',
      900: '#1E293B',
      950: '#0F172A',
    },

    /* ── Semánticos ──────────────────────────────────────────────── */
    success: {
      50:  '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      700: '#047857',
    },
    warning: {
      50:  '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      700: '#B45309',
    },
    error: {
      50:  '#FFF1F2',
      100: '#FEE2E2',
      500: '#EF4444',
      700: '#B91C1C',
    },
    info: {
      50:  '#F0F9FF',
      100: '#E0F2FE',
      500: '#0EA5E9',
      700: '#0369A1',
    },
  },

  fontFamily: {
    sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
    mono:    ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
  },

  fontSize: {
    xs:   ['0.6875rem',  { lineHeight: '1rem' }],           // 11px
    sm:   ['0.8125rem',  { lineHeight: '1.25rem' }],         // 13px
    base: ['0.9375rem',  { lineHeight: '1.5rem' }],          // 15px
    lg:   ['1.0625rem',  { lineHeight: '1.6rem' }],          // 17px
    xl:   ['1.25rem',    { lineHeight: '1.75rem' }],         // 20px
    '2xl': ['1.5rem',   { lineHeight: '2rem' }],             // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],          // 30px
    '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],           // 36px
    '5xl': ['3rem',     { lineHeight: '1' }],                // 48px
  },

  fontWeight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },

  letterSpacing: {
    tighter: '-0.025em',
    tight:   '-0.015em',
    normal:  '0em',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },

  borderRadius: {
    sm:   '0.375rem',  //  6px
    md:   '0.5rem',    //  8px
    lg:   '0.75rem',   // 12px
    xl:   '1rem',      // 16px
    '2xl': '1.25rem',  // 20px
    full: '9999px',
  },

  boxShadow: {
    xs:       '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm:       '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md:       '0 4px 8px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)',
    lg:       '0 8px 16px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.04)',
    xl:       '0 16px 32px rgba(15, 23, 42, 0.10), 0 8px 16px rgba(15, 23, 42, 0.06)',
    card:     '0 1px 3px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.04)',
    dropdown: '0 8px 24px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
    modal:    '0 24px 48px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.06)',
    focus:    '0 0 0 3px rgba(51, 80, 208, 0.20)',
    'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.20)',
    none:     'none',
  },

  spacing: {
    // Hereda la escala de Tailwind + extras semánticos
    sidebar: '240px',
    topbar:  '56px',
  },

  transitionTimingFunction: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in:      'cubic-bezier(0.4, 0, 1, 1)',
    out:     'cubic-bezier(0, 0, 0.2, 1)',
    spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  transitionDuration: {
    75:  '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
  },

  zIndex: {
    base:     '0',
    raised:   '10',
    dropdown: '100',
    sticky:   '200',
    overlay:  '300',
    modal:    '400',
    toast:    '500',
    tooltip:  '600',
  },

  animation: {
    'fade-in':    'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1)',
    'slide-up':   'slideUp 200ms cubic-bezier(0, 0, 0.2, 1)',
    'slide-down': 'slideDown 200ms cubic-bezier(0, 0, 0.2, 1)',
    'scale-in':   'scaleIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    'spin-slow':  'spin 1.5s linear infinite',
    pulse:        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },

  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to:   { opacity: '1' },
    },
    slideUp: {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to:   { opacity: '1', transform: 'translateY(0)' },
    },
    slideDown: {
      from: { opacity: '0', transform: 'translateY(-8px)' },
      to:   { opacity: '1', transform: 'translateY(0)' },
    },
    scaleIn: {
      from: { opacity: '0', transform: 'scale(0.95)' },
      to:   { opacity: '1', transform: 'scale(1)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%':      { opacity: '0.5' },
    },
  },

};

module.exports = trazaTheme;
