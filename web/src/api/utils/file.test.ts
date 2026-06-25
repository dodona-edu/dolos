import { describe, it, expect } from "vitest";
import { commonFilenamePrefix } from "./file";
import { createFile } from "@/test/fixtures";

const withPaths = (...paths: string[]) =>
  paths.map((p, i) => createFile(i, { path: p }));

describe("commonFilenamePrefix", () => {
  it("returns an empty string for zero or one file", () => {
    expect(commonFilenamePrefix([])).toBe("");
    expect(commonFilenamePrefix(withPaths("src/a/x.js"))).toBe("");
  });

  it("returns the shared directory prefix", () => {
    expect(commonFilenamePrefix(withPaths("src/a/x.js", "src/a/y.js"))).toBe("src/a/");
  });

  it("backs off to the deepest shared directory", () => {
    expect(
      commonFilenamePrefix(
        withPaths("root/sub/a.js", "root/sub/b.js", "root/other/c.js")
      )
    ).toBe("root/");
  });

  it("returns an empty string when there is no shared directory", () => {
    expect(commonFilenamePrefix(withPaths("abc/x.js", "xyz/y.js"))).toBe("");
  });
});
