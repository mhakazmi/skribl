/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Boogaloo', 'cursive'],
        ui: ['Nunito', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        navy: {
          900: '#1A1A2E',
          800: '#16213E',
          700: '#0F3460',
        },
        brand: {
          blue: '#4F86F7',
          yellow: '#FFD93D',
          green: '#6BCB77',
          red: '#FF6B6B',
          purple: '#C77DFF',
        },
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-70px) scale(1.3)' },
        },
        flipIn: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        correctFlash: {
          '0%': { backgroundColor: 'rgba(107,203,119,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        floatUp: 'floatUp 1.2s ease-out forwards',
        flipIn: 'flipIn 0.35s ease-out forwards',
        slideDown: 'slideDown 0.4s ease-out forwards',
        slideUp: 'slideUp 0.4s ease-in forwards',
        popIn: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        shake: 'shake 0.3s ease-in-out',
        pulse2: 'pulse2 1.5s ease-in-out infinite',
        correctFlash: 'correctFlash 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}
