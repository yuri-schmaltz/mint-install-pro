/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#87cf3e',
          hover: '#98df4f',
          dark: '#6ea730',
          badge: '#63a328',
          success: '#4caf50'
        },
        gtk: {
          bg: '#2e3136',
          header: '#202225',
          card: '#35393f',
          cardHover: '#3b3f46',
          cardBorder: '#282b30',
          border: '#23262a',
          input: '#23262a',
          inputText: '#e0e0e0',
          textMuted: '#9aa0a6',
          textTitle: '#f0f0f0',
          scrollbar: '#4f545c',
          scrollbarTrack: '#26282c'
        }
      },
      fontFamily: {
        sans: ['Ubuntu', 'Cantarell', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
