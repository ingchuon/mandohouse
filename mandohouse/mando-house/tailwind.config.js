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
        brand: {
          50:  '#E1F5FE',
          100: '#B3E5FC',
          200: '#81D4FA',
          300: '#4FC3F7',
          400: '#29B6F6',
          500: '#03A9F4',
          600: '#039BE5',
          700: '#0288D1',
          800: '#0277BD',
          900: '#01579B',
        },
        accent: {
          50:  '#FFEEF3',
          100: '#FFD6E2',
          200: '#FFB8CD',
          300: '#FF9DBB',
          400: '#FF8AAE',
          500: '#FF82A9',
          600: '#F0628E',
          700: '#D14773',
          800: '#A8385C',
          900: '#7A2A44',
        },
        cream: {
          50:  '#FFFDF3',
          100: '#FFF8DC',
          200: '#FCE38A',
          500: '#F9D158',
          600: '#E0B73E',
          700: '#B8932F',
        },
        surface: '#FFFDF3',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
