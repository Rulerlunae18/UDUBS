/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'helix-green': '#00ff99',
        'helix-dark': '#050805',
        'helix-light': '#aaffcc',
        'helix-amber': '#ffe37a',
      },
      fontFamily: {
        mono: ['"Courier New"', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 6px #00ff99, 0 0 20px rgba(0,255,153,0.5)',
        'amber': '0 0 6px #ffe37a, 0 0 18px rgba(255,227,122,0.4)',
      },
      animation: {
        'scan': 'scan 5s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'glitch': 'glitch 3s infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)', opacity: '0.2' },
          '50%': { transform: 'translateY(0%)', opacity: '0.05' },
          '100%': { transform: 'translateY(100%)', opacity: '0.2' },
        },
        flicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '0.98' },
          '20%,24%,55%': { opacity: '0.92' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px,2px)' },
          '40%': { transform: 'translate(2px,-2px)' },
          '60%': { transform: 'translate(-1px,1px)' },
          '80%': { transform: 'translate(1px,-1px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
    },
  },
  plugins: [],
}
