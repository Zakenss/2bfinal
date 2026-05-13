/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FFFCF9',
          100: '#FDFBF7',
          200: '#F5F0E6',
          300: '#E8DEC8',
          400: '#D8C8B8',
          500: '#C4AFA0',
          600: '#A98F7D',
          700: '#8A705E',
          800: '#6B5445',
          900: '#4D3B30',
        },
        espresso: {
          50: '#F5F2EF',
          100: '#E6DDD5',
          200: '#D1BFB0',
          300: '#B89B85',
          400: '#A1785D',
          500: '#8A5A39',
          600: '#6F452A',
          700: '#543320',
          800: '#3D2517',
          900: '#2C1E16',
          950: '#1A110B',
        },
        amber: {
          50: '#FEF8F3',
          100: '#FDF0E5',
          200: '#F9DCBE',
          300: '#F4C28D',
          400: '#EEA258',
          500: '#E78128',
          600: '#C96A3C',
          700: '#A9522E',
          800: '#894326',
          900: '#6C3621',
          950: '#3A1B10',
        },
        terracotta: {
          500: '#C86558',
          600: '#A5493D',
          700: '#80342A',
        }
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'book': '0 4px 12px rgba(44, 30, 22, 0.08), 0 2px 4px rgba(44, 30, 22, 0.04)',
        'book-hover': '0 8px 24px rgba(44, 30, 22, 0.12), 0 4px 8px rgba(44, 30, 22, 0.06)',
      }
    },
  },
  plugins: [],
};