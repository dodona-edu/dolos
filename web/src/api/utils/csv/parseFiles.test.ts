import { describe, it, expect } from "vitest";
import { parseFiles, DEFAULT_LABEL } from "./parseFiles";
import { readReportCsv } from "@/test/fixtures";

describe("parseFiles", () => {
  const withAnalysisData = readReportCsv("with-analysis-data", "files.csv");
  const withoutAnalysisData = readReportCsv("without-analysis-data", "files.csv");
  const withFileInfo = readReportCsv("with-file-info", "files.csv");

  it("parses the id, the path and the content of a file", () => {
    const { files } = parseFiles(withAnalysisData);
    expect(files).toHaveLength(3);
    expect(files[2].id).toBe(2);
    expect(files[2].path).toBe("submissions/carol.js");
    expect(files[2].content).toMatch(/^const numbers = "7,8,9"/);
  });

  it("parses the analysis data of a file", () => {
    const { files } = parseFiles(withAnalysisData);
    const data = files[2].analysisData;
    expect(data?.fingerprints).toHaveLength(45);
    expect(data?.fingerprints[0]).toBe(24733391);
    expect(data?.regions).toHaveLength(45);
    expect(data?.regions[1]).toEqual([0, 0, 0, 13]);
    expect(data?.ignored[0]).toEqual([4, 6]);
    expect(files[2].amountOfKgrams).toBe(45);
  });

  it("leaves the analysis data undefined when the report has none", () => {
    const { files } = parseFiles(withoutAnalysisData);
    expect(files).toHaveLength(3);
    expect(files[2].content).toMatch(/^const numbers = "7,8,9"/);
    expect(files[2].analysisData).toBeUndefined();
  });

  it("parses the name, the label and the timestamp of a file", () => {
    const { files, labels, hasLabels, hasUnlabeled, hasTimestamps } = parseFiles(withFileInfo);
    expect(files[0].extra.fullName).toBe("Alice Adams");
    expect(files[0].extra.labels).toBe("group-a");
    expect(files[0].extra.timestamp).toEqual(new Date("2019-07-23T15:12:33Z"));
    expect(files[0].label).toBe(labels["group-a"]);
    expect(files[0].original.fullName).toBe("Alice Adams");
    expect(hasLabels).toBe(true);
    expect(hasUnlabeled).toBe(true);
    expect(hasTimestamps).toBe(true);
  });

  it("leaves an empty name, label or timestamp undefined", () => {
    const { files, labels } = parseFiles(withFileInfo);
    expect(files[1].extra).toEqual({});
    expect(files[1].label).toBe(DEFAULT_LABEL);
    expect(files[2].extra).toEqual({ fullName: "Carol Clark" });
    expect(Object.keys(labels)).toEqual(["group-a", DEFAULT_LABEL.name]);
  });

  it("assigns DEFAULT_LABEL to every file when files.csv has no file info columns", () => {
    const { files, labels, hasLabels, hasUnlabeled, hasTimestamps } = parseFiles(withAnalysisData);
    expect(files.every((file) => file.label === DEFAULT_LABEL)).toBe(true);
    expect(files[0].extra).toEqual({});
    expect(labels).toEqual({ [DEFAULT_LABEL.name]: DEFAULT_LABEL });
    expect(hasLabels).toBe(false);
    expect(hasUnlabeled).toBe(true);
    expect(hasTimestamps).toBe(false);
  });

  it("strips the common path prefix from shortPath", () => {
    const { files } = parseFiles(withAnalysisData);
    expect(files[0].shortPath).toBe("alice.js");
    expect(files[0].original.path).toBe("submissions/alice.js");
  });

  it("generates a pseudo path with the extension of the file", () => {
    const { files } = parseFiles(withAnalysisData);
    expect(files[0].pseudo.path).toMatch(/\.js$/);
  });
});
