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
                return JSON.parse(
                    readFileSync(resolve(__dirname, "src/manifest.json"), "utf-8"),
                );
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
