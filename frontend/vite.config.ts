/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  cacheDir: "../node_modules/.vite/vertice-frontend",
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.indexOf("/src/pages/landing/") >= 0) return "landing";
          if (normalizedId.indexOf("/src/pages/login/") >= 0) return "login";
          if (normalizedId.indexOf("/src/pages/client/") >= 0) return "client";
          if (normalizedId.indexOf("/src/pages/admin/") >= 0) return "admin";
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  }
});
