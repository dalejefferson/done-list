/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#1A2F30',
          800: '#243A3B',
          700: '#2F4A4B',
        },
        accent: {
          500: '#5A8A8C',
          600: '#4A7C7E',
        },
        peach: {
          500: '#D4A574',
          600: '#C89A6A',
        },
        cream: {
          50: '#F8F4F0',
          100: '#F5F0E8',
        },
        orange: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      boxShadow: {
        glow: '0 10px 40px rgba(90,138,140,0.25)',
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};

