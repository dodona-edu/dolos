import { describe, it, expect } from "vitest";
import { parseMetadata } from "./parseMetadata";
import { readReportCsv } from "@/test/fixtures";

describe("parseMetadata", () => {
  const rows = readReportCsv("with-analysis-data", "metadata.csv");

  it("parses every property with its type", () => {
    expect(parseMetadata(rows)).toEqual({
      reportName: "small",
      createdAt: "2026-11-13T15:54:05.245507559+00:00",
      language: "Javascript",
      kgramLength: 5,
      kgramsInWindow: 4,
      minLengthMatch: 1,
      includeComments: false,
      includeFragments: false,
      includeAnalysisData: true,
      maxFingerprintFileCount: null,
      sortBy: "FileId",
      fragmentSortBy: "FileOrder",
      template: ["template/sum.js"],
    });
  });

  it("parses the flag of a report without analysis data", () => {
    const metadata = parseMetadata(readReportCsv("without-analysis-data", "metadata.csv"));
    expect(metadata.includeAnalysisData).toBe(false);
  });

  it("parses a fingerprint limit as a number", () => {
    const limited = rows.map((row) =>
      row.property === "maxFingerprintFileCount" ? { ...row, value: "12" } : row
    );
    expect(parseMetadata(limited).maxFingerprintFileCount).toBe(12);
  });
});
