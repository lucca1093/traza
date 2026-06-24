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
        traza: {
          50:  '#EEF4FB',
          100: '#D6E6F5',
          200: '#AEC8EA',
          300: '#85AADF',
          400: '#5C8DD4',
          500: '#2D6FB9',
          600: '#1A5C9F',
          700: '#0F4C81',   // primary
          800: '#0A3A65',
          900: '#062549',
        },
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
        surface: {
          bg:     '#F5F4F0',   // fondo principal — off-white cálido
          card:   '#FFFFFF',   // cards
          border: '#E8E6E1',   // bordes cálidos
        },
        ink: {
          primary:   '#111827', // texto principal
          secondary: '#6B7280', // texto secundario
          muted:     '#9CA3AF', // placeholder
        },
        sidebar: {
          bg:     '#0D1B2A',   // fondo sidebar oscuro
          hover:  '#1A2E42',   // hover item
          active: '#1E3A54',   // item activo
          text:   '#94A3B8',   // texto nav
          bright: '#E2E8F0',   // texto activo/logo
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  safelist: [
    'bg-teal-100', 'text-teal-700',
    'bg-violet-100', 'text-violet-700',
    'bg-orange-100', 'text-orange-700',
  ],
  plugins: [],
}
