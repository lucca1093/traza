/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Primaria — Sapphire Indigo ───────────────────────────── */
        traza: {
          50:  '#EDEFFD',
          100: '#DDE2FB',
          200: '#BBC5F7',
          300: '#8899EE',
          400: '#5572E5',
          500: '#3350D0',   // interactive / CTA / botones
          600: '#2438B0',   // hover botón
          700: '#1C2B90',   // brand / logo
          800: '#152070',
          900: '#0D1850',
          950: '#060D2E',
        },

        /* ── Neutral — Slate (fondo cool) ────────────────────────── */
        slate: {
          50:  '#FFFFFF',
          100: '#F8FAFC',   // fondo app
          200: '#F1F5F9',   // hover sutil
          300: '#E2E8F0',   // bordes
          400: '#CBD5E1',   // bordes hover
          500: '#94A3B8',   // placeholder / disabled
          600: '#64748B',   // texto secundario
          700: '#475569',   // texto muted
          800: '#334155',
          900: '#1E293B',   // hover sidebar
          950: '#0F172A',   // sidebar bg / texto strong
        },

        /* ── Surface ─────────────────────────────────────────────── */
        surface: {
          bg:     '#F8FAFC',   // fondo principal — off-white frío
          card:   '#FFFFFF',   // cards
          border: '#E2E8F0',   // bordes
        },

        /* ── Ink (tipografía) ────────────────────────────────────── */
        ink: {
          primary:   '#0F172A',  // texto principal
          secondary: '#64748B',  // texto secundario
          muted:     '#94A3B8',  // placeholder
        },

        /* ── Sidebar ─────────────────────────────────────────────── */
        sidebar: {
          bg:     '#0F172A',   // fondo sidebar oscuro
          hover:  '#1E293B',   // hover item
          active: '#1C2B90',   // item activo — traza-700
          text:   '#64748B',   // texto nav inactivo
          bright: '#E2E8F0',   // texto activo / logo
        },

        /* ── Semánticos ──────────────────────────────────────────── */
        success: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50:  '#FFF1F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          700: '#0369A1',
        },

        /* ── Amber (notificaciones) ──────────────────────────────── */
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '0.875rem' }],  // 10px
        xs:    ['0.6875rem', { lineHeight: '1rem' }],       // 11px
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],    // 13px
        base:  ['0.9375rem', { lineHeight: '1.5rem' }],     // 15px
        lg:    ['1.0625rem', { lineHeight: '1.6rem' }],     // 17px
        xl:    ['1.25rem',   { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],       // 24px
        '3xl': ['1.875rem',  { lineHeight: '2.25rem' }],    // 30px
        '4xl': ['2.25rem',   { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem',      { lineHeight: '1' }],          // 48px
      },

      borderRadius: {
        sm:   '0.375rem',  //  6px
        md:   '0.5rem',    //  8px
        lg:   '0.75rem',   // 12px
        xl:   '1rem',      // 16px
        '2xl': '1.25rem',  // 20px
        '3xl': '1.5rem',   // 24px
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
        sidebar: '256px',
        topbar:  '56px',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      animation: {
        'fade-in':  'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0, 0, 0.2, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  safelist: [
    // Colores semánticos dinámicos usados en getEstadoClasses / badges
    'bg-green-50', 'text-green-700', 'border-green-200',
    'bg-blue-50',  'text-blue-700',  'border-blue-200',
    'bg-amber-50', 'text-amber-700', 'border-amber-200',
    'bg-red-50',   'text-red-700',   'border-red-200',
    'bg-gray-50',  'text-gray-500',  'border-gray-200',
    // Colores de categorías
    'bg-teal-100',   'text-teal-700',
    'bg-violet-100', 'text-violet-700',
    'bg-orange-100', 'text-orange-700',
    'bg-purple-100', 'text-purple-700',
    'bg-cyan-100',   'text-cyan-700',
    // Traza scale completa (para uso dinámico)
    'bg-traza-50',  'text-traza-500', 'text-traza-600', 'text-traza-700',
    'bg-traza-100', 'border-traza-200',
    'ring-traza-500',
  ],
  plugins: [],
}
