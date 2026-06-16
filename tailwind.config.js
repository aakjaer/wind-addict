/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        indeterminate: {
          "0%":   { transform: "translateX(-100%) scaleX(0.4)" },
          "50%":  { transform: "translateX(50%)  scaleX(0.6)" },
          "100%": { transform: "translateX(200%) scaleX(0.4)" },
        },
      },
      animation: {
        indeterminate: "indeterminate 1.4s cubic-bezier(0.65,0,0.35,1) infinite",
      },
      fontFamily: {
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
        sans: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
