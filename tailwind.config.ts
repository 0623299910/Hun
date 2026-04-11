import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102a43",
        haze: "#f6efe6",
        gold: "#f7b267",
        coral: "#f4845f",
        pine: "#2f6f59",
      },
      boxShadow: {
        soft: "0 15px 30px -20px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(16, 42, 67, 0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
