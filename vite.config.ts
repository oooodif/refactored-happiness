/**
 * vite.config.ts  Railwayfriendly version
 * ------------------------------------------------
 * - Adds Nodecompatible __dirname / __filename
 * - Leaves all existing plugins & aliases intact
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
    // Cartographer only in nonprod Replit envs
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
  },
});
