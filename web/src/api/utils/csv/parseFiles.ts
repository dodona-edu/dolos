import { names, animals, uniqueNamesGenerator } from "unique-names-generator";
import { File, Label, Legend } from "@/api/models";
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

export interface ParseFilesResult {
  files: File[];
  ignoredFile?: File;
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
  let ignoredFile: File | undefined;
  let hasLabels = false;
  let hasUnlabeled = false;
  let hasTimestamps = false;

  for (const row of fileData) {
    const file = row as File;
    const ext = row.path.split(".").pop() ?? "";
    const extra = JSON.parse(row.extra || "{}");
    extra.timestamp = extra.createdAt ? new Date(extra.createdAt) : undefined;
    hasTimestamps = hasTimestamps || !!extra.timestamp;
    file.ignored = row.ignored === "true";
    file.extra = extra;
    file.ast = JSON.parse(row.ast);
    file.mapping = JSON.parse(row.mapping);
    file.astAndMappingLoaded = true;
    file.amountOfKgrams = file.amountOfKgrams || file.ast.length;

    if (extra.labels?.length > 0) {
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

    if (!file.ignored) {
      files[file.id] = file;
    } else {
      ignoredFile = file;
    }
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

  return { files, ignoredFile, labels, hasLabels, hasUnlabeled, hasTimestamps };
}
