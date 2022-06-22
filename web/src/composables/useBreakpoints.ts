import { computed, ComputedRef } from "@vue/composition-api";
import { Breakpoint } from "vuetify/types/services/breakpoint";
import { useVuetify } from "@/composables";

type Breakpoints = Breakpoint & {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

export function useBreakpoints(): ComputedRef<Breakpoints> {
  const vuetify = useVuetify();
  const breakpoint = vuetify.breakpoint;

  return computed(() => ({
    ...breakpoint,
    mobile: breakpoint.smAndDown,
    tablet: breakpoint.mdAndUp,
    desktop: breakpoint.lgAndUp,
  }));
}
