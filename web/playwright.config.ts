import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the full-app visual-inspection harness.
 *
 * It boots the real Vite dev server, which (in standalone mode) loads the real
 * report from `public/data`, so the whole pipeline — CSV parsing, Comlink
 * workers, Pinia stores, views — is exercised exactly as in development.
 *
 * On NixOS the browser comes from nixpkgs via PLAYWRIGHT_BROWSERS_PATH (set in
 * the dev shell); the npm-downloaded binaries can't run here.
 */
export default defineConfig({
  testDir: "./tests/visual",
  // The report is large; hydration + heavy views (graph) take a while.
  timeout: 180_000,
  // Each route test is independent (its own page + fresh navigation), so they
  // run in parallel. Workers scale with the host's core count (single-core CI
  // → 1 worker, so this only speeds up local dev); the 50% leaves headroom for
  // the vite build/preview server. Screenshots are worker-count-independent.
  fullyParallel: true,
  workers: "50%",
  reporter: [["list"], ["html", { open: "never" }]],
  // Visual-regression defaults. Baselines live next to the spec in
  // tests/visual/*-snapshots/ and are committed; a run fails (with an
  // Expected/Actual/Diff view in the HTML report) when a route's pixels drift
  // beyond these tolerances. A small ratio absorbs anti-aliasing jitter.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://localhost:8080",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    // Serve a production build rather than the dev server: the bundle is fully
    // compiled and static, so routes paint immediately (no on-demand Vite
    // compilation) and screenshots are stable without warm-up tricks.
    // `vite build` directly (not `npm run build`) to skip the vue-tsc typecheck
    // — that is already covered by the web-lint / web-build-deploy jobs.
    command: "npx vite build && npm run preview",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
