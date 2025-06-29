import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // TODO: Definir paleta de cores para Glassmorphism e Dark Theme
      // Exemplo:
      // colors: {
      //   'glass-bg': 'rgba(255, 255, 255, 0.1)',
      //   'glass-border': 'rgba(255, 255, 255, 0.2)',
      //   'dark-bg': '#1a202c',
      //   'dark-text': '#e2e8f0',
      // }
    },
  },
  plugins: [],
};
export default config;
