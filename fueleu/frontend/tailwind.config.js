/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ocean: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8d9ff',
          300: '#7ab8ff',
          400: '#3d93ff',
          500: '#0d6efd',
          600: '#0a56cc',
          700: '#0840a6',
          800: '#062d80',
          900: '#051f5e',
          950: '#030d3a',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
    },
  },
  plugins: [],
};
