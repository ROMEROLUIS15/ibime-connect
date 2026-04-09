import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 4000,
    strictPort: true,
    hmr: {
      overlay: true,
      port: 4000,
    },
    fs: {
      allow: [".."],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      // Fuerza a Vite/Rollup a resolver Zod desde el node_modules de frontend
      // Esto soluciona el error en Vercel al compilar la carpeta externa `shared`
      "zod": path.resolve(__dirname, "node_modules/zod"),
    },
  },
}));