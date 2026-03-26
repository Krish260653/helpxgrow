/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: 'hsl(0 0% 100%)',
      },
      animation: {
        'fade-slide': 'fadeSlideIn 0.3s ease forwards',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'bounce-dot': 'bounce-dot 1.2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'confetti': 'confetti-fall linear forwards',
        'celebration-pop': 'celebration-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'step-reveal': 'stepReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'log-slide': 'logSlideIn 0.25s ease-out forwards',
        'progress-fill': 'progressFill 0.6s ease-out forwards',
        'step-enter': 'stepEnter 0.35s ease-out forwards',
      },
      keyframes: {
        fadeSlideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'celebration-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        stepReveal: {
          '0%': { opacity: '0', transform: 'scale(0.4) rotate(-15deg)' },
          '60%': { opacity: '1', transform: 'scale(1.2) rotate(4deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        logSlideIn: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        progressFill: {
          from: { width: '0%' },
          to: { width: 'var(--progress-width)' },
        },
        stepEnter: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};