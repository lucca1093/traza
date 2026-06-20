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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
