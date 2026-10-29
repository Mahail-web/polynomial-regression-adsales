/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A0F1D",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155",
        },
        brand: {
          teal: "#0D9488",
          tealLight: "#14B8A6",
          blue: "#2563EB",
          amber: "#D97706",
        },
      },
    },
  },
  plugins: [],
};
