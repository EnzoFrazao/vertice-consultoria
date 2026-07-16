import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"]
      },
      colors: {
        espresso: "#20130d",
        cacao: "#3a2419",
        bronze: "#b98246",
        champagne: "#f7ead8",
        ivory: "#fff9ef",
        mist: "#eef7f5",
        tealTech: "#0F766E",
        action: "#0F766E"
      },
      boxShadow: {
        glow: "0 0 80px rgba(185, 130, 70, 0.28)",
        glass: "0 24px 80px rgba(32, 19, 13, 0.16)"
      }
    }
  },
  plugins: []
} satisfies Config;
