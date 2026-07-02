import type { Config } from "tailwindcss";

// efin green theme — tokens mirror the prototype CSS variables
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        brand: "var(--blue)", // efin green #75BC1E (kept var name --blue per prototype)
        navy: "var(--navy)",
        soft: "var(--soft-blue)",
      },
    },
  },
  plugins: [],
};
export default config;
