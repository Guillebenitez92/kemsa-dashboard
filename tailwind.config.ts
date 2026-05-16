import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0b3d2e",
          accent: "#16a34a",
          dark: "#062018",
        },
      },
    },
  },
  plugins: [],
};

export default config;
