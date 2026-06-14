import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/wind-addict/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/dmi": {
        target: "https://opendataapi.dmi.dk",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/dmi/, ""),
      },
    },
  },
});
