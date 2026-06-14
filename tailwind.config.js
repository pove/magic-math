/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        title: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      colors: {
        magic: {
          purple: '#7c3aed',
          gold: '#f59e0b',
          pink: '#ec4899',
          green: '#10b981',
          red: '#ef4444',
        },
      },
      animation: {
        twinkle: 'twinkle 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(5deg)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px #f59e0b' },
          '50%': { boxShadow: '0 0 20px #f59e0b, 0 0 40px #f59e0b' },
        },
      },
    },
  },
  plugins: [],
}
