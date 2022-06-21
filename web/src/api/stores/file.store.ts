import * as d3 from "d3";
import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
import { DATA_URL } from "@/api";
import { File, ObjMap } from "@/api/models";
import { colors, names, uniqueNamesGenerator } from "unique-names-generator";

/**
 * Store containing the file data & helper functions.
 */
export const useFileStore = defineStore("files", () => {
  // List of files.
  const files = ref<File[]>([]);

  // If this store has been hydrated.
  const hydrated = ref(false);

  // Parse the files from a CSV string.
  function parse(
    fileData: d3.DSVRowArray,
    anonymize = false
  ): ObjMap<File> {
    const randomNameGenerator = (): string =>
      uniqueNamesGenerator({ dictionaries: [colors, names], length: 2 });
    const labelMap: Map<string, number> = new Map();
    const timeOffset = Math.random() * 1000 * 60 * 60 * 24 * 20;
    let labelCounter = 1;

    return Object.fromEntries(
      fileData.map((row) => {
        const extra = JSON.parse(row.extra || "{}");
        extra.timestamp = extra.createdAt && new Date(extra.createdAt);
        row.extra = extra;

        if (anonymize) {
          const split = row.path?.split(".");
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
        // row.mapping = JSON.parse(row.mapping || "[]");
        // row.ast = JSON.parse(row.ast || "[]");
        return [row.id, row];
      })
    );
  }

  // Fetch the files from the CSV file.
  async function fetch(
    url: string = DATA_URL + "files.csv"
  ): Promise<d3.DSVRowArray> {
    return await d3.csv(url);
  }

  // Hydrate the store
  async function hydrate(): Promise<void> {
    files.value = parse(await fetch(), {});
    hydrated.value = true;
  }

  return {
    files,
    hydrated,
    hydrate,
  };
});
