import { test, expect, Page } from "@playwright/test";

/**
 * Full-app visual regression.
 *
 * Each analysis route is rendered against the real report in public/data and
 * compared to a committed baseline snapshot (tests/visual/*-snapshots/). The
 * run fails automatically when a route changes; the HTML report
 * (`npx playwright show-report`) then shows an Expected/Actual/Diff slider.
 *
 * Update baselines intentionally with:  npm run test:visual -- --update-snapshots
 *
 * Each route is its own test (fresh hydration via hash routing) so the report
 * lists per-route pass/fail and diffs independently.
 *
 * IDs below come from the real report in public/data.
 */
type Route = {
  name: string;
  hash: string;
  /** Element that must be visible before the view is considered rendered. */
  ready?: string;
  /** Wait for the <canvas> (D3 force graph) to finish painting/settling. */
  canvas?: boolean;
  /** Per-route tolerance override for inherently noisier views. */
  maxDiffPixelRatio?: number;
  /**
   * JSON returned for the upload-mode `GET ${VITE_API_URL}/reports/:id` request
   * (share view). Stubbed via page.route() so no API server is needed.
   */
  stubReport?: Record<string, unknown>;
  /**
   * This route is expected to render a terminal `<page-error>` (e.g. the share
   * view on a failed report), so don't assert that no error is shown.
   */
  expectError?: boolean;
};

const ROUTES: Route[] = [
  { name: "01-overview", hash: "#/", ready: ".hero-title" },
  { name: "02-pairs", hash: "#/pairs" },
  { name: "03-pair", hash: "#/pairs/48730", ready: ".monaco-editor", maxDiffPixelRatio: 0.05 },
  { name: "04-submissions", hash: "#/submissions" },
  { name: "05-submission", hash: "#/submissions/1" },
  { name: "06-graph", hash: "#/graph", canvas: true },
  { name: "07-clusters", hash: "#/clusters" },
  { name: "08-cluster", hash: "#/clusters/0" },
  // Upload-mode views (reachable at #/upload in the analysis build). The upload
  // form makes no request on mount; the share view fetches one report, stubbed
  // to a terminal "failed" status so it settles on a stable <page-error>.
  { name: "09-upload", hash: "#/upload", ready: ".hero-title" },
  {
    name: "10-share",
    hash: "#/upload/share/stub-report",
    expectError: true,
    stubReport: {
      id: "stub-report",
      name: "Stubbed shared report",
      created_at: "2024-01-01T00:00:00.000Z",
      status: "failed",
      url: "http://stub.local/api/reports/stub-report",
      error: "This report could not be loaded (stubbed for visual testing).",
    },
  },
];

/** Cheap rolling signature of the canvas pixels (strided for speed). */
async function canvasSignature(page: Page): Promise<string> {
  return page.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement | null;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || c.width === 0) return "";
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let h = 0;
    for (let i = 0; i < data.length; i += 997) h = (h * 31 + data[i]) >>> 0;
    return `${h}`;
  });
}

/** Polls until the canvas stops changing (force simulation settled). */
async function waitForCanvasStable(page: Page): Promise<void> {
  let prev = "";
  for (let i = 0; i < 40; i++) {
    const sig = await canvasSignature(page);
    if (sig && sig === prev) return;
    prev = sig;
    await page.waitForTimeout(500);
  }
}

async function gotoRoute(page: Page, route: Route): Promise<void> {
  // The upload-mode views talk to the API server; stub every report request so
  // no backend is needed. Harmless for analysis routes, which load their data
  // from public/data (never /reports) and so never trigger this handler.
  await page.route("**/reports/**", (apiRoute) =>
    apiRoute.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(route.stubReport ?? {}),
    })
  );

  await page.goto(`/${route.hash}`);
  // The analysis layout shows <page-loading class="page-loading"> until every
  // store is hydrated; wait for it to disappear.
  await page.locator(".page-loading").waitFor({ state: "detached", timeout: 120_000 });
  if (route.expectError) {
    // This route intentionally lands on an error page (e.g. the share view on a
    // failed report); wait for it instead of asserting it's absent.
    await page.locator(".page-error").first().waitFor({ state: "visible", timeout: 60_000 });
  } else {
    // Surface a hydration failure clearly instead of a blank screenshot.
    await expect(page.locator(".page-error"), `route ${route.hash} errored`).toHaveCount(0);
  }

  if (route.ready) {
    await page.locator(route.ready).first().waitFor({ state: "visible", timeout: 60_000 });
  }
  if (route.canvas) {
    await waitForCanvasStable(page);
  }
  // Final settle for late layout.
  await page.waitForTimeout(1_000);
}

for (const route of ROUTES) {
  test(route.name, async ({ page }) => {
    await gotoRoute(page, route);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      ...(route.maxDiffPixelRatio ? { maxDiffPixelRatio: route.maxDiffPixelRatio } : {}),
    });
  });
}
