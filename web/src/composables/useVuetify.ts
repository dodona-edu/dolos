import { getCurrentInstance } from "vue";
import { Framework } from "vuetify";

/**
 * Composable for getting the Vuetify root instance.
 */
export function useVuetify(): Framework {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("Should be used in setup().");
  }
  return instance.proxy.$vuetify;
}
