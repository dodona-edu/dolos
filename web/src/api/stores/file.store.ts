import * as d3 from "d3";
import { defineStore } from "pinia";
import { shallowRef, computed } from "@vue/composition-api";
import { DATA_URL } from "@/api";
import { File, ObjMap } from "@/api/models";
import { useApiStore } from "@/api/stores";
import { colors, names, uniqueNamesGenerator } from "unique-names-generator";
import { useLegend } from "@/composables";

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
  function parse(fileData: d3.DSVRowArray, anonymize = false): ObjMap<File> {
    const randomNameGenerator = (): string =>
      uniqueNamesGenerator({ dictionaries: [colors, names], length: 2 });

    const labelMap: Map<string, number> = new Map();
    const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;
    let labelCounter = 1;

    const files = fileData.map((row: any) => {
      const file = row as File;
      const extra = JSON.parse(row.extra || "{}");
      extra.timestamp = extra.createdAt && new Date(extra.createdAt);
      file.extra = extra;
      file.ast = JSON.parse(row.ast);
      file.mapping = JSON.parse(row.mapping);
      file.astAndMappingLoaded = true;
      file.amountOfKgrams = file.amountOfKgrams || file.ast.length;

      if (anonymize) {
        const split = row.path!.split(".");
        const extension = split[split.length - 1];
        const name = randomNameGenerator();
        row.path = `${name}/exercise.${extension}`;
        extra.fullName = name;

        const label = labelMap.get(extra.labels) || labelCounter;
        if (!labelMap.has(extra.labels)) {
          labelCounter += 1;
        }
        labelMap.set(extra.labels, label);
        extra.labels = label;

        if (extra.timestamp) {
          extra.timestamp = new Date(extra.timestamp.getTime() + timeOffset);
        }
      }

      return [row.id, row];
    });

    return Object.fromEntries(files);
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
    files.value = parse(await fetch(), apiStore.isAnonymous);
    hydrated.value = true;
  }

  return {
    files,
    filesList,
    hydrated,
    hydrate,
    legend,
  };
});
