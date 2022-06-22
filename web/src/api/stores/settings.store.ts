import { defineStore } from "pinia";
import { ref } from "@vue/composition-api";
/**
 * Store containing global settings.
 */
export const useSettingsStore = defineStore("settings", () => {
  // Is the names should be anonymized.
  const isAnonymous = ref(false);

  return {
    isAnonymous,
  };
});
