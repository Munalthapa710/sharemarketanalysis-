import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f7f5",
        ink: "#0d1f1d",
        accent: "#0d8f6f",
        accentSoft: "#d9f3ea",
        danger: "#c84b31",
        warning: "#bf8b30",
        slate: "#54726d"
      },
      boxShadow: {
        card: "0 18px 40px rgba(13, 31, 29, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
