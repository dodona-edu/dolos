import * as d3 from "d3";
import { defineStore } from "pinia";
import { shallowRef, computed, nextTick } from "vue";
import { DATA_URL } from "@/api";
import { File, ObjMap } from "@/api/models";
import { useApiStore } from "@/api/stores";
import { colors, names, uniqueNamesGenerator } from "unique-names-generator";
import { useLegend } from "@/composables";
import { commonFilenamePrefix } from "../utils";

/**
 * Store containing the file data & helper functions.
 */
export const useFileStore = defineStore("files", () => {
  // List of files.
  const files = shallowRef<ObjMap<File>>({});
  const filesList = computed<File[]>(() => Object.values(files.value));

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Legend of files.
  const legend = useLegend(files);

  // Parse the files from a CSV string.
  function parse(fileData: d3.DSVRowArray): ObjMap<File> {
    const randomNameGenerator = (): string => uniqueNamesGenerator({
      dictionaries: [colors, names],
      length: 2
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
      file.pseudo = {
        path: `/exercise/${pseudoName}.${filePathExtension}`,
        shortPath: "",
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
    const commonPseudoPath = commonFilenamePrefix(Object.values(files), (f) => f.pseudo.path);
    const commonPseudoPathLength = commonPseudoPath.length;
    for (const file of Object.values(files)) {
      file.shortPath = file.path.substring(commonPathLength);
      file.pseudo.shortPath = file.pseudo.path.substring(commonPseudoPathLength);
      file.original.shortPath = file.shortPath;
    }

    return files;
  }

  // Fetch the files from the CSV file.
  async function fetch(
    url: string = DATA_URL + "files.csv"
  ): Promise<d3.DSVRowArray> {
    return await d3.csv(url);
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

  return {
    files,
    filesList,
    hydrated,
    hydrate,
    legend,
    anonymize
  };
});
