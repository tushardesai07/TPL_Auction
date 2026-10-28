/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#08090B',
          card: '#111318',
          subtle: '#181B22',
          hover: '#1F232D',
        },
        gold: {
          light: '#F5E2B3',
          DEFAULT: '#D6B36A',
          dark: '#B08E44',
          glow: 'rgba(214, 179, 106, 0.25)',
        },
        text: {
          primary: '#F0F3F8',
          secondary: '#A7ADB8',
          muted: '#666F80',
        },
        status: {
          success: '#32D583',
          danger: '#FF5C5C',
          warning: '#FDB022',
          info: '#70A6FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(214, 179, 106, 0.3)',
        'danger-glow': '0 0 25px -5px rgba(255, 92, 92, 0.4)',
        'success-glow': '0 0 25px -5px rgba(50, 213, 131, 0.3)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
