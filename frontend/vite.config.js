import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/uploads': {
        target: process.env.VITE_API_BASE || 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  },
});
