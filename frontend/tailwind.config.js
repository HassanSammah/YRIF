/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy:  '#093344',
          dark:  '#093344',
          blue:  '#1E40AF',
          teal:  '#0D9488',
          gold:  '#df8d31',
          light: '#FDFBF7',
        },
        content: {
          primary:   '#093344',
          secondary: '#475569',
        },
      },
      backgroundImage: {
        'gradient-cream': 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
