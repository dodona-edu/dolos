import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { Metadata } from "@/api/models";
import { castToType, parseCsv } from "@/api/utils";
import { useApiStore } from "@/api/stores";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

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
      data.map(row => [row.key, castToType(row).value])
    );
  }

  // Reference to other stores.
  const apiStore = useApiStore();

  // Fetch the metadata from the CSV file.
  async function fetch(conn: AsyncDuckDBConnection): Promise<any[]> {
    const result = await conn.query('SELECT * from metadata');
    return result.toArray();
  }

  // Hydrate the store
  async function hydrate(conn: AsyncDuckDBConnection): Promise<void> {
    metadata.value = parse(await fetch(conn));
    hydrated.value = true;
  }

  return {
    metadata,
    hydrated,
    hydrate,
  };
});
