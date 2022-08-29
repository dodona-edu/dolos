import { storeToRefs } from "pinia";
import { WritableComputedRef, computed, unref } from "vue";
import { MaybeRef } from "@/util/Types";
import { File, Legend } from "@/api/models";
import { useFileStore } from "@/api/stores";

/**
 * Create a partial legend for the given files.
 */
export function usePartialLegend(files: MaybeRef<File[]>): WritableComputedRef<Legend> {
  const fileStore = useFileStore();
  const { legend } = storeToRefs(fileStore);

  return computed({
    get() {
      const value = unref(files);
      if (!value) return {};

      const partialLegend = { ...legend.value };

      // Remove keys that do not have a label in the filesset.
      for (const key of Object.keys(partialLegend)) {
        if (!value.some(f => f.extra.labels === key)) {
          delete partialLegend[key];
        }
      }

      return partialLegend;
    },
    set(value) {
      legend.value = { ...legend.value, ...value };
    }
  });
}
