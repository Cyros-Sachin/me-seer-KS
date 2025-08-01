// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        bounceSubtle: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '20%': { transform: 'translateY(-2px) scale(1.02)' },
          '40%': { transform: 'translateY(1px) scale(0.98)' },
          '60%': { transform: 'translateY(-1px) scale(1.01)' },
          '80%': { transform: 'translateY(0.5px) scale(1)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        }
      },
      animation: {
        bounceSubtle: 'bounceSubtle 0.6s ease-in-out infinite',
      }
    }
  }
}
