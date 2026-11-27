// Check of the Node.js boundary. The Rust tests of dolos-lib cover the
// analysis; this covers what only shows up once the module is loaded.
//
// Build first: npm run build

import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Dolos, PairSortBy } from "../index.js";

const fixture = (name: string): string =>
  fileURLToPath(new URL(`../../lib/fixtures/${name}`, import.meta.url));

const samples = [fixture("sample1.js"), fixture("sample2.js")];

test("a report of two files matches the CLI", async () => {
  const report = await new Dolos(samples).buildReport();

  assert.equal(report.files.length, 2);
  assert.equal(report.pairs.length, 1);
  const [pair] = report.pairs;
  // `dolos run sample1.js sample2.js`: sim 48.04%, longest 21, left 50/96,
  // right 48/108, 12 fragments.
  assert.deepEqual(pair.metrics, {
    similarity: 98 / 204,
    totalLeft: 96,
    totalRight: 108,
    overlapLeft: 50,
    overlapRight: 48,
    longestMatch: 21,
  });
  assert.equal(pair.fragments?.length, 12);
  assert.equal(pair.leftFile, report.files[0]);
  assert.equal(pair.rightFile, report.files[1]);
});

test("an invalid config throws with the error kind as code", () => {
  assert.throws(() => new Dolos(samples, { kgramLength: 0 }), {
    code: "InvalidInput",
    message: "kgram_length must be at least 1",
  });
});

test("a missing file throws with the error kind as code", () => {
  assert.throws(() => new Dolos([samples[0], fixture("missing.js")]), {
    code: "NotFound",
  });
});

test("the config reaches the report", async () => {
  const report = await new Dolos(samples, {
    name: "samples",
    sortBy: PairSortBy.Similarity,
  }).buildReport();

  assert.equal(report.metadata.reportName, "samples");
  assert.equal(report.metadata.sortBy, PairSortBy.Similarity);
  assert.equal(report.metadata.maxFingerprintFileCount, undefined);
  assert.ok(report.metadata.createdAt instanceof Date);
});
