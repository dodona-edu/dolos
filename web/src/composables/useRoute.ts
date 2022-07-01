import { getCurrentInstance, computed, ComputedRef } from "@vue/composition-api";
import { Route } from "vue-router";

/**
 * Composable for getting the current route instance.
 */
export function useRoute(): ComputedRef<Route> {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("Should be used in setup().");
  }
  return computed(() => instance.proxy.$route);
}
