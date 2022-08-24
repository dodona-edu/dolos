import { defineStore } from "pinia";
import { shallowRef, computed, nextTick, watch } from "vue";
import { DATA_URL } from "@/api";
import { File, Label, Legend, ObjMap } from "@/api/models";
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
  const files = shallowRef<ObjMap<File>>({});
  const filesList = computed<File[]>(() => Object.values(files.value));

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  const pairStore = usePairStore();
  const scoringCalculator: any = computed(() =>
    new FileInterestingnessCalculator(pairStore.pairsList)
  );

  // Scored file map.
  const scoredFiles = computed(() => {
    const scores = new Map<File, FileScoring>();
    for (const file of filesList.value) {
      scores.set(file, scoringCalculator.value.calculateFileScoring(file));
    }
    return scores;
  });

  // Scored file list
  const scoredFilesList = computed(() => filesList.value.map((file) =>
    scoringCalculator.value.calculateFileScoring(file)
  ));

  // Similarities map for every file
  // Contains the max similarity for each file.
  const similarities = computed(() => {
    // Create a map for storing the highest similarity for each file.
    const similarities = new Map<File, SimilarityScore | null>();
    for (const file of filesList.value) {
      similarities.set(file, scoringCalculator.value.calculateSimilarityScore(file));
    }

    return similarities;
  });

  // Similarities list for every file
  // Contains the highest similarity for each file.
  const similaritiesList = computed(() => [...similarities.value.values()]);

  // Parse the files from a CSV string.
  function parse(fileData: any[]): ObjMap<File> {
    const randomNameGenerator = (): string => uniqueNamesGenerator({
      dictionaries: [names],
      length: 1
    });

    const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;
    const labels: string[] = [];

    const filesMap = fileData.map((row: any) => {
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

      // Add the label to the labels list, if it doesn't exist yet.
      if (!labels.includes(row.label)) {
        labels.push(extra.labels);
      }

      // Store pseudo details.
      const pseudoName = randomNameGenerator();
      const pseudoPath = `${pseudoName}.${filePathExtension}`;
      file.pseudo = {
        path: pseudoPath,
        shortPath: pseudoPath,
        fullName: pseudoName,
        timestamp: extra.timestamp ? new Date(extra.timestamp.getTime() + timeOffset) : undefined,
        labels: String(labels.indexOf(extra.labels)) ?? "",
      };

      // Store original details.
      file.original = {
        path: row.path,
        shortPath: "",
        fullName: extra.fullName,
        timestamp: extra.timestamp,
        labels: extra.labels,
      };

      return [row.id, row];
    });
    const files: File[] = Object.fromEntries(filesMap);

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
    files.value = parse(await fetch());
    hydrated.value = true;
  }

  // Anonymize the data.
  function anonymize(): void {
    apiStore.isLoaded = false;
    apiStore.loadingText = "Anonymizing files...";

    for (const file of Object.values(files.value)) {
      if (apiStore.isAnonymous) {
        file.path = file.pseudo.path;
        file.shortPath = file.pseudo.shortPath;
        file.extra.fullName = file.pseudo.fullName;
        file.extra.timestamp = file.pseudo.timestamp;
        file.extra.labels = file.pseudo.labels;
      } else {
        file.path = file.original.path;
        file.shortPath = file.original.shortPath;
        file.extra.fullName = file.original.fullName;
        file.extra.timestamp = file.original.timestamp;
        file.extra.labels = file.original.labels;
      }
    }

    nextTick(() => {
      files.value = { ...files.value };
      apiStore.isLoaded = true;
    });
  }

  // Get a file by its ID.
  function getFile(id: number): File | undefined {
    return files.value[id];
  }

  // Get the label for a file from the legend.
  function getLabel(file: File | undefined): Label {
    const defaultLabel = {
      label: "No Label",
      selected: false,
      color: "grey",
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

  // Legend
  const legend = shallowRef<Legend>();

  // Create a legend for a given set of files.
  function createLegend(files: File[]): Legend {
    // Labels for the files.
    const labels = new Set<string>();
    for (const file of files) {
      labels.add(file.extra.labels || "N/A");
    }

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10.filter((c) => c !== "#7f7f7f"))
      .domain([...labels].reverse());

    const legendList = [...labels].sort().map((p) => ({
      label: p,
      selected: legend.value?.[p]?.selected ?? true,
      color: colorScale(p),
    }));

    return Object.fromEntries(legendList.map((l) => [l.label, l]));
  }

  // Calculate the legend when the files change.
  watch(filesList, (files) => {
    legend.value = createLegend(files);
  });

  return {
    files,
    filesList,
    scoredFiles,
    scoredFilesList,
    similarities,
    similaritiesList,
    hydrated,
    hydrate,
    legend,
    anonymize,
    getFile,
    getLabel,
    hasTimestamp,
    hasLabels,
  };
});
