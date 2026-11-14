import { describe, it, expect } from "vitest";
import { parsePairs } from "./parsePairs";
import { createFile, readReportCsv } from "@/test/fixtures";

describe("parsePairs", () => {
  const files = [0, 1, 2].map((id) => createFile(id));
  const rows = readReportCsv("with-analysis-data", "pairs.csv");

  it("parses every numeric column to a number", () => {
    const pair = parsePairs(rows, files)[1];
    expect(pair.id).toBe(1);
    expect(pair.similarity).toBeCloseTo(0.38095238095238093, 12);
    expect(pair.longestFragment).toBe(2);
    expect(pair.totalOverlap).toBe(16);
    expect(pair.leftCovered).toBe(8);
    expect(pair.rightCovered).toBe(8);
    expect(pair.leftTotal).toBe(22);
    expect(pair.rightTotal).toBe(20);
  });

  it("links left and right files by id", () => {
    const pair = parsePairs(rows, files)[1];
    expect(pair.leftFile).toBe(files[0]);
    expect(pair.rightFile).toBe(files[2]);
  });

  it("indexes pairs by pair id (sparse array)", () => {
    const pairs = parsePairs([{ ...rows[0], id: "5" }], files);
    expect(pairs[5]).toBeDefined();
    expect(pairs[0]).toBeUndefined();
  });

  it("initialises fragments and ignored kgrams as empty", () => {
    const pair = parsePairs(rows, files)[0];
    expect(pair.fragments).toBeNull();
    expect(pair.leftIgnoredKgrams).toEqual([]);
    expect(pair.rightIgnoredKgrams).toEqual([]);
  });
});
