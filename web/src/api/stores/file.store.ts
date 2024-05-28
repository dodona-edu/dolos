import { defineStore } from "pinia";
import { shallowRef, computed, nextTick, watch, ref, ComputedRef } from "vue";
import { File, Label, Legend, Pair } from "@/api/models";
import { useApiStore, usePairStore } from "@/api/stores";
import { names, animals, uniqueNamesGenerator } from "unique-names-generator";
import { commonFilenamePrefix, parseCsv } from "../utils";
import {
  FileInterestingnessCalculator,
  FileScoring,
  SimilarityScore,
} from "@/util/FileInterestingness";

/**
 * Store containing the file data & helper functions.
 */
export const useFileStore = defineStore("file", () => {
  // Stores
  const apiStore = useApiStore();
  const pairStore = usePairStore();

  // State
  const hydrated = shallowRef(false);

  const ignoredFile = shallowRef<File | undefined>();
  const filesById = shallowRef<File[]>([]);
  const filesList = computed(() => Object.values(filesById.value));

  const hasLabels = shallowRef(false);
  const hasUnlabeled = shallowRef(false);
  const hasTimestamps = shallowRef(false);

  const filesActiveById = shallowRef<File[]>([]);
  const filesActiveList = computed<File[]>(() =>
    Object.values(filesActiveById.value)
  );

  const defaultLabel: Label = {
    name: "No label",
    color: "#666",
    selected: true,
    pseudoLabel: "No label",
    originalLabel: "No label",
  };
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

  const legend = ref<Legend>({});
  const labels = computed(() => Object.values(legend.value).reverse());
  const labelFilesCount: ComputedRef<Map<string, number>> = computed(() => {
    const files = filesActiveList.value;
    const count = new Map<string, number>();
    for (const file of files) {
      count.set(file.label.name, (count.get(file.label.name) || 0) + 1);
    }
    return count;
  });

  const scoringCalculator: any = computed(
    () => new FileInterestingnessCalculator(pairStore.pairsActiveList)
  );
  const scoredFiles = computed<Map<File, FileScoring>>(() => {
    const files = filesList.value;
    const calculator = scoringCalculator.value;
    return new Map(
      files.map((file) => [file, calculator.calculateFileScoring(file)])
    );
  });
  const scoredFilesList = computed<FileScoring[]>(() =>
    Array.from(scoredFiles.value.values())
  );
  const similarities = computed<Map<File, SimilarityScore | null>>(
    () =>
      new Map(
        scoredFilesList.value.map(({ file, similarityScore }) => [
          file,
          similarityScore,
        ])
      )
  );
  const similaritiesList = computed<SimilarityScore[]>(
    () =>
      Array.from(similarities.value.values()).filter(
        (s) => s !== null
      ) as SimilarityScore[]
  );

  // Functions

  async function hydrate(): Promise<void> {
    const parsed = parse(await fetch());
    filesById.value = parsed.files;
    filesActiveById.value = parsed.files;
    ignoredFile.value = parsed.ignoredFile;
    legend.value = parsed.labels;
    hasLabels.value = parsed.hasLabels;
    hasUnlabeled.value = parsed.hasUnlabeled;
    hasTimestamps.value = parsed.hasTimestamps;
    hydrated.value = true;
  }

  async function fetch(
    url: string = apiStore.url + "/files.csv"
  ): Promise<any[]> {
    return await parseCsv(url);
  }

  // Parse the files from a CSV string.
  function parse(fileData: any[]): {
    ignoredFile?: File;
    files: File[];
    labels: Legend;
    hasLabels: boolean;
    hasUnlabeled: boolean;
    hasTimestamps: boolean;
  } {
    const randomNameGenerator = (): string =>
      uniqueNamesGenerator({
        dictionaries: [names],
        length: 1,
      });

    const randomLabelGenerator = (): string =>
      uniqueNamesGenerator({
        dictionaries: [animals],
        style: "capital",
        length: 1,
      });

    const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;

    const files: File[] = [];
    const labels: Legend = {};
    let ignoredFile;
    let hasLabels = false;
    let hasUnlabeled = false;
    let hasTimestamps = false;

    for (const row of fileData) {
      const file = row as File;
      const filePathSplit = row.path.split(".");
      const filePathExtension = filePathSplit[filePathSplit.length - 1];
      const extra = JSON.parse(row.extra || "{}");
      extra.timestamp = extra.createdAt && new Date(extra.createdAt);
      hasTimestamps = hasTimestamps || !!extra.timestamp;
      file.ignored = row.ignored == "true"
      file.extra = extra;
      file.ast = JSON.parse(row.ast);
      file.mapping = JSON.parse(row.mapping);
      file.astAndMappingLoaded = true;
      file.amountOfKgrams = file.amountOfKgrams || file.ast.length;

      if (extra.labels && extra.labels.length > 0) {
        hasLabels = true;
        let label = labels[extra.labels];
        if (!label) {
          label = {
            name: extra.labels,
            selected: true,
            originalLabel: extra.labels,
            // These will be filled later
            color: "",
            pseudoLabel: "",
          };
          labels[extra.labels] = label;
        }
        file.label = label;
      } else {
        hasUnlabeled = true;
        file.label = defaultLabel;
      }

      // Store pseudo details.
      const pseudoName = randomNameGenerator();
      const pseudoPath = `${pseudoName}.${filePathExtension}`;
      file.pseudo = {
        path: pseudoPath,
        shortPath: pseudoPath,
        fullName: pseudoName,
        timestamp: extra.timestamp
          ? new Date(extra.timestamp.getTime() - timeOffset)
          : undefined,
      };

      // Store original details.
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

    // Find the common path in the files.
    const commonPath = commonFilenamePrefix(
      Object.values(files),
      (f) => f.path
    );
    const commonPathLength = commonPath.length;
    for (const file of Object.values(files)) {
      file.shortPath = file.path.substring(commonPathLength);
      file.original.shortPath = file.shortPath;
    }

    // To achieve consistent colors and random names, sort the labels by original name.
    const sortedLabels = Object.values(labels).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (let i = 0; i < sortedLabels.length; i++) {
      sortedLabels[i].color = colorCategory20[i % colorCategory20.length];
      sortedLabels[i].pseudoLabel = randomLabelGenerator();
    }

    if (hasUnlabeled) {
      labels[defaultLabel.name] = defaultLabel;
    }

    return { files, ignoredFile, labels, hasLabels, hasUnlabeled, hasTimestamps };
  }

  // Anonymize the data.
  function anonymize(): void {
    apiStore.loading = true;
    apiStore.loadingText = "Anonymizing files...";
    const isAnonymous = apiStore.isAnonymous;

    // Update the files.
    for (const file of Object.values(filesById.value)) {
      if (isAnonymous) {
        file.path = file.pseudo.path;
        file.shortPath = file.pseudo.shortPath;
        file.extra.fullName = file.pseudo.fullName;
        file.extra.timestamp = file.pseudo.timestamp;
      } else {
        file.path = file.original.path;
        file.shortPath = file.original.shortPath;
        file.extra.fullName = file.original.fullName;
        file.extra.timestamp = file.original.timestamp;
      }
    }

    for (const label of Object.values(legend.value)) {
      label.name = isAnonymous ? label.pseudoLabel : label.originalLabel;
    }

    // Update the pairs.
    for (const pair of Object.values<Pair>(pairStore.pairs)) {
      pair.leftFile = filesById.value[pair.leftFile.id];
      pair.rightFile = filesById.value[pair.rightFile.id];
    }

    nextTick(() => {
      filesById.value = { ...filesById.value };
      pairStore.pairs = { ...pairStore.pairs };
      legend.value = { ...legend.value };
      apiStore.loading = false;
    });
  }

  // Labels can be toggled on and off, requires the active files to be recalculated.
  watch(
    legend,
    () => {
      if (hasLabels.value) {
        const files: File[] = [];
        for (const file of filesList.value) {
          if (file.label.selected) {
            files[file.id] = file;
          }
        }
        filesActiveById.value = files;
      }
    },
    { deep: true }
  );

  return {
    ignoredFile,
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
    hasTimestamps,
    hasLabels,
    hasUnlabeled,
    labelFilesCount,
  };
});
