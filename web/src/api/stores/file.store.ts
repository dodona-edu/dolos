import { defineStore } from "pinia";
import { shallowRef, computed, nextTick, watch, ref } from "vue";
import { DATA_URL } from "@/api";
import { File, Label, Legend } from "@/api/models";
import { useApiStore, usePairStore } from "@/api/stores";
import { names, uniqueNamesGenerator } from "unique-names-generator";
import { commonFilenamePrefix, parseCsv } from "../utils";
import { FileInterestingnessCalculator, FileScoring, SimilarityScore } from "@/util/FileInterestingness";
import * as d3 from "d3";

/**
 * Store containing the file data & helper functions.
 */
export const useFileStore = defineStore("files", () => {
  // List of files.
  const filesById = shallowRef<File[]>([]);
  const filesList = computed<File[]>(() => Object.values(filesById.value));

  // Partial labels set.
  // Contains fixed values for the label such as color.
  // Does not contain dynamic properties such as current label name or selected.
  const partialLabels = computed<Partial<Label>[]>(() => {
    // Labels for the files.
    const labels: Partial<Label>[] = [];
    for (const file of filesList.value) {
      const originalLabel = file.original.labels ?? "N/A";
      if (labels.find(l => l.originalLabel === originalLabel)) continue;

      labels.push({
        originalLabel: originalLabel,
      });
    }

    // Sort labels on original name.
    // This is necessary to retain the original order of the labels when anonymizing.
    const sortedLabels = [...labels].sort((a, b) =>
      (a.originalLabel ?? "").localeCompare(b.originalLabel ?? "")
    );

    // Add the pseudo label for each label in the set.
    // The pseudo label is the index in the array of labels.
    for (const label of sortedLabels) {
      label.pseudoLabel = String(sortedLabels.indexOf(label)) ?? "N/A";
    }

    // Category 20 colors.
    const colorCategory20 = [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#bcbd22",
      "#17becf",
      "#aec7e8",
      "#ffbb78",
      "#98df8a",
      "#ff9896",
      "#c5b0d5",
      "#c49c94",
      "#f7b6d2",
      "#dbdb8d",
      "#9edae5",
    ];

    // Create a colorscale for the labels.
    const colorScale = d3
      .scaleOrdinal(colorCategory20)
      .domain(sortedLabels.map(l => l.originalLabel ?? "N/A"));

    // Add the colorscale to the labels.
    for (const label of sortedLabels) {
      label.color = colorScale(label.originalLabel ?? "N/A");
    }

    return sortedLabels;
  });

  // Legend
  const legend = ref<Legend>({});
  // Labels
  const labels = ref<Label[]>([]);

  // List of files to display (with active labels)
  const filesActiveById = shallowRef<File[]>([]);
  const filesActiveList = computed(() => {
    return Object.values(filesActiveById.value);
  });

  // Calculate the active files list.
  function calculateActiveFiles(): void {
    // Return all files if no labels are available.
    if (!hasLabels.value) {
      filesActiveById.value = filesById.value;
      return;
    }

    const filesFiltered: File[] = [];

    // Delete all files that don't have any active labels.
    for (const file of filesList.value) {
      const label = getLabel(file);
      if (label.selected) {
        filesFiltered[file.id] = file;
      }
    }

    filesActiveById.value = filesFiltered;
  }

  const pairStore = usePairStore();

  // Update the files to display when the files or active labels change
  watch(legend, () => {
    calculateActiveFiles();
    pairStore.calculateActivePairs();
  }, { deep: true });
  watch(filesById, () => {
    calculateActiveFiles();
    pairStore.calculateActivePairs();
  });

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  const scoringCalculator: any = computed(() =>
    new FileInterestingnessCalculator(pairStore.pairsActiveList)
  );

  // Scored file map.
  const scoredFiles = computed<Map<File, FileScoring>>(() => {
    const scores = new Map();
    for (const file of filesActiveList.value) {
      scores.set(file, scoringCalculator.value.calculateFileScoring(file));
    }
    return scores;
  });

  // Scored file list
  const scoredFilesList = computed<FileScoring[]>(() => Array.from(scoredFiles.value.values()));

  // Similarities map for every file
  // Contains the max similarity for each file.
  const similarities = computed<Map<File, SimilarityScore| null>>(() => {
    // Create a map for storing the highest similarity for each file.
    const similarities = new Map();
    for (const { file, similarityScore } of scoredFilesList.value) {
      similarities.set(file, similarityScore);
    }
    return similarities;
  });

  // Similarities list for every file
  // Contains the highest similarity for each file.
  const similaritiesList = computed(() => Array.from(similarities.value.values()));

  // Parse the files from a CSV string.
  function parse(fileData: any[]): File[] {
    const randomNameGenerator = (): string => uniqueNamesGenerator({
      dictionaries: [names],
      length: 1
    });

    const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;


    const files: File[] = [];

    for (const row of fileData) {
      const file = row as File;
      const filePathSplit = row.path.split(".");
      const filePathExtension = filePathSplit[filePathSplit.length - 1];
      const extra = JSON.parse(row.extra || "{}");
      extra.timestamp = extra.createdAt && new Date(extra.createdAt);
      file.extra = extra;
      file.ast = JSON.parse(row.ast);
      file.mapping = JSON.parse(row.mapping);
      file.astAndMappingLoaded = true;
      file.amountOfKgrams = file.amountOfKgrams || file.ast.length;

      // Store pseudo details.
      const pseudoName = randomNameGenerator();
      const pseudoPath = `${pseudoName}.${filePathExtension}`;
      file.pseudo = {
        path: pseudoPath,
        shortPath: pseudoPath,
        fullName: pseudoName,
        timestamp: extra.timestamp ? new Date(extra.timestamp.getTime() + timeOffset) : undefined,
      };

      // Store original details.
      file.original = {
        path: row.path,
        shortPath: "",
        fullName: extra.fullName,
        timestamp: extra.timestamp,
        labels: extra.labels,
      };

      files[file.id] = file;
    }

    // Find the common path in the files.
    const commonPath = commonFilenamePrefix(Object.values(files), (f) => f.path);
    const commonPathLength = commonPath.length;
    for (const file of Object.values(files)) {
      file.shortPath = file.path.substring(commonPathLength);
      file.original.shortPath = file.shortPath;
    }

    return files;
  }

  // Fetch the files from the CSV file.
  async function fetch(
    url: string = DATA_URL + "files.csv"
  ): Promise<any[]> {
    return await parseCsv(url);
  }

  // Reference to other stores.
  const apiStore = useApiStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    filesById.value = parse(await fetch());
    hydrated.value = true;
  }

  // Anonymize the data.
  function anonymize(): void {
    apiStore.isLoaded = false;
    apiStore.loadingText = "Anonymizing files...";

    // Update the files.
    for (const file of Object.values(filesById.value)) {
      if (apiStore.isAnonymous) {
        file.path = file.pseudo.path;
        file.shortPath = file.pseudo.shortPath;
        file.extra.fullName = file.pseudo.fullName;
        file.extra.timestamp = file.pseudo.timestamp;
        file.extra.labels = getLabel(file).pseudoLabel;
      } else {
        file.path = file.original.path;
        file.shortPath = file.original.shortPath;
        file.extra.fullName = file.original.fullName;
        file.extra.timestamp = file.original.timestamp;
        file.extra.labels = file.original.labels;
      }
    }

    // Update the pairs.
    for (const pair of pairStore.pairsList) {
      pair.leftFile = filesById.value[pair.leftFile.id];
      pair.rightFile = filesById.value[pair.rightFile.id];
    }

    nextTick(() => {
      filesById.value = { ...filesById.value };
      pairStore.pairs = { ...pairStore.pairs };
      apiStore.isLoaded = true;
    });
  }

  // Get a file by its ID.
  function getFile(id: number): File | undefined {
    return filesById.value[id];
  }

  // Get the label for a file from the legend.
  function getLabel(file: File | undefined): Label {
    const defaultLabel = {
      label: "No Label",
      selected: false,
      color: "#1976d2",
    };

    return legend.value?.[file?.extra?.labels ?? ""] ?? defaultLabel;
  }

  // If timestamp is available for the files.
  const hasTimestamp = computed(() =>
    filesList.value.some((file) => file.extra.timestamp)
  );

  // If labels are available for the files.
  const hasLabels = computed(() =>
    filesList.value.some((file) => file.extra.labels)
  );

  // Calculate the legend when the files change.
  watch(filesList, () => {
    const oldLegend = Object.values(legend.value);

    labels.value = partialLabels.value.map((l) => {
      const oldLabel = oldLegend.find(ol => ol.originalLabel === l.originalLabel);

      return {
        label: (apiStore.isAnonymous ? l.pseudoLabel : l.originalLabel) ?? "N/A",
        pseudoLabel: l.pseudoLabel ?? "N/A",
        originalLabel: l.originalLabel ?? "N/A",
        color: l.color ?? "#1976d2",
        selected: oldLabel ? oldLabel.selected : true,
      };
    });

    legend.value = Object.fromEntries(labels.value.map((l) => [l.label, l]));
  });

  // Map containing the the amount of files for each label.
  const labelFilesCount = computed(() => {
    const values: { [key: string]: number } = {};

    for (const file of filesList.value) {
      const label = file.extra.labels;
      if (!label) continue;
      if (!values[label]) values[label] = 0;
      values[label] += 1;
    }

    return values;
  });

  return {
    filesById,
    filesList,
    filesActiveById,
    filesActiveList,
    scoredFiles,
    scoredFilesList,
    similarities,
    similaritiesList,
    hydrated,
    hydrate,
    legend,
    labels,
    anonymize,
    getFile,
    getLabel,
    hasTimestamp,
    hasLabels,
    labelFilesCount,
  };
});
