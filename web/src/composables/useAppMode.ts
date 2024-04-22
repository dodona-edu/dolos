import { DATA_URL } from "@/api";
import { useReportsStore } from "@/stores";
import { computed } from "vue";

/**
 * If the app is running in server mode or analytics mode.
 */
export function useAppMode() {
  const appMode = computed(() => import.meta.env.VITE_MODE);
  const isServer = computed(() => appMode.value === "server");

  const reports = useReportsStore();
  // URL to the report.
  const reportUrl = computed(() => {
    if (import.meta.env.VITE_MODE === "server") {
      if (reports.currentReport?.hasFinalStatus()) {
        return reports.currentReport.url;
      } else {
        return undefined;
      }
    } else {
      return DATA_URL;
    }
  });

  // URL to the data.
  const dataUrl = computed(() => {
    if (import.meta.env.VITE_MODE === "server") {
      return reportUrl.value ? `${reportUrl.value}/data` : undefined;
    } else {
      return DATA_URL;
    }
  });

  return {
    appMode,
    isServer,
    reportUrl,
    dataUrl,
  };
}
