/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        salon: {
          ivory: "#FAF8F5",
          "ivory-warm": "#F3EFEA",
          charcoal: "#12141A",
          "charcoal-card": "#1A1D24",
          "charcoal-hover": "#222731",
          gold: "#C5A059",
          "gold-light": "#DFC288",
          "gold-dark": "#9C7A37",
          rose: "#B76E79",
          "rose-light": "#D89A9E",
          border: "#E8E3DA",
          "border-dark": "#2A2E39",
          muted: "#71717A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgba(18, 20, 26, 0.08)",
        "luxury-dark": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
