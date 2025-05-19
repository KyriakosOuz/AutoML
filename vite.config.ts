
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",  // Ensures correct asset paths for both local and production

  server: {
    host: "::", // Keep the original host setting
    port: 8080, // Keep the original port setting
    proxy: {
      "/api": {
        target: "http://localhost:8000", // FastAPI backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Remove /api prefix when forwarding
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
