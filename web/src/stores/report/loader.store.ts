import { defineStore } from "pinia";
import { shallowRef } from "vue";

/**
 * Shared loading state for the analysis layout. Both the initial report
 * hydration (useReportLoader) and in-place operations like anonymize
 * (file.store) write here so the layout can show a single loading overlay.
 */
export const useLoaderStore = defineStore("loader", () => {
  const loading = shallowRef(true);
  const loadingText = shallowRef("Loading...");
  const error = shallowRef<Error | string | undefined>();
  return { loading, loadingText, error };
});
