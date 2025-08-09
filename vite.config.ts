import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { readFileSync } from "fs";
import { resolve } from "path";

export default defineConfig(() => ({
  plugins: [
    react(),
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: () => {
        const manifest = JSON.parse(
          readFileSync(resolve(__dirname, "src/manifest.json"), "utf-8"),
        );
        const packageJson = JSON.parse(
          readFileSync(resolve(__dirname, "package.json"), "utf-8"),
        );
        manifest.version = packageJson.version;
        return manifest;
      },
      watchFilePaths: ["src", "public", "icons", "manifest.json"],
      additionalInputs: [
        "src/content/content.ts",
        "src/content/elementSelector.ts",
        "src/config/index.html",
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
