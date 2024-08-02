import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { Kgram, File } from "@/api/models";
import { parseCsv } from "@/api/utils";
import { useFileStore, useApiStore } from "@/api/stores";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

/**
 * Store containing the k-grams data & helper functions.
 */
export const useKgramStore = defineStore("kgrams", () => {
  // List of k-grams.
  const kgrams = shallowRef<Kgram[]>([]);
  const ignoredKgrams = shallowRef<Kgram[]>([]);

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Parse the k-grams from a CSV string.
  function parse(
    kgramData: any[],
    filesById: File[]
  ): {
    kgrams: Kgram[],
    ignored: Kgram[]
  } {
    const kgrams: Kgram[] = [];
    const ignored: Kgram[] = [];
    for (const row of kgramData) {
      const id = row.id;
      const fileIds: number[] = row.files.toArray();
      const files: File[] = fileIds.map((id) => filesById[id]);
      const kgram = {
        id,
        hash: Number(row.hash),
        ignored: row.ignored == "true",
        data: row.data,
        files,
      };
      if (kgram.ignored) {
        ignored.push(kgram);
      } else {
        kgrams[id] = kgram;
      }

    }
    return {
      kgrams,
      ignored
    };
  }

  // Reference to other stores.
  const apiStore = useApiStore();
  const fileStore = useFileStore();

  // Fetch the k-grams from the CSV file.
  async function fetch(conn: AsyncDuckDBConnection): Promise<any[]> {
    const result = await conn.query("SELECT * from kgrams");
    return result.toArray();
  }

  // Hydrate the store
  async function hydrate(conn: AsyncDuckDBConnection): Promise<void> {
    // Make sure the file store is hydrated.
    if (!fileStore.hydrated) {
      throw new Error(
        "The file store must be hydrated before the kgram store."
      );
    }

    const parsed = parse(await fetch(conn), fileStore.filesById);
    kgrams.value = parsed.kgrams;
    ignoredKgrams.value = parsed.ignored;
    hydrated.value = true;
  }

  return {
    kgrams,
    ignoredKgrams,
    hydrated,
    hydrate,
  };
});
