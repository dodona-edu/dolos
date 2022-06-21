import { computed, ComputedRef } from "@vue/composition-api";
import { Breakpoint } from "vuetify/types/services/breakpoint";
import { useVuetify } from "./useVuetify";

/**
 * Composable for getting the Vuetify breakpoints.
 */
export function useBreakpoints(): ComputedRef<Breakpoint> {
  const vuetify = useVuetify();
  const breakpoint = vuetify.breakpoint;

  return computed(() => ({
    ...breakpoint,
  }));
}
