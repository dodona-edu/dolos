import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Standalone Vitest config. We intentionally do NOT load the app's Vite
// plugins (Vuetify, Comlink, auto-import): the regression suite targets pure
// logic and only needs path-alias resolution. Component/visual checks live in
// Storybook instead.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
