import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { Metadata } from "@/api/models";
import { parseCsv, parseMetadata } from "@/api/utils";
import { useAppMode } from "@/composables";

/**
 * Store containing the metadata & helper functions.
 */
export const useMetadataStore = defineStore("metadata", () => {
  const { dataUrl } = useAppMode();

  // Metadata.
  const metadata = shallowRef<Metadata>({} as Metadata);

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Fetch the metadata from the CSV file.
  async function fetch(): Promise<any[]> {
    const url = dataUrl.value + "/metadata.csv";
    return await parseCsv(url);
  }

  // Hydrate the store
  async function hydrate(): Promise<void> {
    metadata.value = parseMetadata(await fetch());
    hydrated.value = true;
  }

  return {
    metadata,
    hydrated,
    hydrate,
  };
});
