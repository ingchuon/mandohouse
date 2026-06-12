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
          50:  '#EAF2FB',
          100: '#C9DFF6',
          200: '#A4CBF0',
          300: '#8FBCEA',
          400: '#7DB3E5',
          500: '#6FA8E0',
          600: '#5B8FC9',
          700: '#4574A8',
          800: '#3A6190',
          900: '#2E4E73',
        },
        accent: {
          50:  '#FDF1EC',
          100: '#FBDED3',
          200: '#F6C2AF',
          300: '#F4B69E',
          400: '#F2B399',
          500: '#F0A98C',
          600: '#E0876A',
          700: '#C2604A',
          800: '#A04E3C',
          900: '#7A3A2A',
        },
        cream: {
          50:  '#FFFCF0',
          100: '#FEF6D8',
          200: '#FCE9A8',
          500: '#F7D873',
          600: '#E0BD4F',
          700: '#B8973A',
        },
        surface: '#FFFCF0',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
