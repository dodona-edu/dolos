import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "papaparse";
import { File, Pair, Label } from "@/api/models";

/**
 * Minimal fixture factories for the pure-logic regression suite.
 *
 * These build just enough of the real `File`/`Pair` shapes to exercise the
 * data-transformation and clustering functions. They are deliberately decoupled
 * from CSV parsing and Pinia.
 */

const defaultLabel: Label = {
  label: "label",
  selected: true,
  color: "#000000",
} as unknown as Label;

export function createFile(id: number, overrides: Partial<File> = {}): File {
  const path = overrides.path ?? `submissions/file-${id}.js`;
  return {
    id,
    path,
    shortPath: path,
    content: "",
    label: defaultLabel,
    extra: {},
    pseudo: { path, shortPath: path },
    original: { path, shortPath: path },
    ...overrides,
  } as File;
}

export function createPair(
  id: number,
  leftFile: File,
  rightFile: File,
  similarity: number,
  overrides: Partial<Pair> = {}
): Pair {
  return {
    id,
    leftFile,
    rightFile,
    similarity,
    longestFragment: 0,
    totalOverlap: 0,
    leftCovered: 0,
    rightCovered: 0,
    leftTotal: 0,
    rightTotal: 0,
    fragments: null,
    leftIgnoredKgrams: [],
    rightIgnoredKgrams: [],
    ...overrides,
  };
}

/**
 * Read the rows of a CSV file of a report in `src/test/reports`.
 * The Rust CLI wrote these reports.
 */
export function readReportCsv(report: string, file: string): any[] {
  const path = join(__dirname, "reports", report, file);
  return parse(readFileSync(path, "utf8"), { header: true, skipEmptyLines: true }).data;
}
