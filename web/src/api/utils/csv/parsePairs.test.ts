import { describe, it, expect } from "vitest";
import { parsePairs } from "./parsePairs";
import { createFile } from "@/test/fixtures";

describe("parsePairs", () => {
  const fileA = createFile(1, { path: "a.js" });
  const fileB = createFile(2, { path: "b.js" });
  const files = [undefined, fileA, fileB] as any;

  const row = {
    id: "0",
    similarity: "0.75",
    longestFragment: "10",
    totalOverlap: "20",
    leftCovered: "0.5",
    rightCovered: "0.4",
    leftFileId: "1",
    rightFileId: "2",
  };

  it("parses numeric fields from strings", () => {
    const pairs = parsePairs([row], files);
    const pair = pairs[0];
    expect(pair.id).toBe(0);
    expect(pair.similarity).toBe(0.75);
    expect(pair.longestFragment).toBe(10);
    expect(pair.totalOverlap).toBe(20);
    expect(pair.leftCovered).toBe(0.5);
    expect(pair.rightCovered).toBe(0.4);
  });

  it("links left and right files by id", () => {
    const pairs = parsePairs([row], files);
    expect(pairs[0].leftFile).toBe(fileA);
    expect(pairs[0].rightFile).toBe(fileB);
  });

  it("indexes pairs by pair id (sparse array)", () => {
    const row2 = { ...row, id: "5" };
    const pairs = parsePairs([row2], files);
    expect(pairs[5]).toBeDefined();
    expect(pairs[0]).toBeUndefined();
  });

  it("initialises fragments and ignored kgrams as empty", () => {
    const pairs = parsePairs([row], files);
    expect(pairs[0].fragments).toBeNull();
    expect(pairs[0].leftIgnoredKgrams).toEqual([]);
    expect(pairs[0].rightIgnoredKgrams).toEqual([]);
  });
});
