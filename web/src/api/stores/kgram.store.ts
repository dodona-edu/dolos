import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { DATA_URL } from "@/api";
import { File, Kgram } from "@/api/models";
import { parseCsv } from "@/api/utils";
import { useFileStore } from "@/api/stores";

/**
 * Store containing the k-grams data & helper functions.
 */
export const useKgramStore = defineStore("kgrams", () => {
  // List of k-grams.
  const kgrams = shallowRef<Kgram[]>([]);

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Parse the k-grams from a CSV string.
  function parse(
    kgramData: any[],
    filesById: File[]
  ): Kgram[] {
    const kgrams: Kgram[] = [];
    for (const row of kgramData) {
      const id = parseInt(row.id);
      const fileIds: number[] = JSON.parse(row.files);
      const files: File[] = fileIds.map((id) => filesById[id]);
      kgrams[id] = {
        id,
        hash: parseInt(row.hash),
        data: row.data,
        files,
      };
    }
    return kgrams;
  }

  // Fetch the k-grams from the CSV file.
  async function fetch(
    url: string = DATA_URL + "kgrams.csv"
  ): Promise<any[]> {
    return await parseCsv(url);
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

    kgrams.value = parse(await fetch(), fileStore.filesById);
    hydrated.value = true;
  }

  return {
    kgrams,
    hydrated,
    hydrate,
  };
});
