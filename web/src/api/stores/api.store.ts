import { defineStore } from "pinia";
import { useAppMode } from "@/composables";
import { shallowRef, watch } from "vue";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
} from "@/api/stores";
import { refDebounced } from "@vueuse/shared";
import { guessSimilarityThreshold } from "../utils";
import { useDuckDB } from "@/composables/useDuckDB";
import { computed, ShallowRef } from "vue";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

/**
 * Store managing the API.
 */
export const useApiStore = defineStore("api", () => {

  // API Stores
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();

  const duckdb: ShallowRef<AsyncDuckDBConnection | undefined> = shallowRef();

  // If the data is loaded.
  const loading = shallowRef(true);
  // Loading text.
  const loadingText = shallowRef("Loading...");
  // Error while loading.
  const error = shallowRef();

  // Whether the names should be anonymized.
  const isAnonymous = shallowRef(false);

  // Cut-off value.
  const cutoff = shallowRef(0.75);
  const cutoffDefault = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

  // Hydrate the API stores.
  const hydrate = async (): Promise<void> => {
    loading.value = true;
    console.time("Hydrate");
    try {
      const conn = await useDuckDB(dataUrl.value + '/dolos.db');

      // Hydrate all stores (fetch data)
      loadingText.value = "Fetching & parsing metadata...";
      await metadataStore.hydrate(conn);

      loadingText.value = "Fetching & parsing files...";
      await fileStore.hydrate(conn);

      loadingText.value = "Fetching & parsing k-grams...";
      await kgramStore.hydrate(conn);

      loadingText.value = "Fetching & parsing pairs...";
      await pairStore.hydrate(conn);

      // Calculate the initial cut-off value.
      loadingText.value = "Calculating initial cut-off...";
      cutoff.value = guessSimilarityThreshold(pairStore.pairsActiveList);
      cutoffDefault.value = cutoff.value;
    } catch (e) {
      error.value = e;
    }

    loading.value = false;
    console.timeEnd("Hydrate");
    await fetch(dataUrl.value + '/done');
  };

  const { dataUrl } = useAppMode();

  // Re-hydrate the API stores when the anonymous value changes.
  watch(isAnonymous, () => fileStore.anonymize());
  // Re-hydrate the API stores when the url value changes.
  watch(dataUrl, () => {
    if (dataUrl) {
      hydrate();
    }
  });

  return {
    url: dataUrl,
    isAnonymous,
    loading,
    loadingText,
    error,
    cutoff,
    cutoffDefault,
    cutoffDebounced,
    hydrate,
  };
});
