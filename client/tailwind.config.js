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
        sky: {
          game: '#4361EE',
          light: '#5A77F5',
          dark: '#2D47C9',
        },
        paper: '#FFFEF7',
        ink: '#1A1A2E',
        brand: {
          green: '#06D6A0',
          yellow: '#FFD166',
          red: '#EF476F',
          orange: '#FF6B35',
          purple: '#9B5DE5',
          blue: '#4361EE',
          pink: '#F15BB5',
          teal: '#00BBF9',
        },
      },
      boxShadow: {
        paper: '4px 4px 0 #1A1A2E',
        'paper-sm': '3px 3px 0 #1A1A2E',
        'paper-lg': '6px 6px 0 #1A1A2E',
        'paper-pressed': '1px 1px 0 #1A1A2E',
        'paper-color-green': '4px 4px 0 #027a5a',
        'paper-color-blue': '4px 4px 0 #1D3BB3',
        'paper-color-red': '4px 4px 0 #9E1A3A',
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
        popIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-2deg)' },
          '75%': { transform: 'rotate(2deg)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        correctFlash: {
          '0%': { backgroundColor: 'rgba(6,214,160,0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        bounce2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floatUp: 'floatUp 1.2s ease-out forwards',
        flipIn: 'flipIn 0.35s ease-out forwards',
        slideDown: 'slideDown 0.4s ease-out forwards',
        popIn: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        shake: 'shake 0.3s ease-in-out',
        wobble: 'wobble 0.4s ease-in-out',
        pulse2: 'pulse2 1.5s ease-in-out infinite',
        correctFlash: 'correctFlash 0.8s ease-out forwards',
        bounce2: 'bounce2 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
