/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'orange-primary': '#FF6B35',
        'orange-light': '#FF8C5A',
        'orange-dark': '#E55A2B',
      },
    },
  },
  plugins: [],
  // Ensure mobile-first responsive design
  screens: {
    'xs': '375px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
  },
}

