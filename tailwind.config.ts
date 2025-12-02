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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
          soft: "var(--primary-soft)",
        },
        muted: "var(--muted)",
        border: "var(--border)",
      },
      borderRadius: {
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) * 1.5)",
      },
    },
  },
  plugins: [],
};
export default config;
