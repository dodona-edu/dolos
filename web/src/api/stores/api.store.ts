import { DATA_URL } from "@/api";
import { defineStore } from "pinia";
import { useRoute } from "@/composables";
import { shallowRef, watch, computed } from "vue";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
} from "@/api/stores";
import { refDebounced } from "@vueuse/shared";
import { guessSimilarityThreshold } from "../utils";

/**
 * Store managing the API.
 */
export const useApiStore = defineStore("api", () => {
  // API Stores
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();

  // Current route.
  const route = useRoute();

  // URL to the data.
  const url = computed(() => {
    if (process.env.VUE_APP_MODE === "server") {
      return `${process.env.VUE_APP_API_URL}/reports/${route.value.params.reportId}/data`;
    } else {
      return DATA_URL;
    }
  });

  // If the data is loaded.
  const isLoaded = shallowRef(false);
  // Loading text.
  const loadingText = shallowRef("Loading...");

  // Whether the names should be anonymized.
  const isAnonymous = shallowRef(false);

  // Cut-off value.
  const cutoff = shallowRef(0.75);
  const cutoffDefault = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

  // Hydrate the API stores.
  const hydrate = async (): Promise<void> => {
    isLoaded.value = false;

    // Hydrate all stores (fetch data)
    loadingText.value = "Fetching & parsing files...";
    await fileStore.hydrate();
    loadingText.value = "Fetching & parsing k-grams...";
    await kgramStore.hydrate();
    loadingText.value = "Fetching & parsing metadata...";
    await metadataStore.hydrate();
    loadingText.value = "Fetching & parsing pairs...";
    await pairStore.hydrate();

    // Calculate the initial cut-off value.
    loadingText.value = "Calculating initial cut-off...";
    cutoff.value = guessSimilarityThreshold(pairStore.pairsActiveList);
    cutoffDefault.value = cutoff.value;

    isLoaded.value = true;
  };

  // Re-hydrate the API stores when the anonymous value changes.
  watch(isAnonymous, () => fileStore.anonymize());
  // Re-hydrate the API stores when the url value changes.
  watch(url, () => hydrate());

  return {
    url,
    isAnonymous,
    isLoaded,
    loadingText,
    cutoff,
    cutoffDefault,
    cutoffDebounced,
    hydrate,
  };
});
