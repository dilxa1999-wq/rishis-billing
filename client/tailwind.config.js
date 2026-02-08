/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          500: '#FF0080', // Replacing default pink-500 with Brand Color
          600: '#D9006C', // Darker shade for hover
          100: '#FFE6F2', // Light shade for backgrounds
          50: '#FFF0F7',  // Very light shade
        }
      }
    },
  },
  plugins: [],
}
