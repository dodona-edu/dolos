import * as d3 from "d3";
import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
import { DATA_URL } from "@/api";
import { Pair, ObjMap } from "@/api/models";
import { assertType } from "@/api/utils";
import { useFileStore } from "@/api/stores";

/**
 * Store containing the pair data & helper functions.
 */
export const usePairStore = defineStore("pairs", () => {
  // List of pairs.
  const pairs = ref<Pair[]>([]);

  // If this store has been hydrated.
  const hydrated = ref(false);

  // Parse the pairs from a CSV string.
  function parse(pairData: d3.DSVRowArray, files: ObjMap<File>): ObjMap<Pair> {
    return Object.fromEntries(
      pairData.map((row) => {
        const id = parseInt(assertType(row.id));
        const similarity = parseFloat(assertType(row.similarity));
        const longestFragment = parseFloat(assertType(row.longestFragment));
        const totalOverlap = parseFloat(assertType(row.totalOverlap));
        const leftCovered = parseFloat(assertType(row.leftCovered));
        const rightCovered = parseFloat(assertType(row.rightCovered));

        const diff = {
          id,
          similarity,
          longestFragment,
          totalOverlap,
          leftFile: files[parseInt(assertType(row.leftFileId))],
          rightFile: files[parseInt(assertType(row.rightFileId))],
          fragments: null,
          leftCovered,
          rightCovered,
        };
        return [id, diff];
      })
    );
  }

  // Fetch the pairs from the CSV file.
  async function fetch(
    url: string = DATA_URL + "pairs.csv"
  ): Promise<d3.DSVRowArray> {
    return await d3.csv(url);
  }

  // Reference to the other stores.
  const fileStore = useFileStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error("The file store must be hydrated before the pair store.");
    }

    pairs.value = parse(await fetch(), fileStore.files);
    hydrated.value = true;
  }

  return {
    pairs,
    hydrated,
    hydrate,
  };
});
