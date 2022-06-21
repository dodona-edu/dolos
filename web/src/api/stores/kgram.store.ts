import * as d3 from "d3";
import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
import { DATA_URL } from "@/api";
import { Kgram, File, ObjMap } from "@/api/models";
import { assertType } from "@/api/utils";
import { useFileStore } from "@/api/stores";

/**
 * Store containing the k-grams data & helper functions.
 */
export const useKgramStore = defineStore("kgrams", () => {
  // List of k-grams.
  const kgrams = ref<ObjMap<Kgram>>({});

  // If this store has been hydrated.
  const hydrated = ref(false);

  // Parse the k-grams from a CSV string.
  function parse(
    kgramData: d3.DSVRowArray,
    fileMap: ObjMap<File>
  ): ObjMap<Kgram> {
    return Object.fromEntries(
      kgramData.map((row) => {
        const id = parseInt(assertType(row.id));
        const fileIds: number[] = assertType(JSON.parse(assertType(row.files)));
        const files: File[] = fileIds.map((id) => fileMap[id]);
        const kgram = {
          id,
          hash: parseInt(assertType(row.hash)),
          data: assertType(row.data),
          files,
        };
        return [id, kgram];
      })
    );
  }

  // Fetch the k-grams from the CSV file.
  async function fetch(
    url: string = DATA_URL + "kgrams.csv"
  ): Promise<d3.DSVRowArray> {
    return await d3.csv(url);
  }

  // Reference to other stores.
  const fileStore = useFileStore();

  // Hydrate the store
  async function hydrate(): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error(
        "The file store must be hydrated before the kgram store."
      );
    }

    kgrams.value = parse(await fetch(), fileStore.files);
    hydrated.value = true;
  }

  return {
    kgrams,
    hydrated,
    hydrate,
  };
});
