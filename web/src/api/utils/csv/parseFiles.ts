import { names, animals, uniqueNamesGenerator } from "unique-names-generator";
import { DateTime } from "luxon";
import { AnalysisData, File, Label, Legend } from "@/api/models";
import { commonFilenamePrefix } from "@/api/utils/file";

export const DEFAULT_LABEL: Label = {
  name: "No label",
  color: "#666",
  selected: true,
  pseudoLabel: "No label",
  originalLabel: "No label",
};

const COLOR_CATEGORY20 = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#bcbd22", "#17becf", "#aec7e8",
  "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94",
  "#f7b6d2", "#dbdb8d", "#9edae5",
];

// Parse the analysis data columns of a row of `files.csv`.
// The columns are empty when the report has no analysis data.
function parseAnalysisData(row: any): AnalysisData | undefined {
  if (!row.fingerprints) return undefined;
  return {
    fingerprints: JSON.parse(row.fingerprints),
    regions: JSON.parse(row.fingerprintRegions),
    ignored: JSON.parse(row.ignoredIntervals),
  };
}

// Parse a `created_at` value as ISO 8601 or in the Dodona format `2019-07-23 17:12:33 +0200`.
function parseTimestamp(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const candidates = [
    DateTime.fromISO(value, { setZone: true }),
    DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss ZZZ", { setZone: true }),
  ];
  return candidates.find((candidate) => candidate.isValid)?.toJSDate();
}

// Parse the name, the label and the timestamp from the `info` JSON column of a row of `files.csv`.
// A value is undefined when the column is empty or absent, or when it has no such key.
function parseExtra(row: any): File["extra"] {
  const info = JSON.parse(row.info || "{}");
  return {
    fullName: info.full_name || undefined,
    labels: info.labels || info.label || undefined,
    timestamp: parseTimestamp(info.created_at),
  };
}

export interface ParseFilesResult {
  files: File[];
  labels: Legend;
  hasLabels: boolean;
  hasUnlabeled: boolean;
  hasTimestamps: boolean;
}

export function parseFiles(fileData: any[]): ParseFilesResult {
  const randomName = (): string =>
    uniqueNamesGenerator({ dictionaries: [names], length: 1 });
  const randomLabel = (): string =>
    uniqueNamesGenerator({ dictionaries: [animals], style: "capital", length: 1 });

  const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;

  const files: File[] = [];
  const labels: Legend = {};
  let hasLabels = false;
  let hasUnlabeled = false;
  let hasTimestamps = false;

  for (const row of fileData) {
    const ext = row.path.split(".").pop() ?? "";
    const extra = parseExtra(row);
    hasTimestamps = hasTimestamps || !!extra.timestamp;
    const analysisData = parseAnalysisData(row);
    const file = {
      id: parseInt(row.id),
      path: row.path,
      content: row.content,
      analysisData,
      amountOfKgrams: analysisData?.fingerprints.length ?? 0,
      extra,
    } as File;

    if (extra.labels) {
      hasLabels = true;
      if (!labels[extra.labels]) {
        labels[extra.labels] = {
          name: extra.labels,
          selected: true,
          originalLabel: extra.labels,
          color: "",
          pseudoLabel: "",
        };
      }
      file.label = labels[extra.labels];
    } else {
      hasUnlabeled = true;
      file.label = DEFAULT_LABEL;
    }

    const pseudoName = randomName();
    const pseudoPath = `${pseudoName}.${ext}`;
    file.pseudo = {
      path: pseudoPath,
      shortPath: pseudoPath,
      fullName: pseudoName,
      timestamp: extra.timestamp
        ? new Date(extra.timestamp.getTime() - timeOffset)
        : undefined,
    };
    file.original = {
      path: row.path,
      shortPath: "",
      fullName: extra.fullName,
      timestamp: extra.timestamp,
      labels: extra.labels,
    };

    files[file.id] = file;
  }

  const commonPath = commonFilenamePrefix(Object.values(files));
  for (const file of Object.values(files)) {
    file.shortPath = file.path.substring(commonPath.length);
    file.original.shortPath = file.shortPath;
  }

  // Assign colors and pseudo-labels alphabetically for consistency.
  const sortedLabels = Object.values(labels).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (let i = 0; i < sortedLabels.length; i++) {
    sortedLabels[i].color = COLOR_CATEGORY20[i % COLOR_CATEGORY20.length];
    sortedLabels[i].pseudoLabel = randomLabel();
  }

  if (hasUnlabeled) {
    labels[DEFAULT_LABEL.name] = DEFAULT_LABEL;
  }

  return { files, labels, hasLabels, hasUnlabeled, hasTimestamps };
}
