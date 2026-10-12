import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F2604D", // Unified Tone Orange
          teal: "#006D77",   // Stormy Teal
          green: "#E6F4EA",  // Dual-Color Green Shading (source_provided)
          yellow: "#FFF4CC", // Dual-Color Yellow Shading (auto_solved)
        },
        earth: {
          olive: "#496053",
          "olive-dark": "#394c42",
          "olive-light": "#5c7566",
          sand: "#b3996a",
          "sand-dark": "#9c8355",
          "sand-light": "#cbb58c",
          beige: "#eae8e1",
          "beige-soft": "#f7f6f2",
          charcoal: "#28332d",
          border: "#dedad0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sarabun)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
