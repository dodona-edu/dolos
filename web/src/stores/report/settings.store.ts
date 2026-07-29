import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { refDebounced } from "@vueuse/shared";

export const useSettingsStore = defineStore("settings", () => {
  const isAnonymous = shallowRef(false);
  const cutoff = shallowRef(0.75);
  const cutoffDefault = shallowRef(0.75);
  const cutoffDebounced = refDebounced(cutoff, 100);

  return { isAnonymous, cutoff, cutoffDefault, cutoffDebounced };
});
