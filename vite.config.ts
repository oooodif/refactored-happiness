/**
 * vite.config.ts — Railway-friendly version
 * ------------------------------------------------
 * - Adds Node-compatible __dirname / __filename
 * - Leaves all existing plugins & aliases intact
 * - Adds custom build output config and manualChunks
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

/* ------------------------------------------------
   Node doesn’t provide `import.meta.dirname`.
   We recreate it so path.resolve never receives
   `undefined`, preventing ERR_INVALID_ARG_TYPE.
------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  // Frontend project root
  root: path.resolve(__dirname, "client"),

  build: {
    // Where static assets are emitted (served by Express)
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Configure Rollup options for manual chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor dependencies
          "vendor-react": ["react", "react-dom", "react-hook-form", "wouter"],

          // UI libraries
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
          ],

          // Data/fetching
          "vendor-data": ["@tanstack/react-query", "axios", "zod"],

          // PDF/document rendering
          "vendor-pdf": ["react-pdf", "pdfobject", "prismjs"],
        },
      },
    },
  },
});
