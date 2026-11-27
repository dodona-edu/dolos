import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import init from "dolos-core-wasm";
import { Region } from "@/api/models";
import { parseFiles } from "@/api/utils/csv/parseFiles";
import { parseMetadata } from "@/api/utils/csv/parseMetadata";
import { readReportCsv } from "@/test/fixtures";
import { comparePair, ignoredSelections, matchesToFragments } from "./fragments";

// Fingerprint `i` covers line `i`, columns 0 to 10.
const lines = (count: number): Region[] =>
  Array.from({ length: count }, (_, i): Region => [i, 0, i, 10]);

describe("matchesToFragments", () => {
  it("spans from the first to the last fingerprint of a match", () => {
    const fragments = matchesToFragments([{ leftStart: 1, rightStart: 0, length: 3 }], lines(5), lines(5));

    expect(fragments).toEqual([{
      left: { startRow: 1, startCol: 0, endRow: 3, endCol: 10 },
      right: { startRow: 0, startCol: 0, endRow: 2, endCol: 10 },
      length: 3,
    }]);
  });
});

describe("ignoredSelections", () => {
  it("gives one selection per non-empty interval", () => {
    expect(ignoredSelections([[0, 2], [3, 3], [4, 5]], lines(5))).toEqual([
      { startRow: 0, startCol: 0, endRow: 1, endCol: 10 },
      { startRow: 4, startCol: 0, endRow: 4, endCol: 10 },
    ]);
  });
});

describe("comparePair", () => {
  const { files } = parseFiles(readReportCsv("with-analysis-data", "files.csv"));
  const pairs = readReportCsv("with-analysis-data", "pairs.csv");
  const { minLengthMatch: minMatchLength } = parseMetadata(readReportCsv("with-analysis-data", "metadata.csv"));

  beforeAll(async () => {
    const require = createRequire(import.meta.url);
    const wasm = await readFile(require.resolve("dolos-core-wasm/dolos_core_wasm_bg.wasm"));
    await init({ module_or_path: wasm });
  });

  it("finds the longest fragment of every pair in pairs.csv", () => {
    for (const pair of pairs) {
      const left = files[+pair.leftFileId].analysisData!;
      const right = files[+pair.rightFileId].analysisData!;
      const { fragments } = comparePair(left, right, minMatchLength);

      expect(Math.max(...fragments.map((f) => f.length))).toBe(+pair.longestFragment);
    }
  });

  it("gives one ignored region per ignored interval of each file", () => {
    const [alice, , carol] = files;
    const { leftIgnored, rightIgnored } = comparePair(alice.analysisData!, carol.analysisData!, minMatchLength);

    expect(leftIgnored).toHaveLength(alice.analysisData!.ignored.length);
    expect(rightIgnored).toHaveLength(carol.analysisData!.ignored.length);
  });
});
