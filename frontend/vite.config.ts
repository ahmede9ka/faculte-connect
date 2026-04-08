import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // Keep the frontend dev server on a different port than Spring gateway (8080)
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/auth": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/projets": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/events": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/notifications": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/recommendations": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/lists": {
        // Spring API gateway
        target: "http://localhost:8080",
        changeOrigin: true,
      }
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
