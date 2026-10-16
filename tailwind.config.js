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
        obsidian: {
          950: '#070A10',
          900: '#0B0F19',
          850: '#0F1523',
          800: '#141B2D',
          700: '#1F293D',
          600: '#2E3D5B',
        },
        studio: {
          surface: '#111827',
          raised: '#1F2937',
          border: '#374151',
          hover: '#283548',
          active: '#334155',
        },
        brand: {
          blue: '#3B82F6',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
}
