import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef4fb",
          950: "#061321",
          900: "#0a1f35",
          800: "#102b46",
          700: "#193b5f",
        },
        brand: {
          50: "#fff1f3",
          100: "#ffe0e5",
          200: "#ffc7d0",
          300: "#f89bab",
          500: "#c72a42",
          600: "#a91f35",
          700: "#7f1d2d",
          800: "#64172a",
        },
      },
      boxShadow: {
        premium: "0 24px 80px rgba(2, 10, 22, 0.24)",
        redGlow: "0 18px 60px rgba(127, 29, 45, 0.22)",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
