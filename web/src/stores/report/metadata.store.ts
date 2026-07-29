import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { Metadata } from "@/api/models";
import { castToType, parseCsv } from "@/api/utils";
import { useAppMode } from "@/composables";

/**
 * Store containing the metadata & helper functions.
 */
export const useMetadataStore = defineStore("metadata", () => {
  const { dataUrl } = useAppMode();

  // Metadata.
  const metadata = shallowRef<Metadata>({});

  // If this store has been hydrated.
  const hydrated = shallowRef(false);

  // Parse the metadata from a CSV string.
  function parse(data: any[]): Metadata {
    return Object.fromEntries(
      data.map(row => [row.property, castToType(row).value])
    );
  }

  // Fetch the metadata from the CSV file.
  async function fetch(): Promise<any[]> {
    const url = dataUrl.value + "/metadata.csv";
    return await parseCsv(url);
  }

  // Hydrate the store
  async function hydrate(): Promise<void> {
    metadata.value = parse(await fetch());
    hydrated.value = true;
  }

  return {
    metadata,
    hydrated,
    hydrate,
  };
});
