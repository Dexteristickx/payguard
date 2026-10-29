/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        payguard: {
          bg: "#0B0F17",
          card: "#111827",
          border: "#1F2937",
          accent: "#0070BA", // PayPal Blue
          gold: "#FFC439",   // PayPal Gold
        },
      },
    },
  },
  plugins: [],
};

