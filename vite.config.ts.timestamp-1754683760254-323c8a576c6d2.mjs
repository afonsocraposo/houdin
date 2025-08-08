// vite.config.ts
import { defineConfig } from "file:///Users/afonso/Documents/changeme/node_modules/vite/dist/node/index.js";
import react from "file:///Users/afonso/Documents/changeme/node_modules/@vitejs/plugin-react/dist/index.js";
import webExtension from "file:///Users/afonso/Documents/changeme/node_modules/vite-plugin-web-extension/dist/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/afonso/Documents/changeme";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: () => {
        return JSON.parse(
          readFileSync(resolve(__vite_injected_original_dirname, "src/manifest.json"), "utf-8")
        );
      },
      watchFilePaths: ["src", "public", "icons", "manifest.json"],
      additionalInputs: [
        "src/content/content.ts",
        "src/content/elementSelector.ts",
        "src/config/config.html"
      ]
    })
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        inlineDynamicImports: false
      }
    }
  },
  publicDir: "public",
  server: {
    port: 5173,
    hmr: {
      port: 5174
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWZvbnNvL0RvY3VtZW50cy9jaGFuZ2VtZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Fmb25zby9Eb2N1bWVudHMvY2hhbmdlbWUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Fmb25zby9Eb2N1bWVudHMvY2hhbmdlbWUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHdlYkV4dGVuc2lvbiBmcm9tIFwidml0ZS1wbHVnaW4td2ViLWV4dGVuc2lvblwiO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIHJlYWN0KCksXG4gICAgICAgIHdlYkV4dGVuc2lvbih7XG4gICAgICAgICAgICBicm93c2VyOiBwcm9jZXNzLmVudi5UQVJHRVQgfHwgXCJjaHJvbWVcIixcbiAgICAgICAgICAgIG1hbmlmZXN0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgIHJlYWRGaWxlU3luYyhyZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvbWFuaWZlc3QuanNvblwiKSwgXCJ1dGYtOFwiKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhdGNoRmlsZVBhdGhzOiBbXCJzcmNcIiwgXCJwdWJsaWNcIiwgXCJpY29uc1wiLCBcIm1hbmlmZXN0Lmpzb25cIl0sXG4gICAgICAgICAgICBhZGRpdGlvbmFsSW5wdXRzOiBbXG4gICAgICAgICAgICAgICAgXCJzcmMvY29udGVudC9jb250ZW50LnRzXCIsXG4gICAgICAgICAgICAgICAgXCJzcmMvY29udGVudC9lbGVtZW50U2VsZWN0b3IudHNcIixcbiAgICAgICAgICAgICAgICBcInNyYy9jb25maWcvY29uZmlnLmh0bWxcIixcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgIF0sXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgaW5saW5lRHluYW1pY0ltcG9ydHM6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHB1YmxpY0RpcjogXCJwdWJsaWNcIixcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgcG9ydDogNTE3MyxcbiAgICAgICAgaG1yOiB7XG4gICAgICAgICAgICBwb3J0OiA1MTc0LFxuICAgICAgICB9LFxuICAgIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtSLFNBQVMsb0JBQW9CO0FBQy9TLE9BQU8sV0FBVztBQUNsQixPQUFPLGtCQUFrQjtBQUN6QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN2QyxTQUFTO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixhQUFhO0FBQUEsTUFDVCxTQUFTLFFBQVEsSUFBSSxVQUFVO0FBQUEsTUFDL0IsVUFBVSxNQUFNO0FBQ1osZUFBTyxLQUFLO0FBQUEsVUFDUixhQUFhLFFBQVEsa0NBQVcsbUJBQW1CLEdBQUcsT0FBTztBQUFBLFFBQ2pFO0FBQUEsTUFDSjtBQUFBLE1BQ0EsZ0JBQWdCLENBQUMsT0FBTyxVQUFVLFNBQVMsZUFBZTtBQUFBLE1BQzFELGtCQUFrQjtBQUFBLFFBQ2Q7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0o7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDSixzQkFBc0I7QUFBQSxNQUMxQjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxXQUFXO0FBQUEsRUFDWCxRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDRCxNQUFNO0FBQUEsSUFDVjtBQUFBLEVBQ0o7QUFDSixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
