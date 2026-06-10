/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        polo: {
          navy: '#1B2A41',
          gold: '#C9A24B',
          beige: '#F3EFE6',
        }
      }
    },
  },
  plugins: [],
}

