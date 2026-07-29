import { describe, it, expect } from "vitest";
import { parseFiles, DEFAULT_LABEL } from "./parseFiles";

function makeRow(overrides: Record<string, string> = {}) {
  return {
    id: "1",
    path: "submissions/file.js",
    extra: "{}",
    ast: "[]",
    mapping: "[]",
    ignored: "false",
    amountOfKgrams: "0",
    ...overrides,
  };
}

describe("parseFiles", () => {
  it("parses a minimal row into a File with correct fields", () => {
    const { files } = parseFiles([makeRow()]);
    const file = files[1];
    expect(file).toBeDefined();
    expect(String(file.id)).toBe("1");
    expect(file.path).toBe("submissions/file.js");
    expect(file.ast).toEqual([]);
    expect(file.mapping).toEqual([]);
    expect(file.astAndMappingLoaded).toBe(true);
    expect(file.ignored).toBe(false);
  });

  it("separates the ignored file from the active files", () => {
    const { files, ignoredFile } = parseFiles([
      makeRow({ id: "1", ignored: "false" }),
      makeRow({ id: "2", ignored: "true" }),
    ]);
    expect(files[1]).toBeDefined();
    expect(files[2]).toBeUndefined();
    expect(ignoredFile).toBeDefined();
    expect(String(ignoredFile!.id)).toBe("2");
  });

  it("sets hasLabels when extra.labels is present", () => {
    const row = makeRow({ extra: JSON.stringify({ labels: "group-A" }) });
    const { hasLabels, hasUnlabeled } = parseFiles([row]);
    expect(hasLabels).toBe(true);
    expect(hasUnlabeled).toBe(false);
  });

  it("sets hasUnlabeled when a file has no label", () => {
    const { hasLabels, hasUnlabeled } = parseFiles([makeRow()]);
    expect(hasLabels).toBe(false);
    expect(hasUnlabeled).toBe(true);
  });

  it("assigns DEFAULT_LABEL to unlabeled files", () => {
    const { files } = parseFiles([makeRow()]);
    expect(files[1].label).toBe(DEFAULT_LABEL);
  });

  it("groups files with the same label under one Label object", () => {
    const rows = [
      makeRow({ id: "1", extra: JSON.stringify({ labels: "A" }) }),
      makeRow({ id: "2", path: "submissions/other.js", extra: JSON.stringify({ labels: "A" }) }),
    ];
    const { labels } = parseFiles(rows);
    expect(labels["A"]).toBeDefined();
    expect(labels["A"].color).not.toBe("");
  });

  it("sets hasTimestamps when extra.createdAt is present", () => {
    const row = makeRow({ extra: JSON.stringify({ createdAt: "2024-01-01T00:00:00Z" }) });
    const { hasTimestamps } = parseFiles([row]);
    expect(hasTimestamps).toBe(true);
  });

  it("strips the common path prefix from shortPath", () => {
    const rows = [
      makeRow({ id: "1", path: "submissions/a/file.js" }),
      makeRow({ id: "2", path: "submissions/b/file.js" }),
    ];
    const { files } = parseFiles(rows);
    expect(files[1].shortPath).toBe("a/file.js");
    expect(files[2].shortPath).toBe("b/file.js");
  });

  it("generates pseudo path and original path on each file", () => {
    const { files } = parseFiles([makeRow()]);
    const file = files[1];
    expect(file.pseudo.path).toMatch(/\.js$/);
    expect(file.original.path).toBe("submissions/file.js");
  });
});
