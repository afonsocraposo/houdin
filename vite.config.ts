import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { readFileSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: () => {
        // Use dev manifest in development, prod manifest in production
        const manifestPath =
          mode === "development"
            ? resolve(__dirname, "src/manifest.json")
            : resolve(__dirname, "src/manifest.prod.json");

        return JSON.parse(readFileSync(manifestPath, "utf-8"));
      },
      watchFilePaths: ["src", "public", "icons"],
      additionalInputs: [
        "src/content/content.ts",
        "src/content/elementSelector.ts",
        "src/config/config.html",
      ],
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
  },
  publicDir: "public",
  server: {
    port: 5173,
    hmr: {
      port: 5174,
    },
  },
}));
