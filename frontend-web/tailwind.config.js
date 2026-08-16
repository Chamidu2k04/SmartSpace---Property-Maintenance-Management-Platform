/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'hsl(217, 100%, 97%)',
          100: 'hsl(217, 100%, 93%)',
          200: 'hsl(217, 96%,  85%)',
          300: 'hsl(217, 91%,  73%)',
          400: 'hsl(217, 86%,  61%)',
          500: 'hsl(217, 80%,  51%)',  // main brand blue
          600: 'hsl(217, 77%,  42%)',
          700: 'hsl(217, 74%,  34%)',
          800: 'hsl(217, 70%,  27%)',
          900: 'hsl(217, 66%,  20%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
