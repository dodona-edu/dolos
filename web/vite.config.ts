// Plugins
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import VueComponents from "unplugin-vue-components/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Vue Plugin.
    Vue({
      template: { transformAssetUrls },
    }),
    // Auto import components plugin.
    // Will automatically import components from the "components" dir.
    VueComponents({
      dts: "src/types/imports-components.d.ts",
      dirs: ["src/components"],
    }),
    // Vuetify Plugin.
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
      },
    }),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 8080,
  },
});
