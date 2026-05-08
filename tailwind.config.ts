import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-bg-primary)",
        section: "var(--color-bg-section)",
        card: "var(--color-bg-card)",
        accent: "var(--color-accent-red)",
        "accent-glow": "var(--color-accent-red-glow)",
        text: "var(--color-text-primary)",
        muted: "var(--color-text-muted)",
        subtle: "var(--color-border-subtle)",
        nav: "var(--color-nav-bg)",
        field: "var(--color-field-bg)",
        whatsapp: "var(--color-whatsapp)",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Impact", "Arial Narrow", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px var(--color-accent-red-glow)",
        glass: "0 16px 50px rgba(0, 0, 0, 0.35)",
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
