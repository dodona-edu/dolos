import * as d3 from "d3";
import { ComputedRef, computed } from "@vue/composition-api";
import { useFileStore } from "@/api/stores";

export type Legend = {
  [key: string]: { label: string; selected: boolean; color: string };
};

/**
 * Create a legend for the available files.
 */
export function useLegend(): ComputedRef<Legend> {
  const fileStore = useFileStore();

  return computed((): Legend => {
    const labels = new Set<string>();

    for (const file of Object.values(fileStore.files)) {
      labels.add(file.extra.labels || "N/A");
    }

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10.filter((c) => c !== "#7f7f7f"))
      .domain([...labels].reverse());

    const legend = [...labels].sort().map((p) => ({
      label: p,
      selected: true,
      color: colorScale(p),
    }));

    return Object.fromEntries(legend.map((l) => [l.label, l]));
  });
}
