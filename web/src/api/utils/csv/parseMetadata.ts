import { Metadata } from "@/api/models";

/**
 * Parse the rows of `metadata.csv`.
 */
export function parseMetadata(rows: { property: string; value: string }[]): Metadata {
  const values = new Map(rows.map((row) => [row.property, row.value]));
  const text = (property: string): string => values.get(property) ?? "";
  const integer = (property: string): number => parseInt(text(property));
  const flag = (property: string): boolean => text(property) === "true";

  return {
    reportName: text("reportName"),
    createdAt: text("createdAt"),
    language: text("language"),
    kgramLength: integer("kgramLength"),
    kgramsInWindow: integer("kgramsInWindow"),
    minLengthMatch: integer("minLengthMatch"),
    includeComments: flag("includeComments"),
    includeFragments: flag("includeFragments"),
    includeAnalysisData: flag("includeAnalysisData"),
    maxFingerprintFileCount: text("maxFingerprintFileCount") === "null" ? null : integer("maxFingerprintFileCount"),
    sortBy: text("sortBy"),
    fragmentSortBy: text("fragmentSortBy"),
    template: JSON.parse(text("template") || "[]"),
  };
}
