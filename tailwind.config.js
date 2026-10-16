/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: {
          950: '#04070D',
          900: '#080C16',
          850: '#0C1322',
          800: '#111A2E',
          700: '#1A2640',
          600: '#253556',
        },
        prism: {
          cyan: '#00D2FF',
          blue: '#1A73E8',
          electric: '#2F66FF',
          indigo: '#5B4BFF',
          violet: '#8E44FF',
          magenta: '#FF2A85',
          mint: '#00F5A0',
          amber: '#FFB800',
          rose: '#FF3366',
        },
        surface: {
          canvas: '#060A12',
          card: '#0B111E',
          glass: 'rgba(12, 19, 34, 0.72)',
          elevated: '#131B2C',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-focus': 'rgba(0, 210, 255, 0.4)',
          hover: '#18233A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 35px -5px rgba(0, 210, 255, 0.35)',
        'glow-electric': '0 8px 30px -4px rgba(47, 102, 255, 0.4)',
        'glow-mint': '0 0 35px -5px rgba(0, 245, 160, 0.35)',
        'glow-violet': '0 0 35px -5px rgba(142, 68, 255, 0.35)',
        'glass-rim': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-rim-subtle': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'prism-conic': 'conic-gradient(from 180deg at 50% 50%, #00D2FF 0deg, #2F66FF 120deg, #8E44FF 240deg, #00D2FF 360deg)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
