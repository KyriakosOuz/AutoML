
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // ✅ Ensures correct asset paths for both local and production

  server: {
    host: "localhost", // more consistent across OS
    port: 5173,         // typical Vite dev port
    proxy: {
      "/api": {
        target: "http://localhost:8000", // ✅ FastAPI backend
        changeOrigin: true,
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
