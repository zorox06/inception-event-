/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#fdfbf7',
          warm: '#fbf8f1',
          card: '#ffffff',
          darker: '#f5efe6',
        },
        pencil: {
          DEFAULT: '#2d2d2d',
          light: '#5a5a5a',
          faint: '#8e8e8e',
        },
        muted: {
          DEFAULT: '#e5e0d8',
          dark: '#d6cfc3',
        },
        accent: {
          DEFAULT: '#ff4d4d',
          dark: '#e03636',
        },
        pen: {
          DEFAULT: '#2d5da1',
          light: '#4b7cc7',
          dark: '#1e4277',
        },
        postit: {
          DEFAULT: '#fff9c4',
          yellow: '#fff9c4',
          green: '#d1fae5',
          blue: '#e0f2fe',
          rose: '#ffe4e6',
          orange: '#ffedd5',
          purple: '#f3e8ff',
        },
      },
      fontFamily: {
        heading: ['Kalam', 'cursive', 'sans-serif'],
        body: ['Patrick Hand', 'cursive', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'sketch-xs': '1px 1px 0px 0px #2d2d2d',
        'sketch-sm': '2px 2px 0px 0px #2d2d2d',
        'sketch': '4px 4px 0px 0px #2d2d2d',
        'sketch-md': '6px 6px 0px 0px #2d2d2d',
        'sketch-lg': '8px 8px 0px 0px #2d2d2d',
        'sketch-accent': '4px 4px 0px 0px #ff4d4d',
        'sketch-pen': '4px 4px 0px 0px #2d5da1',
      },
      keyframes: {
        jiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-1.5deg)' },
          '75%': { transform: 'rotate(1.5deg)' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        sketchStripe: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '30px 0' },
        }
      },
      animation: {
        'jiggle': 'jiggle 0.3s ease-in-out infinite',
        'float-gentle': 'gentleFloat 3s ease-in-out infinite',
        'sketch-stripe': 'sketchStripe 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}
