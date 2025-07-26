/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#69686D',
          100: '#69686D',
          200: '#4F4E52',
          300: '#4F4E52',
          400: '#353437',
          500: '#353437',
          600: '#1A1A1B',
          700: '#1A1A1B',
          800: '#000000',
          900: '#000000',
        },
        gray: {
          50: '#69686D',
          100: '#69686D',
          200: '#4F4E52',
          300: '#4F4E52',
          400: '#353437',
          500: '#353437',
          600: '#1A1A1B',
          700: '#1A1A1B',
          800: '#000000',
          900: '#000000',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}