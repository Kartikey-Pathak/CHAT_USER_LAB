/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "hsl(210, 60%, 55%)",
        bgDark: "hsl(210, 10%, 12%)",
        panel: "hsl(210, 12%, 18%)"
      }
    }
  },
  plugins: []
};
