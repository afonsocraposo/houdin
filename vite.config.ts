import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { readFileSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  const port = 5173;
  const isFirefox = process.env.TARGET === "firefox";

  return {
    plugins: [
      react(),
      webExtension({
        browser: process.env.TARGET || "chrome",
        disableAutoLaunch: true,
        manifest: () => {
          const manifest = JSON.parse(
            readFileSync(resolve(__dirname, "src/manifest.json"), "utf-8"),
          );
          const packageJson = JSON.parse(
            readFileSync(resolve(__dirname, "package.json"), "utf-8"),
          );
          manifest.version = packageJson.version;

          // Firefox uses background.scripts instead of service_worker in MV3
          if (isFirefox) {
            manifest.background = {
              scripts: ["src/background/background.ts"],
              type: "module",
            };
          }

          // Add CSP for development to allow Vite HMR (Chrome only)
          if (isDev && !isFirefox) {
            manifest.content_security_policy = {
              extension_pages: `script-src 'self' http://localhost:${port}; object-src 'self'`
            };
          }

          return manifest;
        },
        watchFilePaths: ["src", "public", "icons", "manifest.json"],
        additionalInputs: [
          "src/config/index.html",
        ],
      }),
      // Custom plugin to conditionally inject React Refresh script
      {
        name: "conditional-react-refresh",
        transformIndexHtml: {
          order: "pre",
          handler(html) {
            // Only inject React Refresh script in development
            if (command === "serve") {
              const reactRefreshScript = `    <script type="module">
      import RefreshRuntime from "http://localhost:5173/@react-refresh";
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>`;

              // Inject the script before the closing </head> tag
              return html.replace(
                "</head>",
                `${reactRefreshScript}\n  </head>`,
              );
            } else {
              // In production, return HTML as-is (no script injection)
              return html;
            }
          },
        },
      },
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
  };
});
