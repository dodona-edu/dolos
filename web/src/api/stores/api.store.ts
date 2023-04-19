import { defineStore } from "pinia";
import { useAppMode, useRoute } from "@/composables";
import { shallowRef, watch, computed } from "vue";
import {
  useFileStore,
  useKgramStore,
  useMetadataStore,
  usePairStore,
} from "@/api/stores";
import { refDebounced } from "@vueuse/shared";
import { guessSimilarityThreshold } from "../utils";
import { useReportsStore } from "@/stores";

/**
 * Store managing the API.
 */
export const useApiStore = defineStore("api", () => {
  // API Stores
  const fileStore = useFileStore();
  const kgramStore = useKgramStore();
  const metadataStore = useMetadataStore();
  const pairStore = usePairStore();

  // Get the report id.
  const reports = useReportsStore();
  const route = useRoute();
  const report = computed(() => {
    const reportId = route.value.params?.referenceId as string;
    return reports.getReportByReferenceId(reportId);
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

  const { dataUrl } = useAppMode();

  // Re-hydrate the API stores when the anonymous value changes.
  watch(isAnonymous, () => fileStore.anonymize());
  // Re-hydrate the API stores when the url value changes.
  watch(dataUrl, () => hydrate());

  return {
    url: dataUrl,
    isAnonymous,
    isLoaded,
    loadingText,
    cutoff,
    cutoffDefault,
    cutoffDebounced,
    hydrate,
  };
});
