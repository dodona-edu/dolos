import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { DATA_URL } from "@/api";
import { Metadata } from "@/api/models";
import { castToType, parseCsv } from "@/api/utils";

/**
 * Store containing the metadata & helper functions.
 */
export const useMetadataStore = defineStore("metadata", () => {
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
  async function fetch(
    url: string = DATA_URL + "metadata.csv"
  ): Promise<any[]> {
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
