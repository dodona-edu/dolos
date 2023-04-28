import { getCurrentInstance } from "vue";
import VueRouter from "vue-router";

/**
 * Composable for getting the Vue Router root instance.
 */
export function useRouter(): VueRouter {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("Should be used in setup().");
  }
  return instance.proxy.$router;
}
